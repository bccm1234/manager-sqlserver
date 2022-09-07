const mysql = require("../db/config");
const dealParams = require("../utils/dealParams");
const materC = require("./materialsControl");
const findReactions = async (ctx) => {
  let { IS, TS, FS, Cat } = ctx.request.query;
  let mat_params = eval("(" + Cat + ")");
  //获取is\ts\fs对应的inchi_id
  const is_res = await dealParams.dealReactionParams(IS, mysql);
  const ts_res = await dealParams.dealReactionParams(TS, mysql);
  const fs_res = await dealParams.dealReactionParams(FS, mysql);
  const mat_res = await materC.findMaterialsAbstracts(mat_params);
  const is_sql = dealParams.joinGId(is_res, "r_is");
  const ts_sql = dealParams.joinGId(ts_res, "r_ts");
  const fs_sql = dealParams.joinGId(fs_res, "r_fs");
  const mat_sql = dealParams.joinGId(mat_res, "mat");
  const g_id_arr = [is_sql, ts_sql, fs_sql, mat_sql];
  let joinSql = "";
  for (let i = 0; i < g_id_arr.length; i++) {
    if (g_id_arr[i]) {
      joinSql = `${joinSql} and ${g_id_arr[i]}`;
    }
  }
  joinSql = `select * from reaction r where ${joinSql.replace("and", "")};`;
  const reaction_arr = await mysql.query({ sql: joinSql });
  // 获取到反应包含的is group_id 、ts group_id 、 fs group_id
  let r_id_str = "";
  let group_i_t_f = [];
  let molArr = [];
  let inchiArr = [];
  if (reaction_arr.length > 0) {
    for (let i = 0; i < reaction_arr.length; i++) {
      r_id_str = `${r_id_str} or id = ${reaction_arr[i]["id"]}`;
    }
    r_id_str = r_id_str.replace("or", "");
    const is_g = await mysql.query({
      sql: `select distinct r.r_is from reaction r where ${r_id_str}`,
    });
    const ts_g = await mysql.query({
      sql: `select distinct r.r_ts from reaction r where ${r_id_str}`,
    });
    const fs_g = await mysql.query({
      sql: `select distinct r.r_fs from reaction r where ${r_id_str}`,
    });
    //group去重[[1,2],[1,2]]
    group_i_t_f = [is_g, ts_g, fs_g];
    const { molArr: is_mol_arr, inchiArr: is_inchi_arr } =
      await dealParams.getMol(is_g, "r_is", mysql);
    const { molArr: ts_mol_arr, inchiArr: ts_inchi_arr } =
      await dealParams.getMol(ts_g, "r_ts", mysql);
    const { molArr: fs_mol_arr, inchiArr: fs_inchi_arr } =
      await dealParams.getMol(fs_g, "r_fs", mysql);
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
