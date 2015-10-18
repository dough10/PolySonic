chrome.app.runtime.onLaunched.addListener(function() {
  chrome.app.window.create('index.html', {
    'id': 'PolySonic',
    'frame': {
      'type': 'chrome',
      'color': '#4D4C4C'
    },
    'bounds': {
      'width': 535,
      'height': 721
    },
    'innerBounds': {
      'width': 535,
      'height': 721,
      'minWidth': 535,
      'minHeight': 721
    }
  });
});
