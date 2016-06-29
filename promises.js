var promises = {};
const wpt = require('./wpt.js');
const fs = require('fs');


/**
 * getScreenshot
 *
 * @param {String} testId
 * @return {Promise}
 */
promises.getScreenshot = (testId) => {
  return new Promise((resolve, reject) => {
    wpt.getScreenshotImage(testId, {fullResolution: true}, (err, img, info) => {

      // reject the promise with the error
      if (err) {
        return reject(err);
      }

      // otherwise return the screenshot
      return resolve({img: img, info: info});
    });
  });
}


/**
 * writeFile
 *
 * @param {Buffer} img
 * @param {String} label
 * @return {Promise}
 */
promises.writeFile = (img, label) => {
  return new Promise((resolve, reject) => {
    fs.writeFile('./images/test-' + label + '.png', img, 'binary', (err) => {
      if (err)
        return reject(err);
      else {

        // file was written to fs
        return resolve('done!')
      }
    });
  });
}


module.exports = promises;
