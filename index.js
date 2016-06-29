const fs = require('fs');
const BlinkDiff = require('blink-diff');
const promises = require('./promises.js');
const wpt = require('./wpt.js');
const numberOfDaysInHistory = 7;

// Example: node index.js '6/29' '6/30'
const firstDate = process.argv[2];
const secondDate = process.argv[3];

/**
 * doImageDiff
 *
 * @param {Buffer} imageA
 * @param {Buffer} imageB
 * @return {Promise}
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
    imageOutputPath: 'results/test.png',
  });

  // do something with the diff results
  diff.run( (err, result) => {

    if (err) {
      return Promise.reject(err);
    }

    console.log(diff.hasPassed(result.code) ? 'Passed' : 'Failed');
    console.log('Found ' + result.differences + ' differences.');
    return Promise.resolve();
  });
};


/**
 * getScreenshots
 *
 * @param {String} idOne
 * @param {String} idTwo
 */
const getScreenshots = (idOne, idTwo) => {
  // async get both of the screenshots
  // @TODO these are just hardcoded for now, until we can get test ID's that will
  // definitely have PNG's associated with them
  var screenShots = Promise.all([promises.getScreenshot(idOne), promises.getScreenshot(idTwo)])

    // take the screenshots and save them locally once both screenshots come back
    .then((data) => {
      var imgOne = data[0].img;
      var imgTwo = data[1].img;

      // write both of the files
      return Promise.all([promises.writeFile(imgOne, 'one'), promises.writeFile(imgTwo, 'two')]);
    })
    .then(doImageDiff)
    .catch((e) => {
      console.log(e);
    });
};


/**
 * getTestByDate
 *
 * @param {String} firstDate
 * @param {String} secondDate
 */
const getTestByDate = (firstDate, secondDate) => {

  // first ARG here is number of days to go back into the search history, going to default to 7 days
  // @NB had to fork the webpagetest repo to add this filter param in for a URL
  wpt.getHistory(numberOfDaysInHistory, {filter: 'elitedaily.com'}, (err, data) => {
    if (err) {
      console.log(err, ': No data found from elitedaily.com');
    }

    // get all the tests that will have pngs to diff
    var filteredByLocation = data.filter((testData) => {
      return testData['Label'] === 'Article-ImageDiff-NoAds-Mobile';
    });

    // get date one
    var dateOne = filteredByLocation.filter((testData) => {
      return testData['Date/Time'].indexOf(firstDate) !== -1;
    });
    var idOne = dateOne[0]['Test ID'];

    // get date two
    var dateTwo = filteredByLocation.filter((testData) => {
      return testData['Date/Time'].indexOf(secondDate) !== -1;
    });
    var idTwo = dateTwo[0]['Test ID'];

    getScreenshots(idOne, idTwo);
  });
};

// kick off
getTestByDate(firstDate, secondDate);
