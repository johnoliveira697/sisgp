/**
 * db-adapter.js
 * Camada de abstração: usa PostgreSQL em produção (DATABASE_URL definida)
 * e SQLite localmente. A API pública é idêntica à do sqlite3 (run, get, all, prepare, serialize).
 */
require('dotenv').config();

const USE_PG = !!process.env.DATABASE_URL;

if (USE_PG) {
  // ── POSTGRESQL ────────────────────────────────────────────────────────────
  const { Pool } = require('pg');

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  /**
   * Converte SQL no estilo SQLite (?) para PostgreSQL ($1, $2, …)
   */
  function convertSql(sql) {
    let i = 0;
    return sql.replace(/\?/g, () => `$${++i}`);
  }

  const db = {
    _pool: pool,

    run(sql, params, callback) {
      if (typeof params === 'function') { callback = params; params = []; }
      params = params || [];
      pool.query(convertSql(sql), params, (err, result) => {
        if (callback) {
          if (err) return callback.call({ lastID: null, changes: 0 }, err);
          const lastID = result.rows && result.rows[0] ? result.rows[0].id : null;
          callback.call({ lastID, changes: result.rowCount }, null);
        }
      });
    },

    get(sql, params, callback) {
      if (typeof params === 'function') { callback = params; params = []; }
      params = params || [];
      pool.query(convertSql(sql), params, (err, result) => {
        if (callback) callback(err, result && result.rows[0]);
      });
    },

    all(sql, params, callback) {
      if (typeof params === 'function') { callback = params; params = []; }
      params = params || [];
      pool.query(convertSql(sql), params, (err, result) => {
        if (callback) callback(err, result ? result.rows : []);
      });
    },

    serialize(fn) { if (fn) fn(); },

    prepare(sql) {
      const convertedSql = convertSql(sql);
      const stmts = [];
      return {
        run(...args) {
          let params = [], cb = null;
          if (typeof args[args.length - 1] === 'function') cb = args.pop();
          params = args.flat();
          pool.query(convertedSql, params, (err) => { if (cb) cb(err); });
        },
        finalize(cb) { if (cb) cb(); }
      };
    }
  };

  module.exports = db;

} else {
  // ── SQLITE (local) ────────────────────────────────────────────────────────
  // Reaproveita database.js, que além de abrir a conexão também cria as tabelas
  // (usuarios, missoes, ferias, dispensas, saques_etapa), popula a tabela de soldos
  // e cria o administrador padrão quando o banco está vazio. Isso é essencial em
  // qualquer ambiente novo (ex.: primeiro deploy num VPS, onde database.db ainda
  // não existe) - sem isso, o banco fica sem tabelas e toda consulta falha.
  module.exports = require('./database');
}
