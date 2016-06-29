const WebPageTest = require('./webpagetest');
const config = require('./config.js');
const API_KEY = config.API_KEY;


module.exports = new WebPageTest('www.webpagetest.org', API_KEY);
