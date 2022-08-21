```
const crud = require("../db/crud");
const util = require("../utils/util");

const getList = async (ctx) => {
  const { roleName } = ctx.request.query;
  const { page, skipIndex } = util.pager(ctx.request.query);
  let list;
  let alllist;
  let total;
  try {
    if (roleName) {
      const params = {};
      params.roleName = roleName;
      list = await crud.findThenPaging(
        "*",
        "roles",
        params,
        skipIndex,
        page.pageSize
      );
      alllist = await crud.find("*", "roles", params);
      total = alllist.length;
    } else {
      list = await crud.findAllThenPaging(
        "*",
        "roles",
        skipIndex,
        page.pageSize
      );
      alllist = await crud.findAll("*", "roles");
      total = alllist.length;
    }
    ctx.body = util.success({
      list,
      page: {
        ...page,
        total
      }
    });
  } catch (error) {
    ctx.body = util.fail(`查询失败：${error.stack}`);
  }
};

const operateList = async (ctx) => {
  const { _id, roleName, remark, action } = ctx.request.body;
  let res;
  let info;
  try {
    if (action == "create") {
      const params = { roleName, remark };
      params.createTime = new Date();
      params.updateTime = new Date();
      res = await crud.insertOne("roles", params);
      info = "创建成功";
    } else if (action == "edit") {
      if (_id) {
        const params = { roleName, remark };
        params.updateTime = new Date();
        res = await crud.update("roles", { _id }, params);
        info = "编辑成功";
      } else {
        ctx.body = util.fail("缺少参数params: _id");
        return;
      }
    } else {
      if (_id) {
        res = await crud.deleteOne("roles", { _id });
        info = "删除成功";
      } else {
        ctx.body = util.fail("缺少参数params: _id");
        return;
      }
    }
    ctx.body = util.success(res, info);
  } catch (error) {
    ctx.body = util.fail(error.stack);
  }
};

const updatePermission = async (ctx) => {
  const { _id, permissionList } = ctx.request.body;
  try {
    const params = { permissionList, updateTime: new Date() };
    const res = await crud.update("roles", { _id }, params);
    ctx.body = util.success(res, "权限设置成功");
  } catch (error) {
    ctx.body = util.fail("权限设置失败");
  }
};

module.exports = { getList, operateList, updatePermission };
```