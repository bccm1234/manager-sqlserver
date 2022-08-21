```
const {
  login,
  getList,
  deleteList,
  operateList,
  getPermissionList,
} = require("../controller/userscontrol");

/**
 * 用户管理模块
 */
const router = require("koa-router")();
router.prefix("/users");

// 用户登录
router.post("/login", login);

// 用户列表
router.get("/list", getList);

// 用户删除/批量删除
router.post("/delete", deleteList);

// 用户新增/编辑
router.post("/operate", operateList);

// 获取用户对应的权限菜单
router.get("/getPermissionList", getPermissionList);

module.exports = router;
```;
