require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const db = require('./db-adapter');

const app = express();

// Em produção, o app roda atrás de um proxy reverso (Nginx no VPS, ou o balanceador
// do Render). Isso avisa o Express para confiar no cabeçalho X-Forwarded-For enviado
// pelo proxy, usando o IP real do visitante (em vez do IP interno do proxy) para
// identificar clientes — necessário para o rate limiting do login funcionar corretamente
// e evitar o erro "ERR_ERL_UNEXPECTED_X_FORWARDED_FOR" do express-rate-limit.
// Valor 1 = confia apenas no primeiro proxy à frente do app (o Nginx local).
if (process.env.TRUST_PROXY !== 'false') {
  app.set('trust proxy', 1);
}

// Ordem hierárquica dos postos e graduações do Exército, do mais alto para o mais baixo
// (mesma ordem usada na carga inicial da tabela de soldos em database.js / init-pg.js).
const ORDEM_POSTOS = [
  'General de Exército',
  'General de Divisão',
  'General de Brigada',
  'Coronel',
  'Tenente-Coronel',
  'Major',
  'Capitão',
  'Primeiro-Tenente',
  'Segundo-Tenente',
  'Aspirante a Oficial',
  'Subtenente',
  'Primeiro-Sargento',
  'Segundo-Sargento',
  'Terceiro-Sargento',
  'Cabo',
  'Soldado',
  'Cabo / Soldado (recruta)'
];

// Gera um trecho SQL "CASE alias.posto_graduacao WHEN ... THEN 0 ... ELSE 999 END"
// para ordenar por hierarquia militar em vez de ordem alfabética.
// Postos não mapeados (ex.: cadastrados fora da lista padrão) vão para o final.
function ordemPostoSql(alias) {
  const casos = ORDEM_POSTOS
    .map((posto, idx) => `WHEN '${posto.replace(/'/g, "''")}' THEN ${idx}`)
    .join(' ');
  return `CASE ${alias}.posto_graduacao ${casos} ELSE 999 END`;
}

const PORT = process.env.PORT || 3000;
const IS_PRODUCTION = process.env.NODE_ENV === 'production' || !!process.env.DATABASE_URL;

// JWT_SECRET: em produção é obrigatório vir de variável de ambiente.
// O render.yaml já gera esse valor automaticamente (generateValue: true).
// Em desenvolvimento local, usamos um valor fixo apenas para facilitar,
// mas exibimos um aviso para não deixar passar despercebido.
let JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  if (IS_PRODUCTION) {
    console.error('ERRO FATAL: variável de ambiente JWT_SECRET não definida em produção. Configure-a antes de iniciar o servidor.');
    process.exit(1);
  }
  JWT_SECRET = 'sisgp-dev-secret-local-apenas';
  console.warn('AVISO: usando JWT_SECRET padrão de desenvolvimento. Defina JWT_SECRET no .env antes de publicar o sistema.');
}

// CORS: em produção, restringe à origem definida em ALLOWED_ORIGIN.
// Sem essa variável configurada, mantém aberto (útil em dev), mas avisa.
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN;
if (ALLOWED_ORIGIN) {
  app.use(cors({ origin: ALLOWED_ORIGIN }));
} else {
  if (IS_PRODUCTION) {
    console.warn('AVISO: ALLOWED_ORIGIN não definida em produção. CORS está aberto para qualquer origem. Defina ALLOWED_ORIGIN com o domínio final do sistema.');
  }
  app.use(cors());
}

app.use(express.json());

// Rate limiting no login: no máximo 10 tentativas a cada 15 minutos por IP,
// para dificultar ataques de força bruta contra matrícula/senha.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas tentativas de login. Tente novamente em alguns minutos.' }
});

// Servir arquivos estáticos do frontend (pasta public)
app.use(express.static(path.join(__dirname, '../../public')));

// Middleware de Autenticação
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token de acesso não fornecido.' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido ou expirado.' });
    }
    req.user = user;
    next();
  });
}

// Middleware de autorização para Administrador
function authorizeAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Acesso negado. Apenas administradores podem realizar esta ação.' });
  }
  next();
}

// Função utilitária para calcular a diferença de dias inclusive
function calcularDias(inicio, termino) {
  const date1 = new Date(inicio);
  const date2 = new Date(termino);
  const diffTime = date2 - date1;
  if (diffTime <= 0) return 0;
  
  const totalHours = diffTime / (1000 * 60 * 60);
  const diasCompletos = Math.floor(totalHours / 24);
  const horasRestantes = totalHours % 24;
  
  // Se a fração restante de horas for >= 8h, conta como mais um dia
  return horasRestantes >= 8 ? diasCompletos + 1 : diasCompletos;
}

// Calcular padrão de dispensas (1 dia para Mon-Fri, 1 dia para Sat-Sun por semana ISO)
function calcularDispensasPadrao(inicioStr, terminoStr) {
  const start = new Date(inicioStr);
  const end = new Date(terminoStr);
  
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
    return 0;
  }
  
  const semanasWeekday = new Set();
  const Saturdays = new Set();
  const Sundays = new Set();
  
  const current = new Date(start);
  const tempEnd = new Date(end);
  
  current.setHours(0, 0, 0, 0);
  tempEnd.setHours(0, 0, 0, 0);
  
  while (current <= tempEnd) {
    const dayOfWeek = current.getDay(); // 0 = Domingo, 1 = Segunda, ..., 6 = Sábado
    
    // Obter segunda-feira correspondente à semana ISO do dia corrente
    const diffToMonday = current.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const mondayOfWeek = new Date(current);
    mondayOfWeek.setDate(diffToMonday);
    mondayOfWeek.setHours(0, 0, 0, 0);
    const weekKey = mondayOfWeek.toISOString().slice(0, 10);
    
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      semanasWeekday.add(weekKey);
    } else if (dayOfWeek === 6) {
      Saturdays.add(weekKey);
    } else if (dayOfWeek === 0) {
      Sundays.add(weekKey);
    }
    
    current.setDate(current.getDate() + 1);
  }
  
  let weekendDispensas = 0;
  for (const weekKey of Saturdays) {
    if (Sundays.has(weekKey)) {
      weekendDispensas++;
    }
  }
  
  return semanasWeekday.size + weekendDispensas;
}


// ----------------------------------------------------
// ROTAS PÚBLICAS
// ----------------------------------------------------

// Rota de Login
app.post('/api/login', loginLimiter, (req, res) => {
  const { matricula, senha } = req.body;

  if (!matricula || !senha) {
    return res.status(400).json({ error: 'Matrícula e senha são obrigatórias.' });
  }

  db.get('SELECT * FROM usuarios WHERE matricula = ?', [matricula], (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Erro no servidor ao buscar usuário.' });
    }

    if (!user) {
      return res.status(401).json({ error: 'Matrícula ou senha incorretas.' });
    }

    const senhaValida = bcrypt.compareSync(senha, user.senha);
    if (!senhaValida) {
      return res.status(401).json({ error: 'Matrícula ou senha incorretas.' });
    }

    const token = jwt.sign(
      { id: user.id, matricula: user.matricula, role: user.role, nome: user.nome },
      JWT_SECRET,
      { expiresIn: '2h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        matricula: user.matricula,
        nome: user.nome,
        posto_graduacao: user.posto_graduacao,
        soldo: user.soldo,
        role: user.role
      }
    });
  });
});

// ----------------------------------------------------
// ROTAS AUTENTICADAS (COMUNS A TODOS OS USUÁRIOS)
// ----------------------------------------------------

// Obter os postos e graduações cadastrados (Público para alimentar o select de cadastro)
app.get('/api/soldos', (req, res) => {
  db.all('SELECT * FROM soldos ORDER BY soldo DESC', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao obter tabela de soldos.' });
    }
    res.json(rows);
  });
});

// Rota de Cadastro Público (Desativada - apenas admin pode cadastrar militares)
app.post('/api/signup', (req, res) => {
  return res.status(403).json({ error: 'O cadastro público está desativado. Entre em contato com o Administrador do sistema para ser cadastrado.' });
});

// Obter dados do usuário atual e resumo dos saldos
app.get('/api/membro/resumo', authenticateToken, (req, res) => {
  const userId = req.user.id;

  // Buscar dados do usuário
  db.get('SELECT id, matricula, nome, posto_graduacao, soldo, role, saldo_inicial_dispensas FROM usuarios WHERE id = ?', [userId], (err, user) => {
    if (err || !user) {
      return res.status(500).json({ error: 'Erro ao buscar dados do usuário.' });
    }

    // Buscar Missões
    db.all('SELECT * FROM missoes WHERE usuario_id = ? ORDER BY data_inicio DESC', [userId], (errMissoes, missoes) => {
      if (errMissoes) return res.status(500).json({ error: 'Erro ao obter missões.' });

      // Buscar Férias
      db.all('SELECT * FROM ferias WHERE usuario_id = ? ORDER BY data_inicio DESC', [userId], (errFerias, ferias) => {
        if (errFerias) return res.status(500).json({ error: 'Erro ao obter férias.' });

        // Buscar Dispensas
        db.all('SELECT * FROM dispensas WHERE usuario_id = ? ORDER BY data_inicio DESC', [userId], (errDispensas, dispensas) => {
          if (errDispensas) return res.status(500).json({ error: 'Erro ao obter dispensas.' });

          // Buscar Saques Etapa
          db.all('SELECT * FROM saques_etapa WHERE usuario_id = ? ORDER BY data_inicio DESC', [userId], (errSaques, saques_etapa) => {
            if (errSaques) return res.status(500).json({ error: 'Erro ao obter saques etapa.' });

            // Calcular acumulados e totais
            const totalDiasMissao = missoes.reduce((acc, m) => acc + m.dias_missao, 0);
            const totalGratificacao = missoes.reduce((acc, m) => acc + m.gratificacao_representacao, 0);
            const totalSaqueAlimentacao = missoes.reduce((acc, m) => acc + m.saque_alimentacao, 0);
            
            // Dispensas acumuladas das missões + saldo inicial
            const dispensasAcumuladas = missoes.reduce((acc, m) => acc + m.dispensas_concedidas, 0) + user.saldo_inicial_dispensas;

            // Dispensas utilizadas (apenas as de tipo 'missao' com status 'Aprovada')
            const dispensasUtilizadas = dispensas
              .filter(d => d.status === 'Aprovada' && d.tipo_dispensa !== 'comum')
              .reduce((acc, d) => acc + d.dias_dispensa, 0);

            const dispensasRestantes = dispensasAcumuladas - dispensasUtilizadas;

            res.json({
              user,
              resumo: {
                totalDiasMissao,
                totalGratificacao,
                totalSaqueAlimentacao,
                dispensasAcumuladas,
                dispensasUtilizadas,
                dispensasRestantes
              },
              missoes,
              ferias,
              dispensas,
              saques_etapa
            });
          });
        });
      });
    });
  });
});

// Lançar solicitação de dispensa (membro solicita, fica Pendente)
app.post('/api/membro/dispensas', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const { data_inicio, data_termino, observacao, tipo_dispensa } = req.body;

  if (!data_inicio || !data_termino) {
    return res.status(400).json({ error: 'Datas de início e término são obrigatórias.' });
  }

  const dias = calcularDias(data_inicio, data_termino);
  if (dias <= 0) {
    return res.status(400).json({ error: 'A data e hora de término devem ser posteriores à data e hora de início.' });
  }

  const tipo = tipo_dispensa === 'comum' ? 'comum' : 'missao';

  db.run(
    `INSERT INTO dispensas (usuario_id, data_inicio, data_termino, dias_dispensa, status, observacao, tipo_dispensa) 
     VALUES (?, ?, ?, ?, 'Pendente', ?, ?)`,
    [userId, data_inicio, data_termino, dias, observacao || '', tipo],
    function (err) {
      if (err) {
        return res.status(500).json({ error: 'Erro ao lançar solicitação de dispensa.' });
      }
      res.json({ id: this.lastID, message: 'Solicitação de dispensa lançada com sucesso. Aguardando aprovação.' });
    }
  );
});

// ----------------------------------------------------
// ROTAS EXCLUSIVAS DO ADMINISTRADOR
// ----------------------------------------------------

// Obter todos os usuários (pessoal) com resumo rápido de saldo de dispensas
app.get('/api/admin/usuarios', authenticateToken, authorizeAdmin, (req, res) => {
  const query = `
    SELECT u.id, u.matricula, u.nome, u.posto_graduacao, u.soldo, u.role, u.saldo_inicial_dispensas, u.observacao,
      (SELECT COALESCE(SUM(m.dispensas_concedidas), 0) FROM missoes m WHERE m.usuario_id = u.id) as dispensas_missoes,
      (SELECT COALESCE(SUM(d.dias_dispensa), 0) FROM dispensas d WHERE d.usuario_id = u.id AND d.status = 'Aprovada') as dispensas_utilizadas
    FROM usuarios u
    ORDER BY ${ordemPostoSql('u')} ASC, u.nome ASC
  `;

  db.all(query, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao listar usuários.' });
    }

    const usuariosProcessados = rows.map(u => {
      const acumuladas = u.dispensas_missoes + u.saldo_inicial_dispensas;
      const restantes = acumuladas - u.dispensas_utilizadas;
      return {
        id: u.id,
        matricula: u.matricula,
        nome: u.nome,
        posto_graduacao: u.posto_graduacao,
        soldo: u.soldo,
        role: u.role,
        saldo_inicial_dispensas: u.saldo_inicial_dispensas,
        observacao: u.observacao || '',
        dispensas_acumuladas: acumuladas,
        dispensas_utilizadas: u.dispensas_utilizadas,
        dispensas_restantes: restantes
      };
    });

    res.json(usuariosProcessados);
  });
});

// Cadastrar novo militar (usuário)
app.post('/api/admin/usuarios', authenticateToken, authorizeAdmin, (req, res) => {
  const { matricula, nome, senha, posto_graduacao, soldo, role, saldo_inicial_dispensas, observacao } = req.body;

  if (!matricula || !nome || !senha || !posto_graduacao || soldo === undefined) {
    return res.status(400).json({ error: 'Todos os campos obrigatórios devem ser preenchidos.' });
  }

  const salt = bcrypt.genSaltSync(10);
  const hashSenha = bcrypt.hashSync(senha, salt);

  db.run(
    `INSERT INTO usuarios (matricula, nome, senha, posto_graduacao, soldo, role, saldo_inicial_dispensas, observacao) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [matricula, nome, hashSenha, posto_graduacao, soldo, role || 'membro', saldo_inicial_dispensas || 0, observacao || ''],
    function (err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(400).json({ error: 'Esta matrícula já está cadastrada.' });
        }
        return res.status(500).json({ error: 'Erro ao cadastrar usuário.' });
      }
      res.json({ id: this.lastID, message: 'Usuário cadastrado com sucesso!' });
    }
  );
});

// Atualizar militar
app.put('/api/admin/usuarios/:id', authenticateToken, authorizeAdmin, (req, res) => {
  const userId = req.params.id;
  const { matricula, nome, senha, posto_graduacao, soldo, role, saldo_inicial_dispensas, observacao } = req.body;

  if (!matricula || !nome || !posto_graduacao || soldo === undefined) {
    return res.status(400).json({ error: 'Campos matrícula, nome, posto e soldo são obrigatórios.' });
  }

  // Se a senha foi fornecida, atualiza a senha também
  if (senha && senha.trim() !== '') {
    const salt = bcrypt.genSaltSync(10);
    const hashSenha = bcrypt.hashSync(senha, salt);

    db.run(
      `UPDATE usuarios 
       SET matricula = ?, nome = ?, senha = ?, posto_graduacao = ?, soldo = ?, role = ?, saldo_inicial_dispensas = ?, observacao = ? 
       WHERE id = ?`,
      [matricula, nome, hashSenha, posto_graduacao, soldo, role, saldo_inicial_dispensas, observacao || '', userId],
      function (err) {
        if (err) {
          if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(400).json({ error: 'Esta matrícula já está sendo usada por outro usuário.' });
          }
          return res.status(500).json({ error: 'Erro ao atualizar usuário.' });
        }
        res.json({ message: 'Usuário e senha atualizados com sucesso!' });
      }
    );
  } else {
    // Atualizar sem alterar a senha
    db.run(
      `UPDATE usuarios 
       SET matricula = ?, nome = ?, posto_graduacao = ?, soldo = ?, role = ?, saldo_inicial_dispensas = ?, observacao = ? 
       WHERE id = ?`,
      [matricula, nome, posto_graduacao, soldo, role, saldo_inicial_dispensas, observacao || '', userId],
      function (err) {
        if (err) {
          if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(400).json({ error: 'Esta matrícula já está sendo usada por outro usuário.' });
          }
          return res.status(500).json({ error: 'Erro ao atualizar usuário.' });
        }
        res.json({ message: 'Usuário atualizado com sucesso!' });
      }
    );
  }
});

// Obter resumo de um militar específico (para uso do administrador ao gerar relatórios)
app.get('/api/admin/usuarios/:id/resumo', authenticateToken, authorizeAdmin, (req, res) => {
  const userId = req.params.id;

  db.get('SELECT id, matricula, nome, posto_graduacao, soldo, role, saldo_inicial_dispensas FROM usuarios WHERE id = ?', [userId], (err, user) => {
    if (err || !user) {
      return res.status(404).json({ error: 'Militar não encontrado.' });
    }

    db.all('SELECT * FROM missoes WHERE usuario_id = ? ORDER BY data_inicio DESC', [userId], (errMissoes, missoes) => {
      if (errMissoes) return res.status(500).json({ error: 'Erro ao obter missões.' });

      db.all('SELECT * FROM ferias WHERE usuario_id = ? ORDER BY data_inicio DESC', [userId], (errFerias, ferias) => {
        if (errFerias) return res.status(500).json({ error: 'Erro ao obter férias.' });

        db.all('SELECT * FROM dispensas WHERE usuario_id = ? ORDER BY data_inicio DESC', [userId], (errDispensas, dispensas) => {
          if (errDispensas) return res.status(500).json({ error: 'Erro ao obter dispensas.' });

          db.all('SELECT * FROM saques_etapa WHERE usuario_id = ? ORDER BY data_inicio DESC', [userId], (errSaques, saques_etapa) => {
            if (errSaques) return res.status(500).json({ error: 'Erro ao obter saques etapa.' });

            const totalDiasMissao = missoes.reduce((acc, m) => acc + m.dias_missao, 0);
            const totalGratificacao = missoes.reduce((acc, m) => acc + m.gratificacao_representacao, 0);
            const totalSaqueAlimentacao = missoes.reduce((acc, m) => acc + m.saque_alimentacao, 0);
            
            const dispensasAcumuladas = missoes.reduce((acc, m) => acc + m.dispensas_concedidas, 0) + user.saldo_inicial_dispensas;
            const dispensasUtilizadas = dispensas
              .filter(d => d.status === 'Aprovada' && d.tipo_dispensa !== 'comum')
              .reduce((acc, d) => acc + d.dias_dispensa, 0);

            const dispensasRestantes = dispensasAcumuladas - dispensasUtilizadas;

            res.json({
              user,
              resumo: {
                totalDiasMissao,
                totalGratificacao,
                totalSaqueAlimentacao,
                dispensasAcumuladas,
                dispensasUtilizadas,
                dispensasRestantes
              },
              missoes,
              ferias,
              dispensas,
              saques_etapa
            });
          });
        });
      });
    });
  });
});

// Excluir militar
app.delete('/api/admin/usuarios/:id', authenticateToken, authorizeAdmin, (req, res) => {
  const userId = req.params.id;

  // Impedir auto-exclusão
  if (parseInt(userId) === req.user.id) {
    return res.status(400).json({ error: 'Não é possível excluir o próprio usuário logado.' });
  }

  db.run('DELETE FROM usuarios WHERE id = ?', [userId], function (err) {
    if (err) {
      return res.status(500).json({ error: 'Erro ao excluir usuário.' });
    }
    res.json({ message: 'Usuário excluído com sucesso!' });
  });
});

// Lançar Missão/Deslocamento para um militar (Administrador faz isso e concede dispensas)
app.post('/api/admin/missoes', authenticateToken, authorizeAdmin, (req, res) => {
  const {
    usuario_id, nome_deslocamento, descricao, data_inicio, data_termino, dispensas_concedidas,
    tipo_deslocamento, gratificacao_localidade_pct, pagar_gratificacao, pagar_ajuda_custo, dias_gratificacao,
    receber_saque_alimentacao, dias_saque_alimentacao, qtd_saque_alimentacao,
    bi_deslocamento, bi_retorno, bi_solicitacao_gratificacao, bi_autorizacao_pagamento,
    bi_pagamento, bi_solicitacao_saque_alimentacao, bi_pagamento_saque_etapa, observacao_pagamento
  } = req.body;

  if (!usuario_id || !nome_deslocamento || !data_inicio || !data_termino || !tipo_deslocamento) {
    return res.status(400).json({ error: 'Dados incompletos para lançamento de deslocamento.' });
  }

  const dias = calcularDias(data_inicio, data_termino);
  if (dias <= 0) {
    return res.status(400).json({ error: 'A data e hora de término devem ser posteriores à data e hora de início.' });
  }

  // Buscar o soldo do usuário para calcular a Gratificação de Representação e Ajuda de Custo
  db.get('SELECT soldo FROM usuarios WHERE id = ?', [usuario_id], (err, user) => {
    if (err || !user) {
      return res.status(400).json({ error: 'Militar não encontrado no sistema.' });
    }

    // Regras automáticas baseadas no tipo de deslocamento
    let isPagarGratificacao = false;
    let isPagarAjudaCusto = false;
    let diasRep = dias;

    if (['Missão', 'Reconhecimento', 'Adestramento'].includes(tipo_deslocamento)) {
      isPagarGratificacao = true;
    } else if (tipo_deslocamento === 'Cursos/Estágio') {
      isPagarGratificacao = pagar_gratificacao;
      isPagarAjudaCusto = pagar_ajuda_custo;
      if (dias_gratificacao && parseInt(dias_gratificacao) > 0) {
        diasRep = parseInt(dias_gratificacao);
      }
    }

    // 1. Gratificação de Representação = 2% do soldo por dia
    const gratificacao = isPagarGratificacao ? (user.soldo * 0.02 * diasRep) : 0;
    // 2. Ajuda de Custo = 1 soldo inteiro se ativa
    const ajudaDeCusto = isPagarAjudaCusto ? user.soldo : 0;
    // 3. Saque Alimentação (Manual)
    const isReceberSaque = receber_saque_alimentacao === true || receber_saque_alimentacao === 'true' || receber_saque_alimentacao === 1;
    let diasSaque = isReceberSaque ? (dias_saque_alimentacao ? parseInt(dias_saque_alimentacao) : dias) : 0;
    let qtdSaque = isReceberSaque ? (qtd_saque_alimentacao ? parseInt(qtd_saque_alimentacao) : 1) : 0;
    const saqueAlimentacao = isReceberSaque ? (13.50 * diasSaque * qtdSaque) : 0;
    // 4. Dispensas Concedidas = padrão de 1 dia por segunda-a-sexta e 1 dia por sábado-e-domingo se não fornecido
    const dispensas = dispensas_concedidas !== undefined && dispensas_concedidas !== '' ? parseInt(dispensas_concedidas) : calcularDispensasPadrao(data_inicio, data_termino);
    // 5. Gratificação de Localidade (Proporcional a 30 dias)
    const percentualLocalidade = gratificacao_localidade_pct ? parseInt(gratificacao_localidade_pct) : 0;
    const gratificacaoLocalidadeValor = (user.soldo * (percentualLocalidade / 100) / 30) * dias;

    db.run(
      `INSERT INTO missoes (
         usuario_id, nome_deslocamento, descricao, tipo_deslocamento, data_inicio, data_termino, dias_missao, 
         gratificacao_representacao, saque_alimentacao, dispensas_concedidas,
         bi_deslocamento, bi_retorno, bi_solicitacao_gratificacao, bi_autorizacao_pagamento, bi_pagamento, 
         bi_solicitacao_saque_alimentacao, bi_pagamento_saque_etapa, observacao_pagamento,
         pagar_gratificacao, pagar_ajuda_custo, ajuda_de_custo, gratificacao_localidade_pct, gratificacao_localidade_valor, dias_gratificacao,
         receber_saque_alimentacao, dias_saque_alimentacao, qtd_saque_alimentacao
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        usuario_id, nome_deslocamento, descricao || '', tipo_deslocamento, data_inicio, data_termino, dias, 
        gratificacao, saqueAlimentacao, dispensas,
        bi_deslocamento || '', bi_retorno || '', bi_solicitacao_gratificacao || '', bi_autorizacao_pagamento || '',
        bi_pagamento || '', bi_solicitacao_saque_alimentacao || '', bi_pagamento_saque_etapa || '', observacao_pagamento || '',
        isPagarGratificacao ? 1 : 0, isPagarAjudaCusto ? 1 : 0, ajudaDeCusto, percentualLocalidade, gratificacaoLocalidadeValor, diasRep,
        isReceberSaque ? 1 : 0, diasSaque, qtdSaque
      ],
      function (insertErr) {
        if (insertErr) {
          console.error(insertErr);
          return res.status(500).json({ error: 'Erro ao registrar deslocamento.' });
        }
        res.json({
          id: this.lastID,
          message: 'Deslocamento registrado com sucesso!',
          calculos: {
            dias,
            gratificacao,
            saqueAlimentacao,
            dispensas,
            ajudaDeCusto,
            gratificacaoLocalidadeValor
          }
        });
      }
    );
  });
});

// Editar deslocamento existente (Admin)
app.put('/api/admin/missoes/:id', authenticateToken, authorizeAdmin, (req, res) => {
  const missaoId = req.params.id;
  const { 
    usuario_id, nome_deslocamento, descricao, data_inicio, data_termino, dispensas_concedidas,
    tipo_deslocamento, gratificacao_localidade_pct, pagar_gratificacao, pagar_ajuda_custo, dias_gratificacao,
    receber_saque_alimentacao, dias_saque_alimentacao, qtd_saque_alimentacao,
    bi_deslocamento, bi_retorno, bi_solicitacao_gratificacao, bi_autorizacao_pagamento,
    bi_pagamento, bi_solicitacao_saque_alimentacao, bi_pagamento_saque_etapa, observacao_pagamento
  } = req.body;

  if (!nome_deslocamento || !data_inicio || !data_termino || !tipo_deslocamento) {
    return res.status(400).json({ error: 'Dados incompletos para edição de deslocamento.' });
  }

  const dias = calcularDias(data_inicio, data_termino);
  if (dias <= 0) {
    return res.status(400).json({ error: 'A data e hora de término devem ser posteriores à data e hora de início.' });
  }

  // Para o Admin, usamos o usuario_id enviado no corpo ou mantemos o da missão se não vier (mas deveria vir).
  db.get('SELECT usuario_id FROM missoes WHERE id = ?', [missaoId], (err, missao) => {
    if (err || !missao) {
      return res.status(404).json({ error: 'Deslocamento não encontrado.' });
    }
    const finalUsuarioId = usuario_id || missao.usuario_id;

    db.get('SELECT soldo FROM usuarios WHERE id = ?', [finalUsuarioId], (err, user) => {
      if (err || !user) {
        return res.status(400).json({ error: 'Militar não encontrado no sistema.' });
      }

      let isPagarGratificacao = false;
      let isPagarAjudaCusto = false;
      let diasRep = dias;

      if (['Missão', 'Reconhecimento', 'Adestramento'].includes(tipo_deslocamento)) {
        isPagarGratificacao = true;
      } else if (tipo_deslocamento === 'Cursos/Estágio') {
        isPagarGratificacao = pagar_gratificacao;
        isPagarAjudaCusto = pagar_ajuda_custo;
        if (dias_gratificacao && parseInt(dias_gratificacao) > 0) {
          diasRep = parseInt(dias_gratificacao);
        }
      }

      const gratificacao = isPagarGratificacao ? (user.soldo * 0.02 * diasRep) : 0;
      const ajudaDeCusto = isPagarAjudaCusto ? user.soldo : 0;

      const isReceberSaque = receber_saque_alimentacao === true || receber_saque_alimentacao === 'true' || receber_saque_alimentacao === 1;
      let diasSaque = isReceberSaque ? (dias_saque_alimentacao ? parseInt(dias_saque_alimentacao) : dias) : 0;
      let qtdSaque = isReceberSaque ? (qtd_saque_alimentacao ? parseInt(qtd_saque_alimentacao) : 1) : 0;
      const saqueAlimentacao = isReceberSaque ? (13.50 * diasSaque * qtdSaque) : 0;

      const dispensas = dispensas_concedidas !== undefined && dispensas_concedidas !== '' ? parseInt(dispensas_concedidas) : calcularDispensasPadrao(data_inicio, data_termino);
      const percentualLocalidade = gratificacao_localidade_pct ? parseInt(gratificacao_localidade_pct) : 0;
      const gratificacaoLocalidadeValor = (user.soldo * (percentualLocalidade / 100) / 30) * dias;

      db.run(
        `UPDATE missoes SET 
           usuario_id = ?, nome_deslocamento = ?, descricao = ?, tipo_deslocamento = ?, data_inicio = ?, data_termino = ?, 
           dias_missao = ?, gratificacao_representacao = ?, saque_alimentacao = ?, dispensas_concedidas = ?,
           bi_deslocamento = ?, bi_retorno = ?, bi_solicitacao_gratificacao = ?, bi_autorizacao_pagamento = ?, bi_pagamento = ?, 
           bi_solicitacao_saque_alimentacao = ?, bi_pagamento_saque_etapa = ?, observacao_pagamento = ?,
           pagar_gratificacao = ?, pagar_ajuda_custo = ?, ajuda_de_custo = ?, gratificacao_localidade_pct = ?, 
           gratificacao_localidade_valor = ?, dias_gratificacao = ?, receber_saque_alimentacao = ?, 
           dias_saque_alimentacao = ?, qtd_saque_alimentacao = ?
         WHERE id = ?`,
        [
          finalUsuarioId, nome_deslocamento, descricao || '', tipo_deslocamento, data_inicio, data_termino, dias, 
          gratificacao, saqueAlimentacao, dispensas,
          bi_deslocamento !== undefined ? bi_deslocamento : '', 
          bi_retorno !== undefined ? bi_retorno : '', 
          bi_solicitacao_gratificacao !== undefined ? bi_solicitacao_gratificacao : '', 
          bi_autorizacao_pagamento !== undefined ? bi_autorizacao_pagamento : '',
          bi_pagamento !== undefined ? bi_pagamento : '', 
          bi_solicitacao_saque_alimentacao !== undefined ? bi_solicitacao_saque_alimentacao : '', 
          bi_pagamento_saque_etapa !== undefined ? bi_pagamento_saque_etapa : '', 
          observacao_pagamento !== undefined ? observacao_pagamento : '',
          isPagarGratificacao ? 1 : 0, isPagarAjudaCusto ? 1 : 0, ajudaDeCusto, percentualLocalidade, 
          gratificacaoLocalidadeValor, diasRep, isReceberSaque ? 1 : 0, diasSaque, qtdSaque,
          missaoId
        ],
        function (updateErr) {
          if (updateErr) {
            console.error(updateErr);
            return res.status(500).json({ error: 'Erro ao atualizar deslocamento.' });
          }
          res.json({ message: 'Deslocamento atualizado com sucesso!' });
        }
      );
    });
  });
});

// Lançar próprio deslocamento pelo usuário comum (membro)
app.post('/api/membro/missoes', authenticateToken, (req, res) => {
  const usuario_id = req.user.id;
  const { nome_deslocamento, descricao, data_inicio, data_termino, tipo_deslocamento, gratificacao_localidade_pct, pagar_gratificacao, pagar_ajuda_custo, dias_gratificacao, receber_saque_alimentacao, dias_saque_alimentacao, qtd_saque_alimentacao } = req.body;

  if (!nome_deslocamento || !data_inicio || !data_termino || !tipo_deslocamento) {
    return res.status(400).json({ error: 'Dados incompletos para lançamento de deslocamento.' });
  }

  const dias = calcularDias(data_inicio, data_termino);
  if (dias <= 0) {
    return res.status(400).json({ error: 'A data e hora de término devem ser posteriores à data e hora de início.' });
  }

  db.get('SELECT soldo FROM usuarios WHERE id = ?', [usuario_id], (err, user) => {
    if (err || !user) {
      return res.status(400).json({ error: 'Usuário não encontrado.' });
    }

    // Regras automáticas baseadas no tipo de deslocamento
    let isPagarGratificacao = false;
    let isPagarAjudaCusto = false;
    let diasRep = dias;

    if (['Missão', 'Reconhecimento', 'Adestramento'].includes(tipo_deslocamento)) {
      isPagarGratificacao = true;
    } else if (tipo_deslocamento === 'Cursos/Estágio') {
      isPagarGratificacao = pagar_gratificacao;
      isPagarAjudaCusto = pagar_ajuda_custo;
      if (dias_gratificacao && parseInt(dias_gratificacao) > 0) {
        diasRep = parseInt(dias_gratificacao);
      }
    }

    // 1. Gratificação de Representação
    const gratificacao = isPagarGratificacao ? (user.soldo * 0.02 * diasRep) : 0;
    // 2. Ajuda de Custo
    const ajudaDeCusto = isPagarAjudaCusto ? user.soldo : 0;
    // 3. Saque Alimentação
    const isReceberSaque = receber_saque_alimentacao === true || receber_saque_alimentacao === 'true' || receber_saque_alimentacao === 1;
    let diasSaque = isReceberSaque ? (dias_saque_alimentacao ? parseInt(dias_saque_alimentacao) : dias) : 0;
    let qtdSaque = isReceberSaque ? (qtd_saque_alimentacao ? parseInt(qtd_saque_alimentacao) : 1) : 0;
    const saqueAlimentacao = isReceberSaque ? (13.50 * diasSaque * qtdSaque) : 0;
    // 4. Dispensas Concedidas
    const dispensas = calcularDispensasPadrao(data_inicio, data_termino);
    // 5. Gratificação de Localidade (Proporcional a 30 dias)
    const percentualLocalidade = gratificacao_localidade_pct ? parseInt(gratificacao_localidade_pct) : 0;
    const gratificacaoLocalidadeValor = (user.soldo * (percentualLocalidade / 100) / 30) * dias;

    db.run(
      `INSERT INTO missoes (
         usuario_id, nome_deslocamento, descricao, tipo_deslocamento, data_inicio, data_termino, dias_missao, 
         gratificacao_representacao, saque_alimentacao, dispensas_concedidas,
         bi_deslocamento, bi_retorno, bi_solicitacao_gratificacao, bi_autorizacao_pagamento, bi_pagamento, 
         bi_solicitacao_saque_alimentacao, bi_pagamento_saque_etapa, observacao_pagamento,
         pagar_gratificacao, pagar_ajuda_custo, ajuda_de_custo, gratificacao_localidade_pct, gratificacao_localidade_valor, dias_gratificacao,
         receber_saque_alimentacao, dias_saque_alimentacao, qtd_saque_alimentacao
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '', '', '', '', '', '', '', '', ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [usuario_id, nome_deslocamento, descricao || '', tipo_deslocamento, data_inicio, data_termino, dias, gratificacao, saqueAlimentacao, dispensas, isPagarGratificacao ? 1 : 0, isPagarAjudaCusto ? 1 : 0, ajudaDeCusto, percentualLocalidade, gratificacaoLocalidadeValor, diasRep, isReceberSaque ? 1 : 0, diasSaque, qtdSaque],
      function (insertErr) {
        if (insertErr) {
          console.error(insertErr);
          return res.status(500).json({ error: 'Erro ao registrar deslocamento.' });
        }
        res.json({
          id: this.lastID,
          message: 'Deslocamento registrado com sucesso!',
          calculos: {
            dias,
            gratificacao,
            saqueAlimentacao,
            dispensas,
            ajudaDeCusto,
            gratificacaoLocalidadeValor
          }
        });
      }
    );
  });
});

// Editar deslocamento existente (Membro)
app.put('/api/membro/missoes/:id', authenticateToken, (req, res) => {
  const missaoId = req.params.id;
  const usuario_id = req.user.id;
  
  // Primeiro, verifica se a missão pertence ao usuário logado
  db.get('SELECT id FROM missoes WHERE id = ? AND usuario_id = ?', [missaoId, usuario_id], (err, row) => {
    if (err) return res.status(500).json({ error: 'Erro ao verificar permissão.' });
    if (!row) return res.status(403).json({ error: 'Você não tem permissão para editar este deslocamento.' });
    
    const {
      nome_deslocamento, descricao, data_inicio, data_termino,
      tipo_deslocamento, gratificacao_localidade_pct, pagar_gratificacao, pagar_ajuda_custo, dias_gratificacao,
      receber_saque_alimentacao, dias_saque_alimentacao, qtd_saque_alimentacao
    } = req.body;

    if (!nome_deslocamento || !data_inicio || !data_termino || !tipo_deslocamento) {
      return res.status(400).json({ error: 'Dados incompletos para edição de deslocamento.' });
    }

    const dias = calcularDias(data_inicio, data_termino);
    if (dias <= 0) {
      return res.status(400).json({ error: 'A data de término deve ser posterior à data de início.' });
    }

    db.get('SELECT soldo FROM usuarios WHERE id = ?', [usuario_id], (err, user) => {
      if (err || !user) return res.status(400).json({ error: 'Usuário não encontrado.' });

      let isPagarGratificacao = false;
      let isPagarAjudaCusto = false;
      let diasRep = dias;

      if (['Missão', 'Reconhecimento', 'Adestramento'].includes(tipo_deslocamento)) {
        isPagarGratificacao = true;
      } else if (tipo_deslocamento === 'Cursos/Estágio') {
        isPagarGratificacao = pagar_gratificacao;
        isPagarAjudaCusto = pagar_ajuda_custo;
        if (dias_gratificacao && parseInt(dias_gratificacao) > 0) {
          diasRep = parseInt(dias_gratificacao);
        }
      }

      const gratificacao = isPagarGratificacao ? (user.soldo * 0.02 * diasRep) : 0;
      const ajudaDeCusto = isPagarAjudaCusto ? user.soldo : 0;

      const isReceberSaque = receber_saque_alimentacao === true || receber_saque_alimentacao === 'true' || receber_saque_alimentacao === 1;
      let diasSaque = isReceberSaque ? (dias_saque_alimentacao ? parseInt(dias_saque_alimentacao) : dias) : 0;
      let qtdSaque = isReceberSaque ? (qtd_saque_alimentacao ? parseInt(qtd_saque_alimentacao) : 1) : 0;
      const saqueAlimentacao = isReceberSaque ? (13.50 * diasSaque * qtdSaque) : 0;

      const dispensas = calcularDispensasPadrao(data_inicio, data_termino);
      const percentualLocalidade = gratificacao_localidade_pct ? parseInt(gratificacao_localidade_pct) : 0;
      const gratificacaoLocalidadeValor = (user.soldo * (percentualLocalidade / 100) / 30) * dias;

      db.run(
        `UPDATE missoes SET 
           nome_deslocamento = ?, descricao = ?, tipo_deslocamento = ?, data_inicio = ?, data_termino = ?, 
           dias_missao = ?, gratificacao_representacao = ?, saque_alimentacao = ?, dispensas_concedidas = ?,
           pagar_gratificacao = ?, pagar_ajuda_custo = ?, ajuda_de_custo = ?, gratificacao_localidade_pct = ?, 
           gratificacao_localidade_valor = ?, dias_gratificacao = ?, receber_saque_alimentacao = ?, 
           dias_saque_alimentacao = ?, qtd_saque_alimentacao = ?
         WHERE id = ? AND usuario_id = ?`,
        [
          nome_deslocamento, descricao || '', tipo_deslocamento, data_inicio, data_termino, dias,
          gratificacao, saqueAlimentacao, dispensas,
          isPagarGratificacao ? 1 : 0, isPagarAjudaCusto ? 1 : 0, ajudaDeCusto, percentualLocalidade,
          gratificacaoLocalidadeValor, diasRep, isReceberSaque ? 1 : 0, diasSaque, qtdSaque,
          missaoId, usuario_id
        ],
        function (updateErr) {
          if (updateErr) return res.status(500).json({ error: 'Erro ao atualizar deslocamento.' });
          res.json({ message: 'Deslocamento atualizado com sucesso!' });
        }
      );
    });
  });
});

// Excluir deslocamento existente (Membro)
app.delete('/api/membro/missoes/:id', authenticateToken, (req, res) => {
  const missaoId = req.params.id;
  const usuario_id = req.user.id;

  db.run('DELETE FROM missoes WHERE id = ? AND usuario_id = ?', [missaoId, usuario_id], function (err) {
    if (err) return res.status(500).json({ error: 'Erro ao remover deslocamento.' });
    if (this.changes === 0) return res.status(403).json({ error: 'Você não tem permissão para excluir este deslocamento ou ele não existe.' });
    res.json({ message: 'Deslocamento removido com sucesso!' });
  });
});

// Atualizar status de pagamento via toggle (Admin)
app.put('/api/admin/missoes/:id/toggle_pagamento', authenticateToken, authorizeAdmin, (req, res) => {
  const { id } = req.params;
  const { campo, valor } = req.body;
  
  const camposPermitidos = ['gratificacao_paga', 'ajuda_custo_paga', 'localidade_paga', 'alimentacao_paga'];
  
  if (!camposPermitidos.includes(campo)) {
    return res.status(400).json({ error: 'Campo de pagamento inválido.' });
  }

  db.run(`UPDATE missoes SET ${campo} = ? WHERE id = ?`, [valor ? 1 : 0, id], function (err) {
    if (err) {
      return res.status(500).json({ error: 'Erro ao atualizar status do pagamento.' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Deslocamento não encontrado.' });
    }
    res.json({ message: 'Status do pagamento atualizado com sucesso!' });
  });
});

// Listar todas as missões com dados de usuários (para o Administrador na aba Pagamentos)
app.get('/api/admin/missoes', authenticateToken, authorizeAdmin, (req, res) => {
  const query = `
    SELECT m.*, u.nome, u.posto_graduacao 
    FROM missoes m 
    JOIN usuarios u ON m.usuario_id = u.id 
    ORDER BY m.data_inicio DESC
  `;
  db.all(query, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao obter todas as missões.' });
    }
    res.json(rows);
  });
});

// Atualizar boletins internos (BIs) de pagamento de uma missão
app.put('/api/admin/missoes/:id/pagamento', authenticateToken, authorizeAdmin, (req, res) => {
  const missaoId = req.params.id;
  const {
    bi_deslocamento, bi_retorno, bi_solicitacao_gratificacao, bi_autorizacao_pagamento,
    bi_pagamento, bi_solicitacao_saque_alimentacao, bi_pagamento_saque_etapa, observacao_pagamento
  } = req.body;

  db.run(
    `UPDATE missoes 
     SET bi_deslocamento = ?, bi_retorno = ?, bi_solicitacao_gratificacao = ?, bi_autorizacao_pagamento = ?,
         bi_pagamento = ?, bi_solicitacao_saque_alimentacao = ?, bi_pagamento_saque_etapa = ?, observacao_pagamento = ? 
     WHERE id = ?`,
    [
      bi_deslocamento || '', bi_retorno || '', bi_solicitacao_gratificacao || '', bi_autorizacao_pagamento || '',
      bi_pagamento || '', bi_solicitacao_saque_alimentacao || '', bi_pagamento_saque_etapa || '', observacao_pagamento || '',
      missaoId
    ],
    function (err) {
      if (err) {
        return res.status(500).json({ error: 'Erro ao atualizar dados de pagamento da missão.' });
      }
      res.json({ message: 'Dados de pagamento da missão atualizados com sucesso!' });
    }
  );
});

// Remover Missão
app.delete('/api/admin/missoes/:id', authenticateToken, authorizeAdmin, (req, res) => {
  const missaoId = req.params.id;
  db.run('DELETE FROM missoes WHERE id = ?', [missaoId], function (err) {
    if (err) {
      return res.status(500).json({ error: 'Erro ao remover missão.' });
    }
    res.json({ message: 'Missão removida com sucesso!' });
  });
});

// Registrar Férias para um militar
app.post('/api/admin/ferias', authenticateToken, authorizeAdmin, (req, res) => {
  const { usuario_id, data_inicio, data_termino } = req.body;

  if (!usuario_id || !data_inicio || !data_termino) {
    return res.status(400).json({ error: 'Dados incompletos para lançamento de férias.' });
  }

  const dias = calcularDias(data_inicio, data_termino);
  if (dias <= 0) {
    return res.status(400).json({ error: 'A data de término deve ser igual ou posterior à data de início.' });
  }

  db.run(
    `INSERT INTO ferias (usuario_id, data_inicio, data_termino, dias_ferias) 
     VALUES (?, ?, ?, ?)`,
    [usuario_id, data_inicio, data_termino, dias],
    function (err) {
      if (err) {
        return res.status(500).json({ error: 'Erro ao registrar férias.' });
      }
      res.json({ id: this.lastID, message: 'Férias registradas com sucesso!' });
    }
  );
});

// Remover Férias
app.delete('/api/admin/ferias/:id', authenticateToken, authorizeAdmin, (req, res) => {
  const feriasId = req.params.id;
  db.run('DELETE FROM ferias WHERE id = ?', [feriasId], function (err) {
    if (err) {
      return res.status(500).json({ error: 'Erro ao remover férias.' });
    }
    res.json({ message: 'Férias removidas com sucesso!' });
  });
});

// Editar Férias
app.put('/api/admin/ferias/:id', authenticateToken, authorizeAdmin, (req, res) => {
  const feriasId = req.params.id;
  const { data_inicio, data_termino } = req.body;

  if (!data_inicio || !data_termino) {
    return res.status(400).json({ error: 'Dados incompletos para edição de férias.' });
  }

  const dias = calcularDias(data_inicio, data_termino);
  if (dias <= 0) {
    return res.status(400).json({ error: 'A data de término deve ser igual ou posterior à data de início.' });
  }

  db.run(
    `UPDATE ferias SET data_inicio = ?, data_termino = ?, dias_ferias = ? WHERE id = ?`,
    [data_inicio, data_termino, dias, feriasId],
    function (err) {
      if (err) {
        return res.status(500).json({ error: 'Erro ao editar férias.' });
      }
      res.json({ message: 'Férias editadas com sucesso!' });
    }
  );
});

// Listar todas as solicitações de dispensa de todos os militares (para o Administrador)
app.get('/api/admin/dispensas', authenticateToken, authorizeAdmin, (req, res) => {
  const query = `
    SELECT d.id, d.usuario_id, d.data_inicio, d.data_termino, d.dias_dispensa, d.status, d.observacao, u.nome, u.posto_graduacao
    FROM dispensas d
    JOIN usuarios u ON d.usuario_id = u.id
    ORDER BY 
      CASE WHEN d.status = 'Pendente' THEN 1 ELSE 2 END, 
      d.data_inicio DESC
  `;

  db.all(query, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao obter solicitações de dispensas.' });
    }
    res.json(rows);
  });
});

// Aprovar/Rejeitar solicitação de dispensa
app.put('/api/admin/dispensas/:id', authenticateToken, authorizeAdmin, (req, res) => {
  const dispensaId = req.params.id;
  const { status } = req.body; // 'Aprovada' ou 'Rejeitada'

  if (status !== 'Aprovada' && status !== 'Rejeitada') {
    return res.status(400).json({ error: 'Status inválido. Use Aprovada ou Rejeitada.' });
  }

  // Se for aprovação, vamos checar se o usuário tem saldo suficiente!
  if (status === 'Aprovada') {
    db.get('SELECT d.usuario_id, d.dias_dispensa, d.tipo_dispensa, u.saldo_inicial_dispensas FROM dispensas d JOIN usuarios u ON d.usuario_id = u.id WHERE d.id = ?', [dispensaId], (err, disp) => {
      if (err || !disp) {
        return res.status(404).json({ error: 'Registro de dispensa não encontrado.' });
      }

      const userId = disp.usuario_id;
      const diasSolicitados = disp.dias_dispensa;

      // Se for dispensa comum/avulsa (não decorrente de missão), aprova diretamente
      if (disp.tipo_dispensa === 'comum') {
        db.run('UPDATE dispensas SET status = ? WHERE id = ?', [status, dispensaId], function (updateErr) {
          if (updateErr) return res.status(500).json({ error: 'Erro ao atualizar dispensa.' });
          res.json({ message: `Solicitação de dispensa ${status.toLowerCase()} com sucesso!` });
        });
        return;
      }

      // Calcular o saldo disponível
      db.get('SELECT COALESCE(SUM(dispensas_concedidas), 0) as acumuladas FROM missoes WHERE usuario_id = ?', [userId], (errM, rowM) => {
        db.get('SELECT COALESCE(SUM(dias_dispensa), 0) as utilizadas FROM dispensas WHERE usuario_id = ? AND status = \'Aprovada\' AND tipo_dispensa != \'comum\'', [userId], (errD, rowD) => {
          const acumuladasTotal = rowM.acumuladas + disp.saldo_inicial_dispensas;
          const utilizadasTotal = rowD.utilizadas;
          const saldoRestante = acumuladasTotal - utilizadasTotal;

          if (diasSolicitados > saldoRestante) {
            return res.status(400).json({ 
              error: `Militar não possui saldo de dispensa suficiente. Saldo restante: ${saldoRestante} dias. Dias solicitados: ${diasSolicitados} dias.` 
            });
          }

          // Saldo é suficiente, aprovar
          db.run('UPDATE dispensas SET status = ? WHERE id = ?', [status, dispensaId], function (updateErr) {
            if (updateErr) return res.status(500).json({ error: 'Erro ao atualizar dispensa.' });
            res.json({ message: `Solicitação de dispensa ${status.toLowerCase()} com sucesso!` });
          });
        });
      });
    });
  } else {
    // Rejeitar não exige verificação de saldo
    db.run('UPDATE dispensas SET status = ? WHERE id = ?', [status, dispensaId], function (updateErr) {
      if (updateErr) return res.status(500).json({ error: 'Erro ao atualizar dispensa.' });
      res.json({ message: `Solicitação de dispensa ${status.toLowerCase()} com sucesso!` });
    });
  }
});

// Editar dados da dispensa (datas, motivo, tipo)
app.put('/api/admin/dispensas/:id/edit', authenticateToken, authorizeAdmin, (req, res) => {
  const dispensaId = req.params.id;
  const { data_inicio, data_termino, observacao, tipo_dispensa } = req.body;

  if (!data_inicio || !data_termino) {
    return res.status(400).json({ error: 'Datas incompletas para edição de dispensa.' });
  }

  const dias = calcularDias(data_inicio, data_termino);
  if (dias <= 0) {
    return res.status(400).json({ error: 'A data e hora de término devem ser posteriores à data e hora de início.' });
  }

  const tipo = tipo_dispensa === 'comum' ? 'comum' : 'missao';

  // Obs: não estamos refazendo a validação de saldo no backend por brevidade na edição, 
  // confiando que o admin verifica antes de aprovar/salvar, 
  // mas idealmente deveria rever o saldo se for do tipo 'missao' e estiver Aprovada.
  
  db.run(
    `UPDATE dispensas SET data_inicio = ?, data_termino = ?, dias_dispensa = ?, observacao = ?, tipo_dispensa = ? WHERE id = ?`,
    [data_inicio, data_termino, dias, observacao || '', tipo, dispensaId],
    function (updateErr) {
      if (updateErr) return res.status(500).json({ error: 'Erro ao editar dispensa.' });
      res.json({ message: 'Dispensa editada com sucesso!' });
    }
  );
});

// Registrar dispensa diretamente pelo administrador
app.post('/api/admin/dispensas', authenticateToken, authorizeAdmin, (req, res) => {
  const { usuario_id, data_inicio, data_termino, observacao, tipo_dispensa } = req.body;

  if (!usuario_id || !data_inicio || !data_termino) {
    return res.status(400).json({ error: 'Dados incompletos para lançamento de dispensa.' });
  }

  const dias = calcularDias(data_inicio, data_termino);
  if (dias <= 0) {
    return res.status(400).json({ error: 'A data e hora de término devem ser posteriores à data e hora de início.' });
  }

  const tipo = tipo_dispensa === 'comum' ? 'comum' : 'missao';

  if (tipo === 'comum') {
    // Dispensa avulsa, aprova diretamente sem verificar saldo
    db.run(
      `INSERT INTO dispensas (usuario_id, data_inicio, data_termino, dias_dispensa, status, observacao, tipo_dispensa) 
       VALUES (?, ?, ?, ?, 'Aprovada', ?, ?)`,
      [usuario_id, data_inicio, data_termino, dias, observacao || 'Lançado diretamente pelo Administrador', tipo],
      function (insertErr) {
        if (insertErr) {
          return res.status(500).json({ error: 'Erro ao registrar dispensa.' });
        }
        res.json({ id: this.lastID, message: 'Dispensa registrada e aprovada com sucesso!' });
      }
    );
  } else {
    // Verificar saldo do usuário (apenas para tipo 'missao')
    db.get('SELECT saldo_inicial_dispensas FROM usuarios WHERE id = ?', [usuario_id], (errUser, user) => {
      if (errUser || !user) return res.status(400).json({ error: 'Usuário não encontrado.' });

      db.get('SELECT COALESCE(SUM(dispensas_concedidas), 0) as acumuladas FROM missoes WHERE usuario_id = ?', [usuario_id], (errM, rowM) => {
        db.get('SELECT COALESCE(SUM(dias_dispensa), 0) as utilizadas FROM dispensas WHERE usuario_id = ? AND status = \'Aprovada\' AND tipo_dispensa != \'comum\'', [usuario_id], (errD, rowD) => {
          const acumuladasTotal = (rowM ? rowM.acumuladas : 0) + (user.saldo_inicial_dispensas || 0);
          const utilizadasTotal = rowD ? rowD.utilizadas : 0;
          const saldoRestante = acumuladasTotal - utilizadasTotal;

          if (dias > saldoRestante) {
            return res.status(400).json({ 
              error: `Militar não possui saldo de dispensa suficiente. Saldo restante: ${saldoRestante} dias. Dias solicitados: ${dias} dias.` 
            });
          }

          // Registrar como Aprovada diretamente
          db.run(
            `INSERT INTO dispensas (usuario_id, data_inicio, data_termino, dias_dispensa, status, observacao, tipo_dispensa) 
             VALUES (?, ?, ?, ?, 'Aprovada', ?, ?)`,
            [usuario_id, data_inicio, data_termino, dias, observacao || 'Lançado diretamente pelo Administrador', tipo],
            function (insertErr) {
              if (insertErr) {
                return res.status(500).json({ error: 'Erro ao registrar dispensa.' });
              }
              res.json({ id: this.lastID, message: 'Dispensa registrada e aprovada com sucesso!' });
            }
          );
        });
      });
    });
  }
});

// Remover Registro de Dispensa (seja aprovada, pendente ou rejeitada)
app.delete('/api/admin/dispensas/:id', authenticateToken, authorizeAdmin, (req, res) => {
  const dispensaId = req.params.id;
  db.run('DELETE FROM dispensas WHERE id = ?', [dispensaId], function (err) {
    if (err) {
      return res.status(500).json({ error: 'Erro ao remover dispensa.' });
    }
    res.json({ message: 'Registro de dispensa removido com sucesso!' });
  });
});

// ----------------------------------------------------
// ROTAS DE SAQUE ETAPA (NOVO)
// ----------------------------------------------------

// Lançar solicitação de saque etapa (Membro solicita, fica Pendente)
app.post('/api/membro/saques-etapa', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const { data_inicio, data_termino, quantidade_etapas, observacao } = req.body;

  if (!data_inicio || !data_termino || !quantidade_etapas) {
    return res.status(400).json({ error: 'Datas e quantidade de etapas são obrigatórias.' });
  }

  const valor = parseFloat(quantidade_etapas) * 13.50;

  db.run(
    `INSERT INTO saques_etapa (usuario_id, data_inicio, data_termino, quantidade_etapas, valor, status, observacao) 
     VALUES (?, ?, ?, ?, ?, 'Pendente', ?)`,
    [userId, data_inicio, data_termino, quantidade_etapas, valor, observacao || ''],
    function (err) {
      if (err) {
        return res.status(500).json({ error: 'Erro ao lançar solicitação de saque etapa.' });
      }
      res.json({ id: this.lastID, message: 'Solicitação de saque etapa lançada com sucesso. Aguardando aprovação.' });
    }
  );
});

// Lançar saque etapa diretamente (Admin, fica Aprovado)
app.post('/api/admin/saques-etapa', authenticateToken, authorizeAdmin, (req, res) => {
  const { usuario_id, data_inicio, data_termino, quantidade_etapas, bi_solicitacao, bi_pagamento, observacao } = req.body;

  if (!usuario_id || !data_inicio || !data_termino || !quantidade_etapas) {
    return res.status(400).json({ error: 'Dados incompletos para lançamento de saque etapa.' });
  }

  const valor = parseFloat(quantidade_etapas) * 13.50;

  db.run(
    `INSERT INTO saques_etapa (usuario_id, data_inicio, data_termino, quantidade_etapas, valor, status, bi_solicitacao, bi_pagamento, observacao) 
     VALUES (?, ?, ?, ?, ?, 'Aprovada', ?, ?, ?)`,
    [usuario_id, data_inicio, data_termino, quantidade_etapas, valor, bi_solicitacao || '', bi_pagamento || '', observacao || ''],
    function (err) {
      if (err) {
        return res.status(500).json({ error: 'Erro ao registrar saque etapa.' });
      }
      res.json({ id: this.lastID, message: 'Saque etapa registrado com sucesso!' });
    }
  );
});

// Listar todos os saques etapa (para o Administrador)
app.get('/api/admin/saques-etapa', authenticateToken, authorizeAdmin, (req, res) => {
  const query = `
    SELECT s.*, u.nome, u.posto_graduacao
    FROM saques_etapa s
    JOIN usuarios u ON s.usuario_id = u.id
    ORDER BY 
      CASE WHEN s.status = 'Pendente' THEN 1 ELSE 2 END,
      s.data_inicio DESC
  `;
  db.all(query, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao obter solicitações de saque etapa.' });
    }
    res.json(rows);
  });
});

// Aprovar/Rejeitar/Atualizar BIs de Saque Etapa
app.put('/api/admin/saques-etapa/:id', authenticateToken, authorizeAdmin, (req, res) => {
  const saqueId = req.params.id;
  const { status, bi_solicitacao, bi_pagamento, observacao } = req.body;

  if (status && status !== 'Aprovada' && status !== 'Rejeitada') {
    return res.status(400).json({ error: 'Status inválido. Use Aprovada ou Rejeitada.' });
  }

  if (status) {
    db.run(
      `UPDATE saques_etapa 
       SET status = ?, bi_solicitacao = COALESCE(?, bi_solicitacao), bi_pagamento = COALESCE(?, bi_pagamento), observacao = COALESCE(?, observacao) 
       WHERE id = ?`,
      [status, bi_solicitacao || null, bi_pagamento || null, observacao || null, saqueId],
      function (err) {
        if (err) return res.status(500).json({ error: 'Erro ao atualizar status do saque etapa.' });
        res.json({ message: `Solicitação de saque etapa ${status.toLowerCase()} com sucesso!` });
      }
    );
  } else {
    db.run(
      `UPDATE saques_etapa 
       SET bi_solicitacao = ?, bi_pagamento = ?, observacao = ? 
       WHERE id = ?`,
      [bi_solicitacao || '', bi_pagamento || '', observacao || '', saqueId],
      function (err) {
        if (err) return res.status(500).json({ error: 'Erro ao atualizar dados do saque etapa.' });
        res.json({ message: 'Dados de saque etapa atualizados com sucesso!' });
      }
    );
  }
});

// Remover registro de saque etapa
app.delete('/api/admin/saques-etapa/:id', authenticateToken, authorizeAdmin, (req, res) => {
  const saqueId = req.params.id;
  db.run('DELETE FROM saques_etapa WHERE id = ?', [saqueId], function (err) {
    if (err) {
      return res.status(500).json({ error: 'Erro ao remover saque etapa.' });
    }
    res.json({ message: 'Registro de saque etapa removido com sucesso!' });
  });
});

// Toggle status de pagamento da gratificação
app.put('/api/admin/missoes/:id/pago', authenticateToken, authorizeAdmin, (req, res) => {
  const missaoId = req.params.id;
  const { gratificacao_paga } = req.body;

  db.run(
    'UPDATE missoes SET gratificacao_paga = ? WHERE id = ?',
    [gratificacao_paga ? 1 : 0, missaoId],
    function (err) {
      if (err) {
        return res.status(500).json({ error: 'Erro ao atualizar status de pagamento da gratificação.' });
      }
      res.json({ message: 'Status de pagamento da gratificação atualizado com sucesso!' });
    }
  );
});

// Obter destino diário do efetivo para uma data específica (membro e admin)
app.get('/api/destino-diario', authenticateToken, (req, res) => {
  const { data } = req.query; // YYYY-MM-DD
  if (!data) {
    return res.status(400).json({ error: 'A data de consulta é obrigatória.' });
  }

  // 1. Obter todos os usuários ordenados por nome
  db.all(`SELECT id, matricula, nome, posto_graduacao FROM usuarios ORDER BY ${ordemPostoSql('usuarios')} ASC, nome ASC`, [], (err, usuarios) => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao buscar militares no banco de dados.' });
    }

    // 2. Obter férias que cobrem esta data
    db.all('SELECT usuario_id, data_inicio, data_termino FROM ferias WHERE ? BETWEEN data_inicio AND data_termino', [data], (errF, ferias) => {
      if (errF) return res.status(500).json({ error: 'Erro ao buscar férias.' });

      // 3. Obter dispensas aprovadas que cobrem esta data
      db.all("SELECT usuario_id, data_inicio, data_termino, observacao FROM dispensas WHERE status = 'Aprovada' AND ? BETWEEN data_inicio AND data_termino", [data], (errD, dispensas) => {
        if (errD) return res.status(500).json({ error: 'Erro ao buscar dispensas.' });

        // 4. Obter missões que cobrem esta data (formatado como datetime-local, extrair substring de 10 caracteres para data)
        db.all("SELECT usuario_id, data_inicio, data_termino, descricao FROM missoes WHERE ? BETWEEN SUBSTR(data_inicio, 1, 10) AND SUBSTR(data_termino, 1, 10)", [data], (errM, missoes) => {
          if (errM) return res.status(500).json({ error: 'Erro ao buscar missões.' });

          // Indexar por usuario_id para cruzamento rápido
          const feriasMap = new Map();
          ferias.forEach(f => feriasMap.set(f.usuario_id, f));

          const dispensasMap = new Map();
          dispensas.forEach(d => dispensasMap.set(d.usuario_id, d));

          const missoesMap = new Map();
          missoes.forEach(m => missoesMap.set(m.usuario_id, m));

          const resultado = usuarios.map(u => {
            const f = feriasMap.get(u.id);
            const d = dispensasMap.get(u.id);
            const m = missoesMap.get(u.id);

            let status = 'Pronto no Quartel';
            let statusClass = 'pronto';
            let detailsObj = null;

            if (f) {
              status = 'Afastado (Férias)';
              statusClass = 'ferias';
              detailsObj = { tipo: 'ferias', inicio: f.data_inicio, termino: f.data_termino };
            } else if (d) {
              status = 'Afastado (Dispensa)';
              statusClass = 'dispensa';
              detailsObj = { tipo: 'dispensa', inicio: d.data_inicio, termino: d.data_termino, obs: d.observacao };
            } else if (m) {
              status = 'Em Missão';
              statusClass = 'missao';
              detailsObj = { tipo: 'missao', inicio: m.data_inicio, termino: m.data_termino, descricao: m.descricao };
            }

            return {
              posto_graduacao: u.posto_graduacao,
              nome: u.nome,
              matricula: u.matricula,
              status,
              statusClass,
              detalhes: detailsObj
            };
          });

          res.json(resultado);
        });
      });
    });
  });
});

// ----------------------------------------------------
// ROTA FALLBACK PARA SERVIR FRONTEND
// ----------------------------------------------------
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../public/index.html'));
});

// Iniciar servidor (com init PostgreSQL se em produção)
async function startServer() {
  if (process.env.DATABASE_URL) {
    const { initPg } = require('./init-pg');
    await initPg();
  }
  app.listen(PORT, () => {
    console.log(`Servidor rodando com sucesso em http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Falha ao iniciar o servidor:', err);
  process.exit(1);
});
