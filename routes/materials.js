const {
    findMaterialsAbstracts,
    findMaterialDetails,
    tryin
} = require("../controller/materialsControl");

const router = require("koa-router")();
router.prefix("/materials");

//添加材料数据
// router.post("/addMaterials",addMaterials);

//查询材料数据,list
router.get("/findAbstracts", findMaterialsAbstracts);

//获取材料详细信息
router.get("/findDetails",findMaterialDetails)

//测试接口
router.get("/tryin",tryin)

module.exports = router;
