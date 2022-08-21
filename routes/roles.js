```
const {
  getList,
  operateList,
  updatePermission
} = require("../controller/rolescontrol");

/**
 * 用户管理模块
 */
const router = require("koa-router")();
router.prefix("/roles");

// 按页获取角色列表
router.get("/list", getList);

// 角色操作：创建、编辑和删除
router.post("/operate", operateList);

// 权限设置
router.post("/update/permission", updatePermission);

module.exports = router;
```;
