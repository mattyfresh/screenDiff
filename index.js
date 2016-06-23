const fs = require('fs');
const rp = require('request-promise');
const BlinkDiff = require('blink-diff');
const WebPageTest = require('./webpagetest');
const config = require('./config.js');
const API_KEY = config.API_KEY;

// first arg will only change if you have your own private instance as far as I can tell
const wpt = new WebPageTest('www.webpagetest.org', API_KEY);

/**
 * do the image diffing
 */
const doImageDiff = (imageA, imageB) => {

  // build out the options for blink-diff
  const diff = new BlinkDiff({
    imageAPath:      './images/test-one.png', // Use file-path
    imageBPath:      './images/test-two.png',
    thresholdType:   BlinkDiff.THRESHOLD_PERCENT,
    threshold:       0.01, // 1% threshold, may need to change this later but, I would think a low level of leniency makes more sense
    outputMaskRed:   0, // outputMask(s) change the color of the diff
    outputMaskBlue:  255,
    imageOutputPath: 'results/test-foo.png',
  });

  // do something with the diff results
  diff.run( (err, result) => {
    if (err) {
      console.log(err + 'THIS IS WHERE THE ERRRR IS');
    }

    console.log(diff.hasPassed(result.code) ? 'Passed' : 'Failed');
    console.log('Found ' + result.differences + ' differences.');
  });
};


wpt.getHistory(3, {filter: 'elitedaily.com'}, (err, data) => {
  if (err) throw err;

  // get all the tests with a certain location/label
  var filteredByLocation = data.filter((testData) => {
    return testData['Location'] === 'Virginia USA - EC2  - Chrome - Cable' && testData['Label'] === 'HomePage-Virginia';
  });

  // get date one
  var dateOne = filteredByLocation.filter((testData) => {
    return testData['Date/Time'].indexOf('6/23') !== -1;
  });
  var idOne = dateOne[0]['Test ID'];

  // get date two
  var dateTwo = filteredByLocation.filter((testData) => {
    return testData['Date/Time'].indexOf('6/23') !== -1;
  });
  var idTwo = dateTwo[0]['Test ID'];

  // async get both of the screenshots
  var screenShots = Promise.all([getScreenshotPromise('160622_BB_2NGT'), getScreenshotPromise('160622_BB_2NGT')])

    // take the screenshots and save them locally once both screenshots come back
    .then((data) => {
      var imgOne = data[0].img;
      var imgTwo = data[1].img;

      // write both of the files
      Promise.all([writeFilePromise(imgOne, 'one'), writeFilePromise(imgTwo, 'two')]);
    })
    .then(doImageDiff)
    .catch((e) => {
      console.log(e);
    });
});


// promise version
function getScreenshotPromise(testId) {
  return new Promise((resolve, reject) => {
    wpt.getScreenshotImage(testId, {fullResolution: true}, (err, img, info) => {

      // reject the promise with the error
      if (err) {
        return reject(err);
      }

      // otherwise return the screenshot
      resolve({img: img, info: info});
    });
  });
}


function writeFilePromise(img, label) {
  return new Promise((resolve, reject) => {
    fs.writeFile('./images/test-' + label + '.png', img, 'binary', (err) => {
      if (err)
        return reject(err);
      else {

        // file was written to fs
        resolve('done!')
      }
    });
  });
}
