const {getDemoOrm} = require("../db/conlectionUtils");

//测试接口
const orm = async (ctx) => {
    console.log('111');
    let t = await getDemoOrm();
    ctx.body = {
        a: JSON.parse(JSON.stringify(t))
    };
    
};
module.exports = {
    orm,
};