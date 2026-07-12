/**
 * init-pg.js
 * Inicializa o banco de dados PostgreSQL em produção.
 * Cria todas as tabelas (IF NOT EXISTS) e insere dados iniciais se necessário.
 * Chamado automaticamente pelo server.js quando DATABASE_URL estiver definida.
 */
require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function initPg() {
  const client = await pool.connect();
  try {
    console.log('Inicializando banco de dados PostgreSQL...');

    // 1. Soldos
    await client.query(`
      CREATE TABLE IF NOT EXISTS soldos (
        posto_graduacao TEXT PRIMARY KEY,
        soldo REAL NOT NULL
      )
    `);

    // 2. Usuários
    await client.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id SERIAL PRIMARY KEY,
        matricula TEXT UNIQUE NOT NULL,
        nome TEXT NOT NULL,
        senha TEXT NOT NULL,
        posto_graduacao TEXT NOT NULL,
        soldo REAL NOT NULL,
        role TEXT NOT NULL DEFAULT 'membro',
        saldo_inicial_dispensas INTEGER DEFAULT 0,
        observacao TEXT DEFAULT '',
        fracao TEXT DEFAULT ''
      )
    `);

    // Migração: bancos criados antes desta mudança não têm a coluna fracao.
    // Adiciona a coluna e, no mesmo passo, promove os administradores já
    // existentes a "super_admin" (mantém o acesso irrestrito que já tinham).
    // Como o guard verifica a existência da coluna, isso roda uma única vez.
    const { rows: colunaFracao } = await client.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'usuarios' AND column_name = 'fracao'
    `);
    if (colunaFracao.length === 0) {
      await client.query("ALTER TABLE usuarios ADD COLUMN fracao TEXT DEFAULT ''");
      await client.query("UPDATE usuarios SET role = 'super_admin' WHERE role = 'admin'");
      console.log('Coluna fracao adicionada e administradores existentes promovidos a super_admin.');
    }

    // 3. Missões (deslocamentos)
    await client.query(`
      CREATE TABLE IF NOT EXISTS missoes (
        id SERIAL PRIMARY KEY,
        usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
        descricao TEXT NOT NULL,
        data_inicio TEXT NOT NULL,
        data_termino TEXT NOT NULL,
        dias_missao INTEGER NOT NULL,
        gratificacao_representacao REAL NOT NULL DEFAULT 0,
        saque_alimentacao REAL NOT NULL DEFAULT 0,
        dispensas_concedidas INTEGER NOT NULL DEFAULT 0,
        bi_pagamento TEXT DEFAULT '',
        bi_solicitacao_saque_alimentacao TEXT DEFAULT '',
        bi_pagamento_saque_etapa TEXT DEFAULT '',
        observacao_pagamento TEXT DEFAULT '',
        gratificacao_paga INTEGER DEFAULT 0,
        pagar_gratificacao INTEGER DEFAULT 1,
        pagar_ajuda_custo INTEGER DEFAULT 0,
        ajuda_de_custo REAL DEFAULT 0,
        nome_deslocamento TEXT DEFAULT '',
        tipo_deslocamento TEXT DEFAULT 'Missão',
        gratificacao_localidade_pct INTEGER DEFAULT 0,
        gratificacao_localidade_valor REAL DEFAULT 0,
        ajuda_custo_paga INTEGER DEFAULT 0,
        localidade_paga INTEGER DEFAULT 0,
        alimentacao_paga INTEGER DEFAULT 0,
        bi_autorizacao_pagamento TEXT DEFAULT '',
        dias_gratificacao INTEGER DEFAULT 0,
        alimentacao_bi TEXT DEFAULT '',
        bi_retorno TEXT DEFAULT '',
        bi_deslocamento TEXT DEFAULT '',
        bi_solicitacao_gratificacao TEXT DEFAULT '',
        receber_saque_alimentacao INTEGER DEFAULT 0,
        dias_saque_alimentacao INTEGER DEFAULT 0,
        qtd_saque_alimentacao INTEGER DEFAULT 0
      )
    `);

    // 4. Férias
    await client.query(`
      CREATE TABLE IF NOT EXISTS ferias (
        id SERIAL PRIMARY KEY,
        usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
        data_inicio TEXT NOT NULL,
        data_termino TEXT NOT NULL,
        dias_ferias INTEGER NOT NULL
      )
    `);

    // 5. Dispensas
    await client.query(`
      CREATE TABLE IF NOT EXISTS dispensas (
        id SERIAL PRIMARY KEY,
        usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
        data_inicio TEXT NOT NULL,
        data_termino TEXT NOT NULL,
        dias_dispensa INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'Pendente',
        observacao TEXT,
        tipo_dispensa TEXT DEFAULT 'missao'
      )
    `);

    // 6. Saques Etapa
    await client.query(`
      CREATE TABLE IF NOT EXISTS saques_etapa (
        id SERIAL PRIMARY KEY,
        usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
        data_inicio TEXT NOT NULL,
        data_termino TEXT NOT NULL,
        quantidade_etapas INTEGER NOT NULL,
        valor REAL NOT NULL,
        status TEXT NOT NULL DEFAULT 'Pendente',
        bi_solicitacao TEXT,
        bi_pagamento TEXT,
        observacao TEXT
      )
    `);

    // Inserir soldos iniciais (Lei nº 15.167/2025)
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

    for (const [posto, soldo] of soldosIniciais) {
      await client.query(
        'INSERT INTO soldos (posto_graduacao, soldo) VALUES ($1, $2) ON CONFLICT (posto_graduacao) DO UPDATE SET soldo = $2',
        [posto, soldo]
      );
    }

    // Criar administrador padrão se não houver usuários
    const { rows } = await client.query('SELECT COUNT(*) as count FROM usuarios');
    if (parseInt(rows[0].count) === 0) {
      const hash = bcrypt.hashSync('admin123', 10);
      await client.query(
        `INSERT INTO usuarios (matricula, nome, senha, posto_graduacao, soldo, role, saldo_inicial_dispensas)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        ['admin', 'Administrador Geral', hash, 'Coronel', 12505.00, 'super_admin', 0]
      );
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

    console.log('✅ Banco de dados PostgreSQL inicializado com sucesso!');
  } catch (err) {
    console.error('❌ Erro ao inicializar PostgreSQL:', err.message);
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { initPg, pool };
