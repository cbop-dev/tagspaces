var electron = require('electron');
var Application = require('spectron').Application;
var assert = require('assert');
var path = require('path');


describe('application launch', function() {
  this.timeout(10000);

  beforeEach(function() {
    this.app = new Application({
      path: getElectronPath(),
      args: [path.join(__dirname, '..')]
    });
    return this.app.start();
  });

  afterEach(function() {
    if (this.app && this.app.isRunning()) {
      return this.app.stop()
    }
  });


  it('shows an initial window', function() {
    return this.app.client.getWindowCount().then(function(count) {
      assert.equal(count, 1)
    });
  });

  function getElectronPath() {
    var electronPath = path.join(__dirname, '..', 'node_modules', '.bin', 'electron');
    if (process.platform === 'win32' || process.platform === 'win64')  electronPath += '.cmd';
    return electronPath;
  }
});