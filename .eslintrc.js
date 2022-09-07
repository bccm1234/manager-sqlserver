// module.exports = {
//     "env": {
//         "browser": true,
//         "commonjs": true,
//         "es2021": true
//     },
//     "extends": [
//         "prettier",
//         "eslint:recommended",
//         "plugin:vue/essential"
//     ],
//     "parserOptions": {
//         "ecmaVersion": "latest"
//     },
//     "plugins": [
//         "vue"
//     ],
//     "rules": {
//     }
// }
module.exports = {
  env: {
    browser: true,
    commonjs: true,
    es2021: true,
  },
  extends: ["google", "plugin:prettier/recommended", "eslint-config-prettier"],
  parserOptions: {
    ecmaVersion: "latest",
  },
  rules: { newIsCap: false },
};
