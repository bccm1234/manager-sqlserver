const util = require("../utils/util");
const crud = require("../db/crud");
const mater = require("../utils/dealParams");
const mysql = require("../db/config");
//分页查询abstract
const findMaterialsAbstracts = async (ctx) => {
  let terms = "";
  let {
    Input,
    type,
    cry_sys,
    spa_gro,
    miller,
    termin,
    sort,
    pageSize = 10,
    pageNum = 1,
  } = ctx.request.query;
  //处理Input
  const inputStr = mater.dealInputParams(Input);
  //type
  let typeStr = "";
  if (type) {
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
  }
  //排序
  let sortStr = "";
  if (sort) {
    sortStr = `${sortStr} order by ${sort} `;
  }
  //拼接terms
  terms = `${terms} ${inputStr} and m.f_id = f.f_id ${typeStr} ${sortStr}`;
  //计数
  const mat_num = await mysql.query({
    sql: `select count(*) as mat_num  from material m,formula f where ${terms}`,
  });
  //分页
  const pageInfo = util.pager({ pageNum, pageSize });
  terms = `${terms} limit ${pageInfo.skipIndex},${pageSize}`;
  const matRes = await crud.complexFind(
    "mat_id,type,f_string as formula,cry_sys,spa_gro,miller,termin",
    "material m,formula f",
    terms
  );
  const res = { matRes, matNum: mat_num[0].mat_num, page: pageInfo.page };
  if (res) {
    ctx.body = util.success(res, "检索成功");
  } else {
    ctx.body = util.fail("未能检索到相关材料，请重新输入");
  }
};

//根据id查询所有信息
const findMaterialDetails = async (ctx) => {
  const { id, type } = ctx.request.query;
  let typeStr = "";
  if (type === "opti") {
    typeStr =
      "source,cif,encut,prec,ldau,ivdw,lhfcalc,ldipol,n_up_down,extra_e,version,vasp_file,basis,crysys,spagro,miller,termin,energy";
  } else if (type === "elec") {
    typeStr =
      "source,encut,prec,ldau,ivdw,lhfcalc,ldipol,n_up_down,extra_e,version,vasp_file,dos_json,poten_json,chg_den,spin_den";
  }
  const job_sql = `select ${typeStr} from vaspjob v ,incar i ,poscar p ,kpoint k,material m where v.job_id  = ${id} and v.incar = i.incar_id and v.poscar = p.pos_id and v.kpoints = k.kpo_id and v.mat_id = m.mat_id;`;
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
