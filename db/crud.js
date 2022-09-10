const db = require("./config.js");

const insertOne = async (table, params) => {
  const setStr = db.formatParams(params);
  const sql = `insert into ${table} set ${setStr};`;
  const result = await db.query({ sql: sql });
  return result;
};

const find = async (content, table, params) => {
  const setStr = db.formatParams(params);
  const sql = `select ${content} from ${table} where ${setStr}`;
  const result = await db.query({ sql: sql });
  return result;
};

const complexFind = async (content, table, params) => {
  const sql = `select ${content} from ${table} where ${params}`;
  const result = await db.query({ sql: sql });
  return result;
};

const findThenPaging = async (content, table, params, skip, pageSize) => {
  const setStr = db.formatParams(params);
  const sql = `select ${content} from ${table} where ${setStr} limit ${skip},${pageSize}`;
  const result = await db.query({ sql: sql });
  return result;
};

const findAll = async (content, table) => {
  const sql = `select ${content} from ${table}`;
  const result = await db.query({ sql: sql });
  return result;
};

const findAllThenPaging = async (content, table, skip, pageSize) => {
  const sql = `select ${content} from ${table} limit ${skip},${pageSize}`;
  const result = await db.query({ sql: sql });
  return result;
};

const deleteOne = async (table, params) => {
  const setStr = db.formatParams(params);
  const sql = `delete from ${table} where ${setStr}`;
  const result = await db.query({ sql: sql });
  return result[0];
};

const update = async (table, search, params) => {
  const searchStr = db.formatParams(search);
  const setStr = db.formatParams(params);
  const sql = `update ${table} set ${setStr} where ${searchStr}`;
  const result = await db.query({ sql: sql });
  return result;
};

module.exports = {
  insertOne,
  find,
  complexFind,
  findThenPaging,
  findAll,
  findAllThenPaging,
  deleteOne,
  update,
};
