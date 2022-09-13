const mysql = require("../db/config");
const dealParams = require("../utils/dealParams");
const dealReactionParams = require("../utils/dealReactionParams");
const util = require("../utils/util");
const findReactions = async (ctx) => {
  let { type, input, filters } = ctx.request.body;
  // Input部分
  let is, ts, fs, cat, r_id, is_id, ts_id, fs_id, mat_id, joinSql, reaction_arr;
  let is_num, fs_num, h_min, h_max, ea_min, ea_max, is_sel, ts_sel, fs_sel;
  if (filters) {
    ({ is_num, fs_num, h_min, h_max, ea_min, ea_max, is_sel, ts_sel, fs_sel } =
      filters);
  }
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
        ctx.body = util.fail("查询失败，未输入数据", 10002);
        return false;
      } else {
        ctx.body = util.fail("查询失败，未能找到", 10003);
        return false;
      }
      break;
    case "reaction_id":
      ({ r_id } = input);
      joinSql = dealReactionParams.dealReactionIdInput(r_id);
      if (joinSql !== "Not Found" && joinSql !== "Type Error")
        reaction_arr = await mysql.query({ sql: joinSql });
      else if (joinSql == "Type Error") {
        ctx.body = util.fail("查询失败，未输入数据", 10002);
        return false;
      } else {
        ctx.body = util.fail("查询失败，未能找到", 10003);
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
        ctx.body = util.fail("查询失败，未输入数据", 10002);
        return false;
      } else {
        ctx.body = util.fail("查询失败，未能找到", 10003);
        return false;
      }
      break;
    case "json":
      break;
    default:
      ctx.body = util.fail("请输入类型", 10001);
      break;
  }
  if (JSON.stringify(reaction_arr) == "[]") {
    ctx.body = util.fail("查询失败，未能找到", 10003);
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
  ctx.body = util.success(
    {
      reaction_arr,
      result,
      group_arr,
      inchi_arr,
    },
    "查询成功"
  );
};
const findReInfo = async (ctx) => {
  const { id } = ctx.request.query;
  try {
    //数组去零拼接成(1,2)样式
    const filterArr = function (arr) {
      let arr_filter = arr.filter((element) => {
        return element !== 0;
      });
      let arr_str;
      if (arr_filter.length) {
        arr_str = `(${arr_filter.join(",")})`;
      } else {
        arr_str = "";
      }
      return arr_str;
    };

    let abs = {},
      co_res = [],
      iso_res = [];
    //abstract
    const is_sql = `select g_set from mol_group mg where mg.id = (select r_is from reaction where id  = ${id});`;
    const ts_sql = `select g_set from mol_group mg where mg.id = (select r_ts from reaction where id  = ${id});`;
    const fs_sql = `select g_set from mol_group mg where mg.id = (select r_fs from reaction where id  = ${id});`;
    const is_res = (await mysql.query({ sql: is_sql }))[0].g_set;
    const ts_res = (await mysql.query({ sql: ts_sql }))[0].g_set;
    const fs_res = (await mysql.query({ sql: fs_sql }))[0].g_set;
    const is_keys_arr = Object.keys(is_res).sort();
    const ts_keys_arr = Object.keys(ts_res).sort();
    const fs_keys_arr = Object.keys(fs_res).sort();
    const is_keys = `(${is_keys_arr.join(",")})`;
    const ts_keys = `(${ts_keys_arr.join(",")})`;
    const fs_keys = `(${fs_keys_arr.join(",")})`;
    const is_mol_sql = `select inchi,inchikey,formula,mol,ads from inchi where id in ${is_keys}`;
    const ts_mol_sql = `select inchi,inchikey,formula,mol,ads from inchi where id in ${ts_keys}`;
    const fs_mol_sql = `select inchi,inchikey,formula,mol,ads from inchi where id in ${fs_keys}`;
    let is_mol = await mysql.query({ sql: is_mol_sql });
    let ts_mol = await mysql.query({ sql: ts_mol_sql });
    let fs_mol = await mysql.query({ sql: fs_mol_sql });
    is_mol.forEach((element, index) => {
      element.num = is_keys_arr[index];
    });
    ts_mol.forEach((element, index) => {
      element.num = ts_keys_arr[index];
    });
    fs_mol.forEach((element, index) => {
      element.num = fs_keys_arr[index];
    });
    abs.mol = [is_mol, ts_mol, fs_mol];
    const info_sql = `select r_type,r_is,r_ts,r_fs,formula catalyst_formula,cry_sys,spa_gro,miller,termin from reaction r,material m where r.id = ${id} and r.mat = m.id;`;
    const info = await mysql.query({ sql: info_sql });
    abs.group = [info[0].r_is, info[0].r_ts, info[0].r_fs];
    delete info[0].r_is;
    delete info[0].r_ts, delete info[0].r_fs;
    Object.assign(abs, info[0]);
    //co
    const co_sql = `select is_json,ts_json,fs_json,is_energy,ts_energy,fs_energy,h,ea,source from thermo t where t.r_id = ${id} and thermo_type = 'co' order by star;`;
    co_res = await mysql.query({ sql: co_sql });

    for (let i = 0; i < co_res.length; i++) {
      //获取cif信息
      let is_json = co_res[i].is_json;
      let ts_json = co_res[i].ts_json;
      let fs_json = co_res[i].fs_json;

      let is_mix = filterArr(is_json.mix);
      let ts_mix = filterArr(ts_json.mix);
      let fs_mix = filterArr(fs_json.mix);
      let module = [];
      if (is_mix) {
        const mix_cif_sql = `select cif from vaspjob where id in ${is_mix};`;
        let mix_cif = (await mysql.query({ sql: mix_cif_sql })).map(
          (element) => {
            return element.cif;
          }
        );
        let isObj = {
          type: "IS",
          cif: mix_cif[0],
        };
        module.push(isObj);
      }
      if (ts_mix) {
        const mix_cif_sql = `select cif from vaspjob where id in ${ts_mix};`;
        let mix_cif = (await mysql.query({ sql: mix_cif_sql })).map(
          (element) => {
            return element.cif;
          }
        );
        let tsObj = {
          type: "TS",
          cif: mix_cif[0],
        };
        module.push(tsObj);
      }
      if (fs_mix) {
        const mix_cif_sql = `select cif from vaspjob where id in ${fs_mix};`;
        let mix_cif = (await mysql.query({ sql: mix_cif_sql })).map(
          (element) => {
            return element.cif;
          }
        );
        let fsObj = {
          type: "FS",
          cif: mix_cif[0],
        };
        module.push(fsObj);
      }
      co_res[i].module = module;
      //获取计算信息-取末态的mix
      const job_id = co_res[i].fs_json.mix[0];
      const cat_info_sql = `select source,encut,prec,ldau,ivdw,lhfcalc,ldipol,nupdown,excharge,version,formula as atom_color from vaspjob v,incar i,poscar p where v.id = ${job_id} and v.incar_id = i.id and v.poscar_id = p.id;`;
      const cat_info = (await mysql.query({ sql: cat_info_sql }))[0];
      cat_info.atom_color = Object.keys(cat_info.atom_color);
      Object.assign(co_res[i], cat_info);
      //获取所有的vaspfile-获取所有mix
      const mix_all = `(${[
        ...co_res[i].is_json.mix,
        ...co_res[i].ts_json.mix,
        ...co_res[i].fs_json.mix,
      ].join(",")})`;
      const co_vasp_file_sql = `select vaspfile from vaspjob v,poscar p where v.id in ${mix_all} and v.poscar_id = p.id`;
      const co_vasp_file = await mysql.query({ sql: co_vasp_file_sql });
      let co_vasp_file_arr = co_vasp_file.map((element) => {
        return element.vaspfile;
      });
      co_res[i].vaspfile = co_vasp_file_arr;
      co_res[i].is_json = co_res[i].is_json.mix_cif;
      co_res[i].ts_json = co_res[i].ts_json.mix_cif;
      co_res[i].fs_json = co_res[i].fs_json.mix_cif;
    }
    //iso
    const iso_sql = `select is_json,ts_json,fs_json,is_energy,ts_energy,fs_energy,h,ea,source from thermo t where t.r_id = ${id} and thermo_type = 'iso' order by star;`;
    iso_res = await mysql.query({ sql: iso_sql });

    //拼接字符串
    const splitStr = function (str) {
      return `select v.id,cif,formula as atom_color,fr_energy,source,encut,prec,ldau,ivdw,lhfcalc,ldipol,nupdown,excharge,version from vaspjob v,incar i,poscar p where v.id in ${str} and v.incar_id = i.id and v.poscar_id = p.id;`;
    };
    for (let i = 0; i < iso_res.length; i++) {
      //获取mix和slab的cif信息
      let iso_is_json = iso_res[i].is_json;
      let iso_ts_json = iso_res[i].ts_json;
      let iso_fs_json = iso_res[i].fs_json;
      let table = [
        {
          type: "IS",
          mix: iso_is_json.mix,
          slab: iso_is_json.slab,
          energy: iso_res[i].is_energy,
        },
        {
          type: "TS",
          mix: iso_ts_json.mix,
          slab: iso_ts_json.slab,
          energy: iso_res[i].ts_energy,
        },
        {
          type: "FS",
          mix: iso_fs_json.mix,
          slab: iso_fs_json.slab,
          energy: iso_res[i].fs_energy,
        },
      ];
      iso_res[i].table = table;
      let iso_mix_slab_arr = [
        ...iso_is_json.mix,
        ...iso_fs_json.slab,
        ...iso_ts_json.mix,
        ...iso_ts_json.slab,
        ...iso_fs_json.mix,
        ...iso_fs_json.slab,
      ];
      let iso_mix_slab_filter = filterArr(iso_mix_slab_arr);
      if (iso_mix_slab_filter) {
        const iso_mix_slab_sql = splitStr(iso_mix_slab_filter);
        const iso_mix_slab = await mysql.query({ sql: iso_mix_slab_sql });
        let iso_mix_slab_obj = {};
        iso_mix_slab.forEach((element) => {
          element.atom_color = Object.keys(element.atom_color);
          const e_id = element.id + "";
          iso_mix_slab_obj[e_id] = element;
        });
        iso_res[i].mix_slab = iso_mix_slab_obj;
      }
      delete iso_res[i].is_json;
      delete iso_res[i].ts_json;
      delete iso_res[i].fs_json;
    }
    let data = { abs, co_res, iso_res };
    ctx.body = util.success(data, "反应信息检索成功");
  } catch {
    ctx.body = util.file("反应信息检索失败");
  }
};
module.exports = {
  findReactions,
  findReInfo,
};
