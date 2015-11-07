module.exports = (code, callback) => {
  try {
    esprima.parse(code);
    callback(null, code);
  } catch (e) {
    callback(e, "");
  }
};
