chrome.app.runtime.onLaunched.addListener(function() {
  chrome.app.window.create('index.html', {
    'id': 'PolySonic',
    'frame': {
      'type': 'chrome',
      'color': '#4D4C4C'
    },
    'bounds': {
      'width': 535,
      'height': 761
    },
    'outerBounds': {
      'width': 535,
      'height': 761,
      'minWidth': 535,
      'minHeight': 761
    }
  }, function (created) {
    created.contentWindow.onload = function (e) {
      console.log(e);
    };
  });
});
