const util = require("../src/utils/util");
const Data = require("../models/dataSchema");
const fs = require("fs");
const path = require("path");

const submitData = async (ctx) => {
  try {
    const params = ctx.request.body;
    const res = await Data.create(params);
    ctx.body = util.success(res, `提交成功`);
  } catch (error) {
    ctx.body = util.fail(error, "提交失败");
  }
};

const submitFile = async (ctx) => {
  try {
    let data,
      res = [];
    // 获取上传文件
    const file = ctx.request.files.file;
    if (path.extname(file.name) == ".json") {
      data = JSON.parse(
        fs.readFileSync(file.filepath, { encoding: "utf8", flag: "r" })
      );
      for (let params of data) {
        const r = await Data.create(params);
        res.push(r);
      }
    }
    ctx.body = util.success(res, "上传成功");
  } catch (error) {
    ctx.body = util.fail(error, "上传失败");
  }
};
module.exports = { submitData, submitFile };
