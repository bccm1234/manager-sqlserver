const dealInputParams = (Input) => {
  let params, inputArr;
  if (!Input.match(/[^1-9]/)) {
    params = `id = ${Input}`
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
  for (let i in params) {
    str = `${str} formula ->> '$.${i}'='${params[i]}' and`;
  }
  return str.slice(0, str.length - 3);
};

const dealReactionParams = async function (params, database) {
  params = eval(params);
  if (params) {
    //获取f_id
    let f_id_arr = [];
    for (let i = 0; i < params.length; i++) {
      const formula = params[i].formula;
      const f_id_sql = `select f_id from formula where ${dealInputParams(
        formula
      )}`;
      const f_id = await database.query({ sql: f_id_sql });
      if (f_id.length > 0) {
        f_id_arr.push(f_id[0]);
      }
    }
    // 判断f_id是否为空
    if (f_id_arr.length > 0) {
      //根据f_id获取inchi组
      let inchi = [];
      for (let i = 0; i < f_id_arr.length; i++) {
        let f_id = f_id_arr[i].f_id;
        const sql = `select inchi_id from inchi where f_id = ${f_id}`;
        const inchi_arr = await database.query({ sql });
        inchi.push(inchi_arr);
      }
      //根据inchi获取g_id
      let ads0_Str = "";
      let ads1_Str = "";
      for (let i = 0; i < inchi.length; i++) {
        let ads0_str = "";
        let ads1_str = "";
        if (params[i]["ads"] === 0) {
          for (let n = 0; n < inchi[i].length; n++) {
            ads0_str = `${ads0_str} or json_contains_path(ads0,'all','$."${inchi[i][n].inchi_id}"')`;
          }
          ads0_str = `(${ads0_str})`.replace("or", "");
          ads0_Str = `${ads0_Str} and${ads0_str}`;
        } else if (params[i]["ads"] === 1) {
          for (let n = 0; n < inchi[i].length; n++) {
            ads1_str = `${ads1_str} or json_contains_path(ads1,'all','$."${inchi[i][n].inchi_id}"')`;
          }
          ads1_str = `(${ads1_str})`.replace("or", "");
          ads1_Str = `${ads1_Str} and${ads1_str}`;
        }
      }
      ads0_Str = ads0_Str.replace("and", "");
      ads1_Str = ads1_Str.replace("and", "");
      let group_Str = "";
      if (!ads0_Str) {
        group_Str = ads1_Str;
      } else if (!ads1_Str) {
        group_Str = ads0_Str;
      } else {
        group_Str = `${ads0_Str} and ${ads1_Str}`;
      }
      group_Str = `select g_id from r_group where ${group_Str}`;
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
const getMod = function(vector){
  //vector向量(数组形式)
  let mod = 0
  vector.map(item=>{
    mod += Math.pow(item,2)
  })
  mod = Math.sqrt(mod)
return mod
}
//计算两个向量的夹角
const getAngel = function(vector1,vector2){
  const mod1 = getMod(vector1)
  const mod2 = getMod(vector2)
  let pro = 0
  vector1.map((item,index)=>{
    pro = item*vector2[index]
  })
  const angel = Math.trunc(
    (Math.acos((pro)/(mod1*mod2)) *180) /Math.PI
  )
  return angel;
}
//计算晶胞常数
const getCellParam = function(matrix) {
  //matrix矩阵
  const [a,b,c] = matrix.map(item=>{
    return getMod(item)
  })
  const d = getAngel(matrix[1],matrix[2])
  const e = getAngel(matrix[0],matrix[2])
  const f = getAngel(matrix[0],matrix[1])
  return [a.toFixed(2),b.toFixed(2),c.toFixed(2),d,e,f]
}

//reactions
const joinGId = function (param, state) {
  let is_sql = "";
  if (param.length > 0) {
    for (let i = 0; i < param.length; i++) {
      is_sql = `${is_sql} or r.${state} = ${param[i]["g_id"]}`;
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
    const sql = `select ads0,ads1 from r_group where g_id = ${arr[a][name]}`;
    const res = await database.query({ sql });
    const ads0 = Object.keys(res[0]["ads0"]).toString();
    inchiArr.push(ads0);
  }
  inchiArr = Array.from(new Set(inchiArr));
  //获取mol文件
  for (let i = 0; i < inchiArr.length; i++) {
    let inchi = inchiArr[i].split(",");
    console.log(inchi, typeof inchi);
    let sql = "";
    for (let m = 0; m < inchi.length; m++) {
      sql = `${sql} or inchi_id = ${inchi[m]} `;
    }
    sql = sql.replace("or", "");
    const mol = await database.query({
      sql: `select mol from inchi where ${sql}`,
    });
    molArr.push(mol);
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
  getMol,
};
