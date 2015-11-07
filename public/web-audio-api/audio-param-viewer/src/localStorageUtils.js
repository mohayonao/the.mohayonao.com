const PREFIX = "/web-audio-api/audio-param-viewer/";

const getItem = (key) => {
  return localStorage.getItem(PREFIX + key) || "";
};

const setItem = (key, value) => {
  localStorage.setItem(PREFIX + key, value);
};

module.exports = { setItem, getItem };
