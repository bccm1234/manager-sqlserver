const { findReactions } = require("../controller/reactionControl");

const router = require("koa-router")();
router.prefix("/reactions");

//查询反应数据
router.get("/findList", findReactions);

module.exports = router;