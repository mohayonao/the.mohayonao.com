var fs = require("fs");
var path = require("path");
var http = require("http");

http.createServer(function(req, res) {
  var filepath = path.join(__dirname, "public", req.url);;

  if (!/\.\w+$/.test(filepath)) {
    filepath = path.join(filepath, "index.html");
  }

  fs.readFile(filepath, function(err, data) {
    if (!err) {
      return res.end(data);
    }
    res.writeHead(404);
    res.end("Not Found\n");
  });

}).listen(8000, "127.0.0.1", function() {
  console.log("Server running at http://127.0.0.1:8000/");
});
