const dealInputParams = (Input) => {
  let params, inputArr;
  if (!Input.match(/[^1-9]/)) {
    params = `id = ${Input}`;
  } else if (Input.includes("-")) {
    //Cu-O,Cu-O-*
    inputArr = Input.split("-");
    inputArr = inputArr.filter((x) => {
      if (x) return x;
    });
    params = dealInputArrMethodOne(inputArr);
  } else if (Input.includes(",")) {
    //Cu,O
    inputArr = Input.split(",");
    inputArr = inputArr.filter((x) => {
      if (x) return x;
    });
    params = dealInputArrMethodTwo(inputArr);
  } else {
    // formula查询
    params = dealInputArrMethodThree(Input);
  }
  return params;
};
const dealInputArrMethodOne = function (arr) {
  let length = arr.length;
  arr = arr.filter((x) => {
    if (x != "*") return x;
  });
  let newlength = arr.length;
  let str = `json_contains_path(formula,'all'`;
  for (let i = 0; i < newlength; i++) {
    str = `${str},'$.${arr[i]}'`;
  }
  str = `${str}) and  json_length(formula) = ${length}`;
  return str;
};
const dealInputArrMethodTwo = function (arr) {
  let length = arr.length;
  let str = `json_contains_path(formula,'all'`;
  for (let i = 0; i < length; i++) {
    str = `${str},'$.${arr[i]}'`;
  }
  str = `${str}) and  json_length(formula) >= ${length}`;
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
  let ele_num = Object.keys(params).length;
  for (let i in params) {
    str = `${str} formula ->> '$.${i}'='${params[i]}' and`;
  }
  str = `${str} json_length(formula) = ${ele_num}`;
  return str;
};

//materials
//通过矩阵计算晶胞a、b、c、α、β、γ
//计算向量的模
const getMod = function (vector) {
  //vector向量(数组形式)
  let mod = 0;
  vector.map((item) => {
    mod += Math.pow(item, 2);
  });
  mod = Math.sqrt(mod);
  return mod;
};
//计算两个向量的夹角
const getAngel = function (vector1, vector2) {
  const mod1 = getMod(vector1);
  const mod2 = getMod(vector2);
  let pro = 0;
  vector1.map((item, index) => {
    pro = item * vector2[index];
  });
  const angel = Math.trunc((Math.acos(pro / (mod1 * mod2)) * 180) / Math.PI);
  return angel;
};
//计算晶胞常数
const getCellParam = function (matrix) {
  //matrix矩阵
  const [a, b, c] = matrix.map((item) => {
    return getMod(item);
  });
  const d = getAngel(matrix[1], matrix[2]);
  const e = getAngel(matrix[0], matrix[2]);
  const f = getAngel(matrix[0], matrix[1]);
  return [a.toFixed(2), b.toFixed(2), c.toFixed(2), d, e, f];
};

module.exports = {
  dealInputParams,
  //materials
  dealInputArrMethodOne,
  dealInputArrMethodTwo,
  dealInputArrMethodThree,
  getCellParam,
};
