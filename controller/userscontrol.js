```
const crud = require("./../db/crud");
const db = require("./../db/config");
const util = require("./../utils/util");
const jwt = require("jsonwebtoken");
const md5 = require("md5");

const login = async (ctx) => {
  try {
    const { username, password } = ctx.request.body;
    const params = db.formatLogicParams(
      { username: username },
      "and",
      {
        password: md5(password)
      },
      "or",
      { username: username },
      "and",
      { password: password }
    );
    const res = await crud.complexFind(
      "userId,username,userEmail,state,role,deptId,roleList",
      "users",
      params
    );
    if (res) {
      const data = res[0];

      const token = jwt.sign(
        {
          data
        },
        "imooc",
        { expiresIn: "10h" }
      );
      data.token = token;
      ctx.body = util.success(data);
    } else {
      ctx.body = util.fail("账号或密码不正确");
    }
  } catch (error) {
    ctx.body = util.fail(error.msg);
  }
};

const getList = async (ctx) => {
  const { userId, username, state } = ctx.request.query;
  const { page, skipIndex } = util.pager(ctx.request.query);
  let list, alllist, total;
  const params = {};
  if (userId) params.userId = userId;
  if (username) params.username = username;
  if (state && state != "0") params.state = state;
  try {
    // 根据条件查询所有用户列表
    if (JSON.stringify(params) != "{}") {
      list = await crud.findThenPaging(
        "userId,username,userEmail,state,role,deptId,roleList,job,mobile",
        "users",
        params,
        skipIndex,
        page.pageSize
      );
      alllist = await crud.find("*", "users", params);
      total = alllist.length;
    } else {
      list = await crud.findAllThenPaging(
        "userId,username,userEmail,state,role,deptId,roleList,job,mobile",
        "users",
        skipIndex,
        page.pageSize
      );
      alllist = await crud.findAll("*", "users");
      total = alllist.length;
    }
    ctx.body = util.success({
      page: {
        ...page,
        total
      },
      list
    });
  } catch (error) {
    ctx.body = util.fail(`查询异常:${error.stack}`);
  }
};

const deleteList = async (ctx) => {
  try {
    // 待删除的用户Id数组
    const { _id } = ctx.request.body;
    const res = await crud.deleteOne("users", { _id });
    ctx.body = util.success(res.username, `删除成功`);
  } catch (error) {
    ctx.body = util.fail(error, "删除失败");
  }
};

const operateList = async (ctx) => {
  const {
    userId,
    username,
    userEmail,
    password,
    mobile,
    job,
    state,
    roleList,
    deptId,
    action
  } = ctx.request.body;
  if (action == "add") {
    if (!username || !userEmail || !deptId) {
      ctx.body = util.fail("参数错误", util.CODE.PARAM_ERROR);
      return;
    }
    const params = db.formatLogicParams({ username: username }, "or", {
      password: password
    });
    const res = await crud.complexFind(
      "_id,username,userEmail",
      "users",
      params
    );
    if (res) {
      ctx.body = util.fail(
        `系统监测到有重复的用户，信息如下：${res.username} - ${res.userEmail}`
      );
    } else {
      try {
        const params = {
          userId: Math.floor(Math.random() * 10 + 1),
          username: username,
          password: md5(password),
          userEmail,
          role: 1, // 默认普通用户
          roleList,
          job,
          state,
          deptId,
          mobile
        };
        const res = await crud.insertOne("users", params);
        ctx.body = util.success(res, "用户创建成功");
      } catch (error) {
        ctx.body = util.fail(error.stack, "用户创建失败");
      }
    }
  } else {
    if (!deptId) {
      ctx.body = util.fail("部门不能为空", util.CODE.PARAM_ERROR);
      return;
    }
    try {
      const res = await crud.update(
        "users",
        { userId },
        { mobile, job, state, roleList, deptId }
      );
      ctx.body = util.success(res, "更新成功");
    } catch (error) {
      ctx.body = util.fail(error.stack, "更新失败");
    }
  }
};

const getPermissionList = async (ctx) => {
  const authorization = ctx.request.headers.authorization;
  const { data } = util.decoded(authorization);
  const menuList = await getMenuList(data.role, data.roleList);
  const actionList = getAction(JSON.parse(JSON.stringify(menuList)));
  ctx.body = util.success({ menuList, actionList });
};

/**
 * 获取菜单列表
 * @param {number} userRole 权限等级
 * @param {number} roleKeys 角色
 * @return {Array} 菜单列表
 */
async function getMenuList(userRole, roleKeys) {
  let rootList = [];
  if (userRole == 0) {
    rootList = (await crud.findAll("*", "menu")) || [];
  } else {
    // 根据用户拥有的角色，获取权限列表
    // 现查找用户对应的角色有哪些
    const params = db.formatParamsInList("roleName", roleKeys);
    const roleList = await crud.complexFind("*", "roles", params);
    let permissionList = [];
    roleList.map((role) => {
      const { checkedKeys, halfCheckedKeys } = role.permissionList;
      permissionList = permissionList.concat([
        ...checkedKeys,
        ...halfCheckedKeys
      ]);
    });
    permissionList = [...new Set(permissionList)];
    const params2 = db.formatParamsInList("id", permissionList);
    rootList = await crud.complexFind("*", "menu", params2);
  }
  return util.getTreeMenu(rootList, null, []);
}

/**
 * 获取菜单列表
 * @param {Array} list 菜单列表
 * @return {Array} 行为列表
 */
function getAction(list) {
  const actionList = [];
  const deep = (arr) => {
    while (arr.length) {
      const item = arr.pop();
      if (item.action.length != 0) {
        item.action.map((action) => {
          actionList.push(action.menuCode);
        });
      }
      if (item.children.length != 0 && item.action.length == 0) {
        deep(item.children);
      }
    }
  };
  deep(list);
  return actionList;
}

module.exports = { login, getList, deleteList, operateList, getPermissionList };
```