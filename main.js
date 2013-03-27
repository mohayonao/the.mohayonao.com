var express = require("express");

var app = module.exports = express();

app.configure(function() {
    app.use(app.router);
    app.use(express.static(__dirname + "/public"));
});

app.configure("development", function() {
    app.use(express.errorHandler({dumpExceptions:true, showStack:true}));
});

app.configure("production", function() {
    app.use(express.errorHandler());
});

app.listen(process.env.PORT || 3000);
