const fs = require("fs");
const axios = require("axios")
const util = require("../utils/util");
const { v4: uuidv4 } = require("uuid");
const mol2Inchi = async (ctx) => {
  const { molStr } = ctx.request.query;
  const uuid = uuidv4()
  fs.writeFileSync(
    "mol/" + uuid + ".mol",
    molStr,
    'utf8'
  );
  const switchRes = await axios.post('http://43.142.96.10:9001/dpb/execShellScript',{
    "shellScriptPath": "mol2stdinchi.sh",
    "inFilePathAndDocName": "/home/centos/mol/HC.mol"
  })
  
  ctx.body = { molStr };
};
module.exports = {
  mol2Inchi,
};
