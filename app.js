const Koa = require("koa");
const app = new Koa();
const json = require("koa-json");
const onerror = require("koa-onerror");
const bodyparser = require("koa-bodyparser");
const logger = require("koa-logger");
const log4js = require("./utils/log4j");
const router = require("koa-router")();
// const jwt = require("jsonwebtoken");
const koajwt = require("koa-jwt");
const util = require("./utils/util");

// error handler
onerror(app);

// middlewares
app.use(
  bodyparser({
    enableTypes: ["json", "form", "text"]
  })
);
app.use(json());
app.use(logger());
// app.use(require("koa-static")(__dirname + "/public"));

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

app.use(
  koajwt({ secret: "imooc" }).unless({
    path: [/^\/api\/users\/login/]
  })
);

router.prefix("/api");

app.use(router.routes(), router.allowedMethods());

// error-handling
app.on("error", (err) => {
  log4js.error(`${err.stack}`);
});

module.exports = app;
