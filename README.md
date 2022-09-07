
## 技术栈
-Koa2+Mysql CO2催化系统

## 现存功能
- materials信息查询

## 环境搭建(先运行后台，在运行前端)
- 后端环境 manager-server

```
<!-- 在manager-server目录下，下载依赖 -->
npm install

<!-- 在manager-server目录下，运行代码 -->
npm run dev
```


- mysql 文件
```

安装本地安装mysql   并新建test_db数据库
-v  8.0.30
下载地址：https://dev.mysql.com/downloads/installer/
新建表在manager-server目录下db目录下  

manager-server\db\config.js 链接数据库配置及查询方法封装
manager-server\db\crud.js   数据库增删改查方法

manager-server\controller\materialsControl.js materials查询方法
```
