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
function sendMessage() {
  chrome.runtime.sendMessage({command: "play"}, function(response) {
    console.log(response.farewell);
  });
}
chrome.commands.onCommand.addListener(function (command) {
  if (command === "playPauseMediaKey") {
    //
  } else if (command === "nextTrackMediaKey") {
    //
  } else if (command === "lastTrackMediaKey") {
    //
  } else if (command === "MediaPlayPause") {
    //
  } else if (commane === "testKey") {
    sendMessage();
  }
});

