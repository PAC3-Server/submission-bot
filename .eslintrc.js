module.exports = {
  env: {
    commonjs: true,
    es6: true,
    node: true
  },
  extends: ["eslint:recommended", "plugin:prettier/recommended"],
  globals: {
    NodeJS: true,
    BigInt: true
  },
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 6,
    sourceType: "module"
  },
  plugins: ["@typescript-eslint"],
  rules: {
    "prettier/prettier": "warn",
    "no-cond-assign": [2, "except-parens"],
    "no-unused-vars": 0,
    "@typescript-eslint/no-unused-vars": 1,
    "no-empty": [
      "error",
      {
        allowEmptyCatch: true
      }
    ],
    "prefer-const": [
      "warn",
      {
        destructuring: "all"
      }
    ],
    "spaced-comment": "warn"
  },
  overrides: [
    {
      files: ["slash-up.config.js"],
      env: {
        node: true
      }
    }
  ]
};
