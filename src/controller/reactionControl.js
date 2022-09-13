const mysql = require("../db/config");
const dealParams = require("../utils/dealParams");
const dealReactionParams = require("../utils/dealReactionParams");
const util = require("../utils/util");
const findReactions = async (ctx) => {
  let { type, input, filters } = ctx.request.body;
  // Input部分
  let is, ts, fs, cat, r_id, is_id, ts_id, fs_id, mat_id, joinSql, reaction_arr;
  let { is_num, fs_num, h_min, h_max, ea_min, ea_max, is_sel, ts_sel, fs_sel } =
    filters;
  //输入数据处理
  if (is_num) is_num = eval(is_num);
  if (fs_num) fs_num = eval(fs_num);
  // 分类
  switch (type) {
    case "reaction":
      ({ is, ts, fs, catalyst: cat } = input);
      joinSql = await dealReactionParams.dealReactionInput(
        is,
        ts,
        fs,
        cat,
        mysql
      );
      if (joinSql !== "Not Found" && joinSql !== "Type Error")
        reaction_arr = await mysql.query({ sql: joinSql });
      else if (joinSql == "Type Error") {
        ctx.body = "查询失败，类型错误";
        return false;
      } else {
        ctx.body = "查询失败，未能找到";
        return false;
      }
      break;
    case "reaction_id":
      ({ r_id } = input);
      joinSql = dealReactionParams.dealReactionIdInput(r_id);
      if (joinSql !== "Not Found" && joinSql !== "Type Error")
        reaction_arr = await mysql.query({ sql: joinSql });
      else if (joinSql == "Type Error") {
        ctx.body = "查询失败，类型错误";
        return false;
      } else {
        ctx.body = "查询失败，未能找到";
        return false;
      }
      break;
    case "group_id":
      ({ is_id, ts_id, fs_id, mat_id } = input);
      joinSql = dealReactionParams.dealGroupIdInput(
        is_id,
        ts_id,
        fs_id,
        mat_id
      );
      if (joinSql !== "Not Found" && joinSql !== "Type Error")
        reaction_arr = await mysql.query({ sql: joinSql });
      else if (joinSql == "Type Error") {
        ctx.body = "查询失败，类型错误";
        return false;
      } else {
        ctx.body = "查询失败，未能找到";
        return false;
      }
      break;
    case "json":
      break;
  }
  if (JSON.stringify(reaction_arr) == "[]") {
    ctx.body = "查询失败，未能找到";
    return false;
  }
  // filters部分
  let r_id_str;
  if (h_min || h_max || ea_min || ea_max) {
    r_id_str = "";
    for (let i = 0; i < reaction_arr.length; i++) {
      r_id_str = `${r_id_str} or r_id = ${reaction_arr[i]["id"]}`;
    }
    r_id_str = r_id_str.replace("or", "");
    e_sql = `select distinct r_id as id from thermo where (${r_id_str})`;
    if (h_min) e_sql = `${e_sql} and h >= ${h_min}`;
    if (h_max) e_sql = `${e_sql} and h <= ${h_max}`;
    if (ea_min) e_sql = `${e_sql} and ea >= ${h_min}`;
    if (ea_max) e_sql = `${e_sql} and ea <= ${h_max}`;
    reaction_arr = await mysql.query({ sql: e_sql });
  }
  if (is_num || fs_num) {
    r_id_str = "";
    let is_sql, fs_sql, n_sql;
    for (let i = 0; i < reaction_arr.length; i++) {
      r_id_str = `${r_id_str} or r.id = ${reaction_arr[i]["id"]}`;
    }
    r_id_str = r_id_str.replace("or", "");
    if (is_num) {
      is_sql = `select distinct r.id as id from reaction r inner join mol_group mg on r.r_is = mg.id where ${r_id_str} and tot_num <= ${is_num[1]} and tot_num >= ${is_num[0]}`;
      n_sql = `select id from reaction r where id in (${is_sql})`;
    }
    if (fs_num) {
      fs_sql = `select distinct r.id as id from reaction r inner join mol_group mg on r.r_fs = mg.id where ${r_id_str} and tot_num <= ${fs_num[1]} and tot_num >= ${fs_num[0]}`;
      n_sql = `${n_sql} and id in (${fs_sql})`;
    }
    reaction_arr = await mysql.query({ sql: n_sql });
  }
  if (is_sel || ts_sel || fs_sel) {
    let is_sel_res, ts_sel_res, fs_sel_res, is_sel_sql, ts_sel_sql, fs_sel_sql;
    if (is_sel) {
      is_sel_res = await dealReactionParams.dealFilterSelect(is_sel, mysql);
      is_sel_sql = dealReactionParams.joinGId(is_sel_res, "r_is");
    }
    if (ts_sel) {
      ts_sel_res = await dealReactionParams.dealFilterSelect(ts_sel, mysql);
      ts_sel_sql = dealReactionParams.joinGId(ts_sel_res, "r_ts");
    }
    if (fs_sel) {
      fs_sel_res = await dealReactionParams.dealFilterSelect(fs_sel, mysql);
      fs_sel_sql = dealReactionParams.joinGId(fs_sel_res, "r_fs");
    }
    const g_id_sel_arr = [is_sel_sql, ts_sel_sql, fs_sel_sql];
    let selSql = "";
    for (let i = 0; i < g_id_sel_arr.length; i++) {
      if (g_id_sel_arr[i]) {
        selSql = `${selSql} and ${g_id_sel_arr[i]}`;
      }
    }
    selSql = `select id from reaction r where ${selSql.replace("and", "")}`;
    r_id_str = "";
    for (let i = 0; i < reaction_arr.length; i++) {
      r_id_str = `${r_id_str} or id = ${reaction_arr[i]["id"]}`;
    }
    r_id_str = r_id_str.replace("or", "");
    selSql = `${selSql} and (${r_id_str})`;
    reaction_arr = await mysql.query({ sql: selSql });
  }
  // table
  r_id_str = "";
  for (let i = 0; i < reaction_arr.length; i++) {
    r_id_str = `${r_id_str} or r.id = ${reaction_arr[i]["id"]}`;
  }
  r_id_str = r_id_str.replace("or", "");
  let table_sql = `select r.id as id, r_type as type,CONCAT("IS",r_is,"->TS",r_ts,"->FS",r_fs) as 'reaction',formula,m.cry_sys,m.spa_gro,m.miller,m.termin,t.h,t.ea  from ( reaction r inner join material m on r.mat = m.id and (${r_id_str}) ) inner join thermo t  on t.r_id = r.id and t.star =0`;
  let result = await mysql.query({ sql: table_sql });
  let is_group_arr = await dealReactionParams.findGroupArr(
    "IS",
    r_id_str,
    mysql
  );
  let ts_group_arr = await dealReactionParams.findGroupArr(
    "TS",
    r_id_str,
    mysql
  );
  let fs_group_arr = await dealReactionParams.findGroupArr(
    "FS",
    r_id_str,
    mysql
  );
  let group_arr = [...is_group_arr, ...ts_group_arr, ...fs_group_arr];
  let is_input_arr = await dealReactionParams.findInputArr(
    "IS",
    r_id_str,
    mysql
  );
  let is_inchi_arr = await dealReactionParams.findInchiArr(
    "IS",
    is_input_arr,
    mysql
  );
  let ts_input_arr = await dealReactionParams.findInputArr(
    "TS",
    r_id_str,
    mysql
  );
  let ts_inchi_arr = await dealReactionParams.findInchiArr(
    "TS",
    ts_input_arr,
    mysql
  );
  let fs_input_arr = await dealReactionParams.findInputArr(
    "FS",
    r_id_str,
    mysql
  );
  let fs_inchi_arr = await dealReactionParams.findInchiArr(
    "FS",
    fs_input_arr,
    mysql
  );
  let inchi_arr = [...is_inchi_arr, ...ts_inchi_arr, ...fs_inchi_arr];
  ctx.body = {
    reaction_arr,
    result,
    group_arr,
    inchi_arr,
  };
};

module.exports = {
  findReactions,
};
