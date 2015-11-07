const ZanzoApplication = require("./ZanzoApplication");

function removeAllChild(elem) {
  for (var i = elem.childNodes.length - 1; i >= 0; i--) {
    elem.removeChild(elem.childNodes[i]);
  }
}

function replaceElement(elem, child) {
  removeAllChild(elem);
  elem.appendChild(child);
}

module.exports = function() {
  window.addEventListener("dragover", (e) => {
    e.preventDefault();
  });

  window.addEventListener("drop", (e) => {
    e.preventDefault();

    let file = e.dataTransfer.files[0];

    if (file.type !== "image/gif") {
      return;
    }

    let reader = new FileReader();

    reader.onload = () => {
      let app = new ZanzoApplication();

      app.on("init", (canvas) => {
        replaceElement(document.getElementById("result"), canvas);
      });

      app.on("ended", (image) => {
        replaceElement(document.getElementById("result"), image);
      });

      app.generate(reader.result);
    };

    reader.readAsArrayBuffer(file);
  });
};
