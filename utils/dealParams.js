const dealInputArrMethodOne = function (arr) {
  let length = arr.length;
  arr = arr.filter((x) => {
    if (x != "*") return x;
  });
  let newlength = arr.length;
  let str = `json_contains_path(f_json,'all'`;
  for (let i = 0; i < newlength; i++) {
    str = `${str},'$.${arr[i]}'`;
  }
  str = `${str}) and  ele_num = ${length}`;
  return str;
};
const dealInputArrMethodTwo = function (arr) {
  let length = arr.length;
  let str = `json_contains_path(f_json,'all'`;
  for (let i = 0; i < length; i++) {
    str = `${str},'$.${arr[i]}'`;
  }
  str = `${str}) and  ele_num >= ${length}`;
  return str;
};
const dealInputArrMethodThree = function (input) {
  let length = input.length;
  let params = new Object();
  let str = "";
  let elelist = [];
  let startindex = "";
  let endindex = "";
  for (let i = 0; i < length; i++) {
    if (input[i].match(/[A-Z*]/)) {
      startindex = endindex;
      endindex = i;
      if (parseFloat(startindex).toString() !== "NaN") {
        // 捕捉436Cu2Zn3中的Cu2
        elelist.push(input.slice(startindex, endindex));
      }
    }
  }
  // 捕捉436Cu2Zn3中的Zn3
  elelist.push(input.slice(endindex, input.length));
  for (let i = 0; i < elelist.length; i++) {
    let key = elelist[i].match(/[A-Za-z]+/);
    let value = Number(elelist[i].match(/[0-9]+/));
    if (!value) value = 1;
    if (params[key]) {
      params[key] += value;
    } else {
      params[key] = value;
    }
  }
  for (let i in params) {
    str = `${str} f_json ->> '$.${i}'='${params[i]}' and`;
  }
  return str.slice(0, str.length - 3);
};

module.exports = {
  dealInputArrMethodOne,
  dealInputArrMethodTwo,
  dealInputArrMethodThree
};
