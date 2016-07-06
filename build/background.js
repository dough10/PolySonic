chrome.app.runtime.onLaunched.addListener(function() {
  chrome.app.window.create('index.html', {
    'id': 'PolySonic',
    'frame': {
      'type': 'chrome',
      'color': '#4D4C4C'
    },
    'bounds': {
      'width': 400,
      'height': 621
    },
    'innerBounds': {
      'width': 400,
      'height': 621,
      'minWidth': 400,
      'minHeight': 621
    }
  });
});
