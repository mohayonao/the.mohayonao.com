const fetch = require("./utils/fetch");

module.exports = (url) => {
  return fetch(`./presets/${url}.js`).then((res) => {
    return res.text();
  });
};
