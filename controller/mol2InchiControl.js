const fs = require("fs");
const util = require("../utils/util");
const { v4: uuidv4 } = require("uuid");
const mol2Inchi = async (ctx) => {
  const { molStr } = ctx.request.query;
  const uuid = uuidv4()
  fs.writeFile(
    "C:/Users/Liud/Desktop/projects/server/mol/" + uuid + ".mol",
    molStr,
    function (err, res) {
      if (err) {
        console.log(err);
      } else {
        console.log("写入成功");
      }
    }
  );
  ctx.body = { molStr };
};
module.exports = {
  mol2Inchi,
};
