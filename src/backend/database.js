const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.resolve(__dirname, '../../database.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Erro ao conectar ao SQLite:', err.message);
  } else {
    console.log('Conectado ao banco de dados SQLite em:', dbPath);
    initializeDatabase();
  }
});

function initializeDatabase() {
  db.serialize(() => {
    // 1. Tabela de Soldos
    db.run(`
      CREATE TABLE IF NOT EXISTS soldos (
        posto_graduacao TEXT PRIMARY KEY,
        soldo REAL NOT NULL
      )
    `);

    // 2. Tabela de Usuários (Pessoal)
    db.run(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        matricula TEXT UNIQUE NOT NULL,
        nome TEXT NOT NULL,
        senha TEXT NOT NULL,
        posto_graduacao TEXT NOT NULL,
        soldo REAL NOT NULL,
        role TEXT NOT NULL DEFAULT 'membro',
        saldo_inicial_dispensas INTEGER DEFAULT 0,
        fracao TEXT DEFAULT '',
        FOREIGN KEY (posto_graduacao) REFERENCES soldos(posto_graduacao)
      )
    `);

    // 3. Tabela de Missões
    db.run(`
      CREATE TABLE IF NOT EXISTS missoes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario_id INTEGER NOT NULL,
        descricao TEXT NOT NULL,
        data_inicio TEXT NOT NULL, -- YYYY-MM-DD
        data_termino TEXT NOT NULL, -- YYYY-MM-DD
        dias_missao INTEGER NOT NULL,
        gratificacao_representacao REAL NOT NULL,
        saque_alimentacao REAL NOT NULL,
        dispensas_concedidas INTEGER NOT NULL DEFAULT 0,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
      )
    `);

    // 4. Tabela de Férias
    db.run(`
      CREATE TABLE IF NOT EXISTS ferias (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario_id INTEGER NOT NULL,
        data_inicio TEXT NOT NULL, -- YYYY-MM-DD
        data_termino TEXT NOT NULL, -- YYYY-MM-DD
        dias_ferias INTEGER NOT NULL,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
      )
    `);

    // 5. Tabela de Dispensas
    db.run(`
      CREATE TABLE IF NOT EXISTS dispensas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario_id INTEGER NOT NULL,
        data_inicio TEXT NOT NULL, -- YYYY-MM-DD
        data_termino TEXT NOT NULL, -- YYYY-MM-DD
        dias_dispensa INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'Pendente', -- 'Pendente', 'Aprovada', 'Rejeitada'
        observacao TEXT,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
      )
    `);

    // 6. Tabela de Saques Etapa
    db.run(`
      CREATE TABLE IF NOT EXISTS saques_etapa (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario_id INTEGER NOT NULL,
        data_inicio TEXT NOT NULL, -- YYYY-MM-DD
        data_termino TEXT NOT NULL, -- YYYY-MM-DD
        quantidade_etapas INTEGER NOT NULL,
        valor REAL NOT NULL,
        status TEXT NOT NULL DEFAULT 'Pendente', -- 'Pendente', 'Aprovada', 'Rejeitada'
        bi_solicitacao TEXT,
        bi_pagamento TEXT,
        observacao TEXT,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
      )
    `);

    // Realizar migração de postos e graduações anteriores para o Exército se necessário
    const rankMap = {
      'Almirante de Esquadra / General de Exército / Tenente-Brigadeiro': 'General de Exército',
      'Vice-Almirante / General de Divisão / Major-Brigadeiro': 'General de Divisão',
      'Contra-Almirante / General de Brigada / Brigadeiro': 'General de Brigada',
      'Capitão de Mar e Guerra / Coronel': 'Coronel',
      'Capitão de Fragata / Tenente-Coronel': 'Tenente-Coronel',
      'Capitão de Corveta / Major': 'Major',
      'Capitão-Tenente / Capitão': 'Capitão',
      'Guarda-Marinha / Aspirante a Oficial': 'Aspirante a Oficial',
      'Suboficial / Subtenente': 'Subtenente',
      'Cabo (engajado)': 'Cabo',
      'Soldado (engajado)': 'Soldado',
      'Cabo / Soldado (não engajado/recruta)': 'Cabo / Soldado (recruta)'
    };

    Object.entries(rankMap).forEach(([oldRank, newRank]) => {
      db.run('UPDATE usuarios SET posto_graduacao = ? WHERE posto_graduacao = ?', [newRank, oldRank]);
    });

    // Limpar soldos anteriores para recriar apenas com os postos do Exército
    db.run('DELETE FROM soldos');

    // Carga inicial de Soldos do Exército (Lei nº 15.167/2025 - Vigentes a partir de 01/01/2026)
    const soldosIniciais = [
      ['General de Exército', 14711.00],
      ['General de Divisão', 14100.00],
      ['General de Brigada', 13639.00],
      ['Coronel', 12505.00],
      ['Tenente-Coronel', 12285.00],
      ['Major', 12108.00],
      ['Capitão', 9976.00],
      ['Primeiro-Tenente', 9004.00],
      ['Segundo-Tenente', 8179.00],
      ['Aspirante a Oficial', 7988.00],
      ['Subtenente', 6737.00],
      ['Primeiro-Sargento', 5988.00],
      ['Segundo-Sargento', 5209.00],
      ['Terceiro-Sargento', 4177.00],
      ['Cabo', 2869.00],
      ['Soldado', 1927.00],
      ['Cabo / Soldado (recruta)', 1177.00]
    ];

    const stmtSoldo = db.prepare('INSERT OR REPLACE INTO soldos (posto_graduacao, soldo) VALUES (?, ?)');
    soldosIniciais.forEach(([posto, soldo]) => {
      stmtSoldo.run(posto, soldo);
    });
    stmtSoldo.finalize();

    // Criar administrador padrão se não houver usuários cadastrados
    db.get('SELECT COUNT(*) as count FROM usuarios', (err, row) => {
      if (err) {
        console.error('Erro ao verificar usuários existentes:', err.message);
        return;
      }

      if (row.count === 0) {
        const salt = bcrypt.genSaltSync(10);
        const hashSenha = bcrypt.hashSync('admin123', salt);
        const adminMatricula = 'admin';
        const adminNome = 'Administrador Geral';
        const adminPosto = 'Coronel';
        const adminSoldo = 12505.00;
        const adminRole = 'super_admin';

        db.run(
          `INSERT INTO usuarios (matricula, nome, senha, posto_graduacao, soldo, role, saldo_inicial_dispensas)
           VALUES (?, ?, ?, ?, ?, ?, 0)`,
          [adminMatricula, adminNome, hashSenha, adminPosto, adminSoldo, adminRole],
          (insertErr) => {
            if (insertErr) {
              console.error('Erro ao criar administrador padrão:', insertErr.message);
            } else {
              console.log('');
              console.log('⚠️  ============================================================');
              console.log('⚠️   ADMINISTRADOR PADRÃO CRIADO — TROQUE A SENHA AGORA!');
              console.log('⚠️   Login: admin | Senha: admin123');
              console.log('⚠️   Acesse o sistema e troque essa senha imediatamente.');
              console.log('⚠️   Enquanto ela não for trocada, qualquer pessoa que');
              console.log('⚠️   conheça esse padrão pode acessar como administrador.');
              console.log('⚠️  ============================================================');
              console.log('');
            }
          }
        );
      }
    });

    // Atualizar o esquema do banco de dados com os novos campos (Fase 2)
    updateSchema(db);
  });
}

function updateSchema(db) {
  // Adicionar colunas de BI na tabela de missões
  const colunasMissoes = [
    { name: 'bi_deslocamento', type: 'TEXT' },
    { name: 'bi_retorno', type: 'TEXT' },
    { name: 'bi_solicitacao_gratificacao', type: 'TEXT' },
    { name: 'bi_autorizacao_pagamento', type: 'TEXT' },
    { name: 'bi_pagamento', type: 'TEXT' },
    { name: 'bi_solicitacao_saque_alimentacao', type: 'TEXT' },
    { name: 'bi_pagamento_saque_etapa', type: 'TEXT' },
    { name: 'observacao_pagamento', type: 'TEXT' },
    { name: 'gratificacao_paga', type: 'INTEGER DEFAULT 0' },
    { name: 'pagar_gratificacao', type: 'INTEGER DEFAULT 1' },
    { name: 'pagar_ajuda_custo', type: 'INTEGER DEFAULT 0' },
    { name: 'ajuda_de_custo', type: 'REAL DEFAULT 0.0' },
    { name: 'nome_deslocamento', type: 'TEXT' },
    { name: 'tipo_deslocamento', type: 'TEXT DEFAULT "Missão"' },
    { name: 'gratificacao_localidade_pct', type: 'INTEGER DEFAULT 0' },
    { name: 'gratificacao_localidade_valor', type: 'REAL DEFAULT 0.0' },
    { name: 'ajuda_custo_paga', type: 'INTEGER DEFAULT 0' },
    { name: 'localidade_paga', type: 'INTEGER DEFAULT 0' },
    { name: 'alimentacao_paga', type: 'INTEGER DEFAULT 0' },
    { name: 'dias_gratificacao', type: 'INTEGER DEFAULT 0' },
    { name: 'receber_saque_alimentacao', type: 'INTEGER DEFAULT 0' },
    { name: 'dias_saque_alimentacao', type: 'INTEGER DEFAULT 0' },
    { name: 'qtd_saque_alimentacao', type: 'INTEGER DEFAULT 0' }
  ];

  db.all('PRAGMA table_info(missoes)', (err, rows) => {
    if (err) {
      console.error('Erro ao verificar colunas de missoes:', err);
      return;
    }
    const existingCols = rows.map(r => r.name);
    colunasMissoes.forEach(c => {
      if (!existingCols.includes(c.name)) {
        db.run(`ALTER TABLE missoes ADD COLUMN ${c.name} ${c.type}`, (alterErr) => {
          if (alterErr) {
            console.error(`Erro ao adicionar coluna ${c.name} a missoes:`, alterErr.message);
          } else {
            console.log(`Coluna ${c.name} adicionada com sucesso a missoes.`);
          }
        });
      }
    });
  });

  // Adicionar coluna tipo_dispensa na tabela de dispensas
  db.all('PRAGMA table_info(dispensas)', (err, rows) => {
    if (err) {
      console.error('Erro ao verificar colunas de dispensas:', err);
      return;
    }
    const existingCols = rows.map(r => r.name);
    if (!existingCols.includes('tipo_dispensa')) {
      db.run("ALTER TABLE dispensas ADD COLUMN tipo_dispensa TEXT DEFAULT 'missao'", (alterErr) => {
        if (alterErr) {
          console.error("Erro ao adicionar coluna tipo_dispensa a dispensas:", alterErr.message);
        } else {
          console.log("Coluna tipo_dispensa adicionada com sucesso a dispensas.");
        }
      });
    }
  });

  // Adicionar colunas observacao e fracao na tabela de usuarios
  db.all('PRAGMA table_info(usuarios)', (err, rows) => {
    if (err) {
      console.error('Erro ao verificar colunas de usuarios:', err);
      return;
    }
    const existingCols = rows.map(r => r.name);

    if (!existingCols.includes('observacao')) {
      db.run("ALTER TABLE usuarios ADD COLUMN observacao TEXT DEFAULT ''", (alterErr) => {
        if (alterErr) {
          console.error("Erro ao adicionar coluna observacao a usuarios:", alterErr.message);
        } else {
          console.log("Coluna observacao adicionada com sucesso a usuarios.");
        }
      });
    }

    // Coluna fracao (setor) — permite segmentar a visão dos administradores por setor.
    if (!existingCols.includes('fracao')) {
      db.run("ALTER TABLE usuarios ADD COLUMN fracao TEXT DEFAULT ''", (alterErr) => {
        if (alterErr) {
          console.error('Erro ao adicionar coluna fracao a usuarios:', alterErr.message);
        } else {
          console.log('Coluna fracao adicionada com sucesso a usuarios.');
          // Migração única (só roda neste primeiro ALTER, nunca mais): promove os
          // administradores já existentes a "super_admin", preservando o acesso
          // irrestrito que eles já tinham antes desta mudança. Daqui para frente,
          // novos admins criados ficam com o papel "admin", restrito à própria Fração.
          db.run("UPDATE usuarios SET role = 'super_admin' WHERE role = 'admin'", (updateErr) => {
            if (updateErr) {
              console.error('Erro ao promover administradores existentes a super_admin:', updateErr.message);
            } else {
              console.log('Administradores existentes promovidos a Administrador Geral (super_admin).');
            }
          });
        }
      });
    }
  });
}

module.exports = db;
