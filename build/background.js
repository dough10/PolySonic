chrome.app.runtime.onLaunched.addListener(function() {
  chrome.app.window.create('index.html', {
    'id': 'PolySonic',
    'frame': {
      'type': 'none'
    },
    'bounds': {
      'width': 535,
      'height': 761
    },
    'innerBounds': {
      'width': 535,
      'height': 761,
      'minWidth': 535,
      'minHeight': 761,
      'maxWidth': 535,
      'maxHeight': 761
    }
  });
});
