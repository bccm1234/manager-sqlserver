const { Sequelize } = require('sequelize');


const sequelize = new Sequelize('t_zero_workflow', 't_zero_dev', 'Davin1203!', {
    host: 't-zero-mysql.com', //数据库地址,默认本机
    port: '3306',
    dialect: 'mysql',
    logging: true,
    pool: { //连接池设置
        max: 10, //最大连接数
        min: 1, //最小连接数
        idle: 10000
    },
});
module.exports = {
    sequelize
}