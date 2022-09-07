const util = require("../utils/util");
const crud = require("../db/crud");
const mater = require("../utils/dealParams");
const mysql = require("../db/config");

const adsListContain = "id,mat_type,formula,cry_sys,spa_gro,miller,termin";
const optiContain =
  "source,cif,m.formula,encut,prec,ldau,ivdw,lhfcalc,ldipol,nupdown,excharge,version,vaspfile,basis,cry_sys,spa_gro,miller,termin,fr_energy";
const elecContain =
  "source,m.formula,encut,prec,ldau,ivdw,lhfcalc,ldipol,nupdown,excharge,version,vaspfile,dos_json,poten_json,chg_den,spin_den";
//分页查询abstract
const findMaterialsAbstracts = async (ctx) => {
  let Input,
    type,
    cry_sys,
    spa_gro,
    miller,
    termin,
    sort,
    terms = "";
  if (ctx.request) {
    ({ Input, type, cry_sys, spa_gro, miller, termin, sort } =
      ctx.request.query);
  } else {
    ({ Input, cry_sys, spa_gro, miller, termin } = ctx);
  }
  //处理Input
  const inputStr = mater.dealInputParams(Input);
  //type
  let typeStr = "";
  if (type) typeStr = `${typeStr} and m.mat_type = '${type}'`;
  //去掉下面四个属性中的空属性
  let containObj = {
    cry_sys,
    spa_gro,
    miller,
    termin,
  };
  Object.keys(containObj).map((item) => {
    if (containObj[item] == "") {
      delete containObj[item];
    } else {
      typeStr = `${typeStr} and m.${item} = '${containObj[item]}'`;
    }
  });
  //排序
  let sortStr = "";
  if (sort) {
    sortStr = `${sortStr} order by ${sort} `;
  }
  //拼接terms
  terms = `${terms} ${inputStr} ${typeStr} ${sortStr}`;
  const matRes = await crud.complexFind(adsListContain, "material m", terms);
  const res = matRes;
  if (res && ctx.request) {
    ctx.body = util.success(res, "检索成功");
  } else if (ctx.request) {
    ctx.body = util.fail("未能检索到相关材料，请重新输入");
  } else {
    return res;
  }
};

//根据id查询所有信息
const findMaterialDetails = async (ctx) => {
  const { id, type } = ctx.request.query;
  let typeStr = "";
  if (type === "opti") {
    typeStr = optiContain;
  } else if (type === "elec") {
    typeStr = elecContain;
  }
  const job_sql = `select ${typeStr} from vaspjob v ,incar i ,poscar p ,material m where v.mat_id  = ${id} and v.incar_id = i.id and v.poscar_id = p.id  and v.mat_id = m.id;`;
  let job_res = await mysql.query({ sql: job_sql });
  if (type === "opti") {
    job_res.forEach((element) => {
      element.basis = mater.getCellParam(element.basis);
    });
  }
  if (job_res) {
    ctx.body = util.success(job_res, "材料信息检索成功");
  } else {
    ctx.body = util.fail("未能检索到相关材料");
  }
};

//测试接口
const tryin = async (ctx) => {
  const { id } = ctx.request.query;
  const test = JSON.parse(id);
  console.log(typeof test[0][0]);
  console.log(test[0][0]);
  const sql = `select * from formula where f_id in (1,2,3);`;
  const res = await mysql.query({ sql });
  ctx.body = {
    res,
  };
};
module.exports = {
  findMaterialsAbstracts,
  findMaterialDetails,
  tryin,
};
