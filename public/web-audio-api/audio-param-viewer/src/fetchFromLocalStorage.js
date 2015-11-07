const localStorageUtils = require("./localStorageUtils");

module.exports = (url) => {
  return Promise.resolve(localStorageUtils.getItem(url));
};
