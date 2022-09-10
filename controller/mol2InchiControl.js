const fs = require("fs");
const util = require('../utils/util')
const mol2Inchi = async (ctx)=>{
    const {molStr} = ctx.request.query
    let i;
    fs.readFile('./public/mol_num/num.text','utf-8',function(err,res){
        console.log(err)
        console.log('------')
        console.log(res)
        const num = `${+res + 1}`
        fs.writeFile('./public/mol_num/num.text',num,function(err,res){
            if(err){
                console.log(err)
            }else{
                console.log("写入成功")
                fs.writeFile('C:/Users/Liud/Desktop/projects/server/mol/'+num+'.mol',molStr,function(err,res){
                    if(err){console.log(err)}
                    else{
                        console.log("写入成功")
                    }
                })
            }
        })
    })
    ctx.body = {molStr}
}
module.exports = {
    mol2Inchi
}