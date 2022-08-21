const util = require("../utils/util");
const mater = require("../utils/dealParams");
//分页查询abstract
const findMaterialsAbstracts = async (ctx) => {
  const params = dealParams(ctx);
  const res = await crud.complexFind(
    "type,crysys,spagro,miller,termin",
    "material",
    params
  );
  if (res) {
    ctx.body = util.success(res, "检索成功");
  } else {
    ctx.body = util.fail("未能检索到相关材料，请重新输入");
  }
};
//处理参数
const dealParams = function (ctx) {
  //   let {
  //     Input,
  //     type,
  //     crystalSystem,
  //     spaceGroup,
  //     millerIndice,
  //     termination,
  //     sort,
  //     pageSize = 10,
  //     pageNum = 1
  //   } = ctx.request.query;
  //   if (sort) sort = JSON.parse(sort);
  //   if (!sort) sort = { id: 1 };
  //   let inputObj = {};
  //   let inputArr = [];
  //   let params;
  //   //处理Input
  //   const inputParams = dealInputParams(Input);
  //   //处理filters
  //   //bulk
  //   let bulk = {
  //     "abs.crystalSystem": crystalSystem,
  //     "abs.spaceGroup": spaceGroup
  //   };
  //   let inputStr = JSON.stringify(inputObj);
  //   let bulkObj = JSON.parse(JSON.stringify(inputObj));
  //   for (i in bulk) {
  //     if (bulk[i]) {
  //       bulkObj[i] = bulk[i];
  //     }
  //   }
  //   //slab
  //   let slab = {
  //     "abs.millerIndice": millerIndice,
  //     "abs.termination": termination
  //   };
  //   let slabObj = JSON.parse(JSON.stringify(inputObj));
  //   for (i in slab) {
  //     if (slab[i]) {
  //       slabObj[i] = slab[i];
  //     }
  //   }
  //   //处理sort
  //   let sortObj = {};
  //   for (item in sort) {
  //     let key = "abs." + item;
  //     sortObj[key] = sort[item];
  //   }
  //   return { bulkObj, slabObj, sortObj, inputStr };
};

const dealInputParams = (Input) => {
  let params, inputArr;
  if (Input.includes("mat")) {
    // mat-1
    // params = Input.slice(4);
  } else if (Input.includes("-")) {
    //Cu-O,Cu-O-*
    inputArr = Input.split("-");
    inputArr = inputArr.filter((x) => {
      if (x) return x;
    });
    params = mater.dealInputArrMethodOne(inputArr);
  } else if (Input.includes(",")) {
    //Cu,O
    inputArr = Input.split(",");
    inputArr = inputArr.filter((x) => {
      if (x) return x;
    });
    params = mater.dealInputArrMethodTwo(inputArr);
  } else {
    // formula查询
    params = mater.dealInputArrMethodThree(Input);
  }
  return params;
};
console.log(dealInputParams("Cu,O"));
//根据id查询所有信息

module.exports = {
  findMaterialsAbstracts
};
