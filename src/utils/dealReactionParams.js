const materialsControl = require("../controller/materialsControl");
const dealParams = require("./dealParams");

const dealReactionParams = async function (params, database) {
  // 将string格式数据转array
  params = JSON.parse(JSON.stringify(params));
  if (params) {
    let inchi_arr = [],
      sql,
      inchi;
    for (let i = 0; i < params.length; i++) {
      const type = params[i].select[0];
      const ads = params[i].select[1];
      const value = params[i].value;
      switch (type) {
        case "formula":
          let for_info = dealParams.dealInputParams(value);
          let sql_info = `${for_info} and ads = ${ads}`;
          sql = `select id from inchi where ${sql_info}`;
          inchi = await database.query({ sql: sql });
          break;
        case "inchi":
          sql = `select id from inchi where inchi = '${value}' and ads = ${ads}`;
          inchi = await database.query({ sql: sql });
          break;
        case "inchikey":
          sql = `select id from inchi where inchikey = '${value}' and ads = ${ads}`;
          inchi = await database.query({ sql: sql });
          break;
        case "name":
          break;
      }
      if (inchi) inchi_arr.push(inchi);
      else inchi_arr.push([]);
    }
    // 判断inchi_id是否为空
    if (inchi_arr.length > 0) {
      let group_Str = "";
      //根据inchi获取g_id
      for (let i = 0; i < inchi_arr.length; i++) {
        if (inchi_arr[i].length == 0) {
          console.error("!!!未找到对应inchi_id!!!");
          return "";
        } else {
          let length = inchi_arr[i].length;
          let str = `json_contains_path(g_set,'one'`;
          for (let j = 0; j < length; j++) {
            str = `${str},'$."${inchi_arr[i][j].id}"'`;
          }
          str = `${str})`;
          group_Str = `${group_Str} ${str} and`;
        }
      }
      group_Str = group_Str.slice(0, group_Str.length - 3);
      group_Str = `select id from mol_group where ${group_Str}`;
      // console.log(group_Str);
      const res = await database.query({ sql: group_Str });
      return res;
    } else {
      return "";
    }
  } else {
    return "";
  }
};
const dealReactionInput = async function (is, ts, fs, cat, database) {
  //获取is/ts/fs对应的group_id
  // console.log(is, ts, fs, cat);
  if (!is && !ts && !fs && !cat) return "Type Error";
  let is_res, ts_res, fs_res, mat_res, is_sql, ts_sql, fs_sql, mat_sql;
  if (is) is_res = await dealReactionParams(is, database);
  if (ts) ts_res = await dealReactionParams(ts, database);
  if (fs) fs_res = await dealReactionParams(fs, database);
  if (cat) mat_res = await materialsControl.findMaterialsAbstracts(cat);
  // console.log(is_res, ts_res, fs_res, mat_res);
  if (is_res === "" || JSON.stringify(is_res) === "[]") return "Not Found";
  else is_sql = joinGId(is_res, "r_is");
  if (ts_res === "" || JSON.stringify(ts_res) === "[]") return "Not Found";
  else ts_sql = joinGId(ts_res, "r_ts");
  if (fs_res === "" || JSON.stringify(fs_res) === "[]") return "Not Found";
  else fs_sql = joinGId(fs_res, "r_fs");
  if (mat_res === "") return "Not Found";
  else mat_sql = joinGId(mat_res, "mat");
  const g_id_arr = [is_sql, ts_sql, fs_sql, mat_sql];
  // console.log(g_id_arr);
  let joinSql = "";
  for (let i = 0; i < g_id_arr.length; i++) {
    if (g_id_arr[i]) {
      joinSql = `${joinSql} and ${g_id_arr[i]}`;
    }
  }
  joinSql = `select * from reaction r where ${joinSql.replace("and", "")};`;
  return joinSql;
};
const dealReactionIdInput = function (id) {
  if (!id) return "Type Error";
  let joinSql = `select * from reaction r where id = ${id};`;
  return joinSql;
};
const dealGroupIdInput = function (is_id, ts_id, fs_id, mat_id) {
  if (!is_id && !ts_id && !fs_id && !mat_id) return "Type Error";
  const g_id_arr = [is_id, ts_id, fs_id, mat_id];
  const id_key = ["r_is", "r_ts", "r_fs", "mat"];
  let joinSql = "";
  for (let i = 0; i < g_id_arr.length; i++) {
    if (g_id_arr[i]) {
      joinSql = `${joinSql} and ${id_key[i]} = ${g_id_arr[i]}`;
    }
  }
  joinSql = `select * from reaction r where ${joinSql.replace("and", "")};`;
  return joinSql;
};

//reactions
const joinGId = function (param, state) {
  let is_sql = "";
  if (param && param.length > 0) {
    for (let i = 0; i < param.length; i++) {
      is_sql = `${is_sql} or r.${state} = ${param[i]["id"]}`;
    }
    is_sql = `(${is_sql})`.replace("or", "");
    return is_sql;
  } else {
    return "";
  }
};

const getMol = async function (arr, name, database) {
  let molArr = [];
  let inchiArr = [];
  for (let a = 0; a < arr.length; a++) {
    const sql = `select g_set from mol_group where id = ${arr[a][name]}`;
    const res = await database.query({ sql });
    const inchi = Object.values(res[0])[0];
    inchiArr.push(inchi);
  }
  inchiArr = Array.from(new Set(inchiArr));
  //获取mol文件
  for (let i = 0; i < inchiArr.length; i++) {
    let inchi = inchiArr[i];
    let sql = "";
    for (let m in inchi) {
      sql = `id = ${m}`;
      const mol = await database.query({
        sql: `select id,mol from inchi where ${sql}`,
      });
      let key = mol[0]["id"];
      let obj = {};
      obj[key] = mol[0]["mol"];
      molArr.push(obj);
    }
  }
  molArr = Array.from(new Set(molArr));
  return { molArr, inchiArr };
};

const dealFilterSelect = async function (sel, database) {
  let value = Object.entries(sel);
  if (value.length > 0) {
    let group_Str = "",
      res;
    //根据inchi获取g_id
    for (let i = 0; i < value.length; i++) {
      if (value[i][1].length == 0) {
        let key = value[i][0];
        key = dealParams.dealInputParams(key);
        sql = `select id from inchi where ${key}`;
        let inchi = await database.query({ sql: sql });
        for (let k = 0; k < inchi.length; k++) {
          value[i][1].push(inchi[k].id);
        }
      }
      let length = value[i][1].length;
      let str = `json_contains_path(g_set,'one'`;
      for (let j = 0; j < length; j++) {
        str = `${str},'$."${value[i][1][j]}"'`;
      }
      str = `${str})`;
      group_Str = `${group_Str} ${str} and`;
    }
    group_Str = group_Str.slice(0, group_Str.length - 3);
    group_Str = `select id from mol_group where ${group_Str}`;
    res = await database.query({ sql: group_Str });
    return res;
  }
};

module.exports = {
  //reactions
  dealReactionParams,
  dealReactionInput,
  dealReactionIdInput,
  dealGroupIdInput,
  joinGId,
  getMol,
  dealFilterSelect,
};
