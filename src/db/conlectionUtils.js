const { QueryTypes } = require('sequelize');
const { sequelize } = require('./dbConfig');

const getDemoOrm = async () => {
    let users = await sequelize.query("SELECT * FROM `t_zero_hi_procinst` limit 1", { type: QueryTypes.SELECT });
    return users;
}

module.exports = {
    getDemoOrm
}