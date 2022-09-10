const { compose } = require("koa-convert");
const mysql = require("../db/config");
const util = require("../utils/util");
const dealParams = require("../utils/dealParams");
const materC = require("./materialsControl");
const findReList = async (ctx) => {
  let { IS, TS, FS, Cat, IS_num, FS_num, isomer, H, Ea } = ctx.request.query;
  let mat_params = eval("(" + Cat + ")");
  let is_sel, ts_sel, fs_sel, is_num, fs_num, e_sql;
  if (isomer) {
    let iso = eval(isomer);
    is_sel = iso[0];
    ts_sel = iso[1];
    fs_sel = iso[2];
  }
  if (IS_num) is_num = eval(IS_num);
  if (FS_num) fs_num = eval(FS_num);
  //获取is\ts\fs对应的group_id
  const is_res = await dealParams.dealReactionParams(IS, mysql, is_sel, is_num);
  const ts_res = await dealParams.dealReactionParams(TS, mysql, ts_sel);
  const fs_res = await dealParams.dealReactionParams(FS, mysql, fs_sel, fs_num);
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
  if (H || Ea) {
    e_sql = `select r_id from thermo where`;
    if (H) {
      H = eval(H);
      e_sql = `${e_sql} H >= ${H[0]} and H <= ${H[1]} and`;
    }
    if (Ea) {
      Ea = eval(Ea);
      e_sql = `${e_sql} Ea >= ${Ea[0]} and Ea <= ${Ea[1]} and`;
    }
    e_sql = e_sql.slice(0, e_sql.length - 3);
  }
  joinSql = `select * from reaction r where ${joinSql.replace("and", "")};`;
  if (e_sql)
    joinSql = `${joinSql.slice(0, joinSql.length - 1)} and id in (${e_sql});`;
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
    delete info[0].r_is
    delete info[0].r_ts,
    delete info[0].r_fs
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
      let module = []
      if (is_mix) {
        const mix_cif_sql = `select cif from vaspjob where id in ${is_mix};`;
        let mix_cif = (await mysql.query({ sql: mix_cif_sql })).map(
          (element) => {
            return element.cif;
          }
        );
        let isObj={
          type:"IS",
          cif:mix_cif[0]
        }
        module.push(isObj)
      }
      if (ts_mix) {
        const mix_cif_sql = `select cif from vaspjob where id in ${ts_mix};`;
        let mix_cif = (await mysql.query({ sql: mix_cif_sql })).map(
          (element) => {
            return element.cif;
          }
        );
        let tsObj={
          type:"TS",
          cif:mix_cif[0]
        }
        module.push(tsObj)
      }
      if (fs_mix) {
        const mix_cif_sql = `select cif from vaspjob where id in ${fs_mix};`;
        let mix_cif = (await mysql.query({ sql: mix_cif_sql })).map(
          (element) => {
            return element.cif;
          }
        );
        let fsObj={
          type:"FS",
          cif:mix_cif[0]
        }
        module.push(fsObj)
      }
      co_res[i].module = module
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
      let table = [{type:"IS",mix:iso_is_json.mix,slab:iso_is_json.slab,energy:iso_res[i].is_energy},{type:"TS",mix:iso_ts_json.mix,slab:iso_ts_json.slab,energy:iso_res[i].ts_energy},{type:"FS",mix:iso_fs_json.mix,slab:iso_fs_json.slab,energy:iso_res[i].fs_energy}]
      iso_res[i].table = table
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
      delete iso_res[i].is_json
      delete iso_res[i].ts_json
      delete iso_res[i].fs_json
    }
    let data = { abs, co_res, iso_res };
    ctx.body = util.success(data, "反应信息检索成功");
  } catch {
    ctx.body = util.file("反应信息检索失败");
  }
};
module.exports = {
  findReList,
  findReInfo,
};
