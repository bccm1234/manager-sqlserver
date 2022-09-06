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
  str = `${str}) and  ele_num = ${length}`;
  return str;
};
const dealInputArrMethodTwo = function (arr) {
  let length = arr.length;
  let str = `json_contains_path(formula,'all'`;
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
  let ele_num = Object.keys(params).length;
  for (let i in params) {
    str = `${str} formula ->> '$.${i}'='${params[i]}' and`;
  }
  str = `${str} json_length(formula) = ${ele_num}`;
  return str;
};

const dealReactionParams = async function (params, database) {
  // 将string格式数据转array
  params = eval(params);
  if (params) {
    //获取inchi_id
    let inchi_arr = [];
    for (let i = 0; i < params.length; i++) {
      const formula = params[i].formula;
      const ads = params[i].ads;
      let for_info = dealInputParams(formula);
      let sql_info = `${for_info} and ads = ${ads}`;
      const sql = `select id from inchi where ${sql_info}`;
      const inchi = await database.query({ sql: sql });
      if (inchi) inchi_arr.push(inchi);
      else inchi_arr.push([]);
    }
    // 判断inchi_id是否为空
    if (inchi_arr.length > 0) {
      let group_Str = "";
      //根据inchi获取g_id
      for (let i = 0; i < inchi_arr.length; i++) {
        if (inchi_arr[i].length == 0) return "";
        else {
          let length = inchi_arr[i].length;
          let str = `json_contains_path(g_set,'one'`;
          for (let j = 0; j < length; j++) {
            str = `${str},'$."${inchi_arr[i][j].id}"'`;
          }
          str = `${str})`;
          group_Str = `${group_Str} ${str} and`;
        }
      }
      group_Str = group_Str.slice(0, group_Str.length - 3);
      group_Str = `select id from \`group\` where ${group_Str}`;
      const res = await database.query({ sql: group_Str });
      return res;
    } else {
      return "";
    }
  } else {
    return "";
  }
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

//reactions
const joinGId = function (param, state) {
  let is_sql = "";
  if (param.length > 0) {
    for (let i = 0; i < param.length; i++) {
      is_sql = `${is_sql} or r.${state} = ${param[i]["id"]}`;
    }
    is_sql = `(${is_sql})`.replace("or", "");
    return is_sql;
  } else {
    return "";
  }
};

const getMol = async function (arr, name, database) {
  let molArr = [];
  let inchiArr = [];
  for (let a = 0; a < arr.length; a++) {
    const sql = `select g_set from \`group\` where id = ${arr[a][name]}`;
    const res = await database.query({ sql });
    const inchi = Object.values(res[0])[0];
    inchiArr.push(inchi);
  }
  inchiArr = Array.from(new Set(inchiArr));
  //获取mol文件
  for (let i = 0; i < inchiArr.length; i++) {
    let inchi = inchiArr[i];
    let sql = "";
    for (let m in inchi) {
      sql = `id = ${m}`;
      const mol = await database.query({
        sql: `select mol from inchi where ${sql}`
      });
      molArr.push(mol[0]);
    }
  }
  return { molArr, inchiArr };
};

module.exports = {
  dealInputParams,
  //materials
  dealInputArrMethodOne,
  dealInputArrMethodTwo,
  dealInputArrMethodThree,
  getCellParam,
  //reactions
  dealReactionParams,
  joinGId,
  getMol
};
