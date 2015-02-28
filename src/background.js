chrome.app.runtime.onLaunched.addListener(function() {
  chrome.app.window.create('index.html', {
    'id': 'PolySonic',
    'frame': {
      'type': 'none'
    },
    'bounds': {
      'width': 605,
      'height': 761
    },
    'innerBounds': {
      'width': 605,
      'height': 761,
      'minWidth': 605,
      'minHeight': 761,
      'maxWidth': 605,
      'maxHeight': 761
    }
  });
});
