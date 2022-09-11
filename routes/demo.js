const {
    orm,
  } = require("../controller/demo");
  
  const router = require("koa-router")();
  router.prefix("/demo");
  // orm
  router.get("/orm", orm);
  
  module.exports = router;
  