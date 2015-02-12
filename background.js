chrome.app.runtime.onLaunched.addListener(function() {
  chrome.app.window.create('index.html', {
    'id': 'PolySonic',
    'frame': {
      'type':'none'
    },
    'bounds': {
      'width': 605,
      'height': 861
    },
    'innerBounds': {
      'width': 605,
      'height': 861,
      'minWidth': 605,
      'minHeight': 861
    }
  });
});
