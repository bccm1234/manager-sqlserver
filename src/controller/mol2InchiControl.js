const fs = require("fs");
const axios = require("axios")
const util = require("../utils/util");
const { v4: uuidv4 } = require("uuid");
const mol2Inchi = async (ctx) => {
  const { molStr } = ctx.request.query;
  const uuid = uuidv4()
  const address = `/home/centos/mol/${uuid}`
  try{
    fs.writeFileSync(address + ".mol",molStr,'utf8');
    const switchRes = await axios.post('http://43.142.96.10:9001/dpb/execShellScript',{
    "shellScriptPath": "mol2stdinchi.sh",
    "inFilePathAndDocName": address + ".mol"
  })
  if(switchRes.data.operate  === 'success') {
    const res = fs.readFileSync(address + ".mol.txt",'utf8')
    if(res) {
      ctx.body = util.success(res,'inchi查询成功')
    }
    else {
      ctx.body = util.fail('inchi查询失败')
    }
  } else {
    ctx.body = util.fail('inhi查询失败')
  }}
  catch{
    ctx.body = util.fail('inchi查询失败')
  }
};
module.exports = {
  mol2Inchi,
};
