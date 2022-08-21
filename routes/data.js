/**
 * 数据管理模块
 */

const { submitData, submitFile } = require("../controller/datacontrol");

const router = require("koa-router")();

router.prefix("/data");

router.post("/submit", submitData);

router.post("/file", submitFile);

module.exports = router;
