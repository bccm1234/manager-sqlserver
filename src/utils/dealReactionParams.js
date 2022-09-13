const { CITEXT } = require("sequelize");
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
      const ads = parseInt(params[i].select[1]);
      const value = params[i].value;
      switch (type) {
        case "Formula":
          let for_info = dealParams.dealInputParams(value);
          let sql_info = `${for_info} and ads = ${ads}`;
          sql = `select id from inchi where ${sql_info}`;
          try {
            inchi = await database.query({ sql: sql });
          } catch (e) {
            return "DB Error";
          }
          break;
        case "InChI":
          sql = `select id from inchi where inchi = '${value}' and ads = ${ads}`;
          try {
            inchi = await database.query({ sql: sql });
          } catch (e) {
            return "DB Error";
          }
          break;
        case "InChIKey":
          sql = `select id from inchi where inchikey = '${value}' and ads = ${ads}`;
          try {
            inchi = await database.query({ sql: sql });
          } catch (e) {
            return "DB Error";
          }
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
          return [];
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
      try {
        const res = await database.query({ sql: group_Str });
        return res;
      } catch (e) {
        return "DB Error";
      }
    } else {
      return [];
    }
  } else {
    return [];
  }
};
const dealReactionInput = async function (is, ts, fs, cat, database) {
  //获取is/ts/fs对应的group_id
  console.log(is, ts, fs, cat);
  if (!is && !ts && !fs && !cat) return "Type Error";
  let is_res, ts_res, fs_res, mat_res, is_sql, ts_sql, fs_sql, mat_sql;
  if (is[0].select.length == 2) is_res = await dealReactionParams(is, database);
  if (ts[0].select.length == 2) ts_res = await dealReactionParams(ts, database);
  if (fs[0].select.length == 2) fs_res = await dealReactionParams(fs, database);
  if (cat) mat_res = await materialsControl.findMaterialsAbstracts(cat);
  console.log(is_res, ts_res, fs_res, mat_res);
  if (Array.isArray(is_res) && is_res.length == 0) {
    return "Not Found";
  } else if (is_res === "DB Error") return "DB Error";
  else is_sql = joinGId(is_res, "r_is");
  if (Array.isArray(ts_res) && ts_res.length == 0) {
    return "Not Found";
  } else if (ts_res === "DB Error") return "DB Error";
  else ts_sql = joinGId(ts_res, "r_ts");
  if (Array.isArray(fs_res) && fs_res.length == 0) {
    return "Not Found";
  } else if (fs_res === "DB Error") return "DB Error";
  else fs_sql = joinGId(fs_res, "r_fs");
  if (mat_res === "") return "Not Found";
  else mat_sql = joinGId(mat_res, "mat");
  const g_id_arr = [is_sql, ts_sql, fs_sql, mat_sql];
  console.log(g_id_arr);
  let joinSql = "";
  for (let i = 0; i < g_id_arr.length; i++) {
    if (g_id_arr[i]) {
      joinSql = `${joinSql} and ${g_id_arr[i]}`;
    }
  }
  joinSql = `select * from reaction r where ${joinSql.replace("and", "")};`;
  console.log(joinSql);
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

const findGroupArr = async function (group, rid, database) {
  let group_sql = `select distinct r.r_${group}  as id  from reaction r where ${rid}`;
  let group_id = await database.query({ sql: group_sql });
  let group_obj = { type: group };
  Object.assign(group_obj, { data: [] });
  for (let i = 0; i < group_id.length; i++) {
    let g_id = group_id[i].id;
    let data_obj = { title: `${group}${g_id}`, values: [] };
    group_obj.data.push(data_obj);
    let g_sql = `select g_set from mol_group mg where mg.id = ${g_id}`;
    let g_res = await database.query({ sql: g_sql });
    let inchi_arr = g_res[0]["g_set"];
    for (let j in inchi_arr) {
      let inchi = `select mol as molfile ,ads from inchi where id = ${j}`;
      let inchi_res = await database.query({ sql: inchi });
      data_obj.values.push(inchi_res[0]);
    }
  }
  return group_obj;
};

const findInputArr = async function (group, rid, database) {
  let group_sql = `select distinct r.r_${group}  as id  from reaction r where ${rid}`;
  let group_id = await database.query({ sql: group_sql });
  let group_arr = [];
  let input_set = new Set();
  for (let i = 0; i < group_id.length; i++) {
    let g_id = group_id[i].id;
    let g_sql = `select g_set from mol_group mg where mg.id = ${g_id}`;
    let g_res = await database.query({ sql: g_sql });
    let inchi_arr = g_res[0]["g_set"];
    for (let j in inchi_arr) {
      let inchi = `select formula from inchi where id = ${j}`;
      let inchi_res = await database.query({ sql: inchi });
      let input_formula = joinInput(inchi_res[0].formula);
      input_set.add(input_formula);
    }
  }
  return Array.from(input_set);
};

const joinInput = function (param) {
  let input = "";
  for (let ele in param) {
    let num = param[ele] != 1 ? param[ele] : "";
    input = `${input}${ele}${num}`;
  }
  return input;
};

const findInchiArr = async function (group, input, database) {
  let input_arr = [];
  for (let i = 0; i < input.length; i++) {
    let input_obj = { type: group, key: input[i], values: "" };
    let input_info = dealParams.dealInputParams(input[i]);
    let sql = `select id,mol as molfile from inchi where ${input_info}`;
    let res = await database.query({ sql });
    input_obj.values = res;
    input_arr.push(input_obj);
  }
  return input_arr;
};
module.exports = {
  dealReactionParams,
  dealReactionInput,
  dealReactionIdInput,
  dealGroupIdInput,
  joinGId,
  dealFilterSelect,
  findGroupArr,
  findInputArr,
  findInchiArr,
};
