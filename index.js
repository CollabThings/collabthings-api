exports.printMsg = function () {
  console.log("This is a message from the demo package");
}

exports.getApp = function () {
  return initApp();
}

var api = require('./modules/api.js').init();
var app;

function initApp() {
  app = new App();
  return app;
}

function App() {
  this.getApi = function () {
    return api;
  }

  this.stop = function () {
    api.stop();
  }
}
