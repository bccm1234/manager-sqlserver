const mysql = require("mysql2");
const pool = mysql.createPool({
  host: "sh-cynosdbmysql-grp-20c82mos.sql.tencentcdb.com", // 数据库地址
  user: "zsh", // 数据库用户
  password: "zsh.0726", // 数据库密码
  database: "test", // 选中数据库
  port: "26720"
});

exports.query = function (arr = null) {
  if (!arr.sql) {
    return Promise.reject("sql语句为空");
  }

  return new Promise((resolve, reject) => {
    pool.getConnection(function (err, connection) {
        console.log("**mysql连接成功**")
      connection.query(arr.sql, (error, results) => {
        if (error) reject(error);

        resolve(results);
      });

      connection.release();
    });
  });
};
exports.formatParams = function (params) {
  const keys = Object.keys(params);
  const values = Object.values(params);
  const resultArr = [];
  keys.map((item, index) => {
    resultArr.push(item + " = '" + values[index] + "'");
  });
  return resultArr.join(",");
};
exports.formatLogicParams = function (param, logicSymbol, ...args) {
  let result = "";
  const concatParmas = function (param, logicSymbol, ...args) {
    const keys = Object.keys(param);
    const values = Object.values(param);
    const symbol = logicSymbol ? logicSymbol : "";
    result += ` ${keys[0]} = '${values[0]}' ${symbol}`;
    if (args.length) concatParmas(...args);
  };
  concatParmas(param, logicSymbol, ...args);
  return result;
};
exports.formatParamsInList = function (param, List) {
  const  result = `${param} in (${List.join(",")})`
  return result;
};
