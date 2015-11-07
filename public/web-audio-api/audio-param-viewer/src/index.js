var main = require("./main");

window.AudioContext = window.AudioContext || window.webkitAudioContext;
window.OfflineAudioContext = window.OfflineAudioContext || window.webkitOfflineAudioContext;

window.addEventListener("DOMContentLoaded", main);
