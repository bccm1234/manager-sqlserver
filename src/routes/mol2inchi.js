const {mol2Inchi} = require('../controller/mol2InchiControl')

const router = require("koa-router")();
router.prefix("/ketcher");

//查询反应数据
router.get("/getInchi", mol2Inchi);

module.exports = router;