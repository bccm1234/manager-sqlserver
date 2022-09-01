const mysql = require("../db/config");
const dealParams = require("../utils/dealParams");
//ctx: is[{formula:"Cu2O",ads:0}]
console.log(dealParams.dealInputParams("Cu2O"));
const findReactions = async (ctx) => {
  let { is, ts, fs } = ctx.request.query;
  //处理is
  //获取is对应的f_id
  const is_res = await dealParams.dealReactionParams(is, mysql);
  const ts_res = await dealParams.dealReactionParams(ts, mysql);
  const fs_res = await dealParams.dealReactionParams(fs, mysql);
  //   let reaction_sql = 'select r_id from reaction r where'
  const is_sql = dealParams.joinGId(is_res, "is");
  const ts_sql = dealParams.joinGId(ts_res, "ts");
  const fs_sql = dealParams.joinGId(fs_res, "fs");
  const g_id_arr = [is_sql, ts_sql, fs_sql];
  let joinSql = "";
  for (let i = 0; i < g_id_arr.length; i++) {
    if (g_id_arr[i]) {
      joinSql = `${joinSql} and ${g_id_arr[i]}`;
    }
  }
  joinSql = `select * from reaction r where ${joinSql.replace("and", "")};`;
  const reaction_arr = await mysql.query({ sql: joinSql });
  //获取到反应包含的is group_id 、ts group_id 、 fs group_id
  let r_id_str = "";
  let group_i_t_f = [];
  let molArr = [];
  let inchiArr = [];
  if (reaction_arr.length > 0) {
    for (let i = 0; i < reaction_arr.length; i++) {
      r_id_str = `${r_id_str} or r_id = ${reaction_arr[i]["r_id"]}`;
    }
    r_id_str = r_id_str.replace("or", "");
    const is_g = await mysql.query({
      sql: `select distinct r.is from reaction r where ${r_id_str}`,
    });
    const ts_g = await mysql.query({
      sql: `select distinct r.ts from reaction r where ${r_id_str}`,
    });
    const fs_g = await mysql.query({
      sql: `select distinct r.fs from reaction r where ${r_id_str}`,
    });
    //group去重[[1,2],[1,2]]
    group_i_t_f = [is_g, ts_g, fs_g];
    const { molArr: is_mol_arr, inchiArr: is_inchi_arr } =
      await dealParams.getMol(is_g, "is", mysql);
    const { molArr: ts_mol_arr, inchiArr: ts_inchi_arr } =
      await dealParams.getMol(ts_g, "ts", mysql);
    const { molArr: fs_mol_arr, inchiArr: fs_inchi_arr } =
      await dealParams.getMol(fs_g, "fs", mysql);
    molArr = [is_mol_arr, ts_mol_arr, fs_mol_arr];
    inchiArr = [is_inchi_arr, ts_inchi_arr, fs_inchi_arr];
  }
  ctx.body = {
    reaction_arr,
    r_id_str,
    group_i_t_f,
    molArr,
    inchiArr,
  };
};

module.exports = {
  findReactions,
};
