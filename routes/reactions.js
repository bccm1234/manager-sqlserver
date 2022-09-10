const {
    findReList,findReInfo
} = require("../controller/reactionControl");

const router = require("koa-router")();
router.prefix("/reactions");

//查询反应数据
router.get("/findReList", findReList);
router.get("/findReInfo", findReInfo);

module.exports = router;