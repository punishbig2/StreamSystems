module.exports = {
  extends: ["eslint:recommended"],
  rules: {
    "no-empty": "off",
    "no-console": [
      "warn",
      {
        allow: ["error", "info", "warn"],
      },
    ],
    "no-param-reassign": "warn",
    "prefer-const": "warn",
    "sort-imports": "off", // we use the simple-import-sort plugin instead
    "spaced-comment": [
      "warn",
      "always",
      { line: { markers: ["/ <reference"] } },
    ],
    "no-restricted-globals": "off",
  },
  globals: {
    signalR: true,
  },
};
