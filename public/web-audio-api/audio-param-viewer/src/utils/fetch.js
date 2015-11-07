module.exports = (url) => {
  return new Promise((resolve, reject) => {
    let xhr = new XMLHttpRequest();
    let response = {
      text() {
        return xhr.response;
      },
      json() {
        return JSON.parse(xhr.response);
      }
    };

    xhr.open("GET", url);

    xhr.onload = () => {
      resolve(response);
    };
    xhr.onerror = reject;
    xhr.send();
  });
};
