const Koa = require("koa");
const app = new Koa();
const json = require("koa-json");
const onerror = require("koa-onerror");
const bodyparser = require("koa-bodyparser");
const logger = require("koa-logger");
const log4js = require("./utils/log4j");
const router = require("koa-router")();
// const jwt = require("jsonwebtoken");
// const koajwt = require("koa-jwt");
const util = require("./utils/util");
const materials = require("./routes/materials")
const reactions = require("./routes/reactions")
const mol2Inchi = require("./routes/mol2inchi")
const demo = require("./routes/demo")
const cors = require("koa2-cors")
// error handler
onerror(app);

app.use(cors())
// middlewares
app.use(
  bodyparser({
    enableTypes: ["json", "form", "text"]
  })
);
app.use(json());
app.use(require("koa-static")(__dirname + "/public"));

app.use(logger());

// logger 
app.use(async (ctx, next) => {
  log4js.info(`get params:${JSON.stringify(ctx.request.query)}`);
  log4js.info(`post params:${JSON.stringify(ctx.request.body)}`);
  await next().catch((err) => {
    if (err.status == "401") {
      ctx.status = 200;
      ctx.body = util.fail("认证失败", util.CODE.AUTH_ERROR);
    } else {
      throw err;
    }
  });
});

// app.use(
//   koajwt({ secret: "imooc" }).unless({
//     path: [/^\/api\/users\/login/]
//   })
// );

router.prefix("/api");

router.use(materials.routes(), materials.allowedMethods());
router.use(reactions.routes(), reactions.allowedMethods());
router.use(mol2Inchi.routes(), mol2Inchi.allowedMethods());
router.use(demo.routes(), mol2Inchi.allowedMethods());
app.use(router.routes(), router.allowedMethods());

// error-handling
app.on("error", (err) => {
  log4js.error(`${err.stack}`);
});

module.exports = app;
