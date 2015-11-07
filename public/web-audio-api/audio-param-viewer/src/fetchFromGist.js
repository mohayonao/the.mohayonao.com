const fetch = require("./utils/fetch");

module.exports = (gistId, callback) => {
  let url = "https://api.github.com/gists/" + gistId;

  return fetch(url).then((res) => {
    return res.json();
  }).then((data) => {
    let files = [];

    Object.keys(data.files).forEach((key) => {
      files.push(data.files[key]);
    })

    files = files.filter(items => items.language === "JavaScript").map(items => items.content);

    return files[0] || "";
  });
};
