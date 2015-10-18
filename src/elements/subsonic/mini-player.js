Polymer('mini-player', {
  ready: function () {
    'use strict';
    this.timer = 0;
    this.label = chrome.i18n.getMessage('nowPlayingTitle');
  },
  domReady: function () {
    'use strict';
    this.app = document.getElementById('tmpl');
  },
  setPlaying: function (obj) {
    'use strict';
    this.img = obj.cover;
    this.artist = obj.artist;
    this.track = obj.title;
  },
  waitingToPlayChanged: function () {
    'use strict';
    if (!this.waitingToPlay) {
      this.$.spinner.hidden = true;
    } else {
      this.$.spinner.hidden = false;
    }
  },
  isNowPlayingChanged: function (newVal, oldVal) {
    'use strict';
    if (newVal) {
      this.page = 1;
    } else {
      if (this.app && !this.app.playlist[0]) {
        this.page = 0;
      }
    }
    if (this.app) {
      if (this.app.$.player.audio.paused) {
        this.$.playButton.icon = 'av:play-arrow';
      } else  {
        this.$.playButton.icon = 'av:pause';
      }
    }
  },
  toPlayer: function () {
    'use strict';
    this.app.nowPlaying();
  },
  playPause: function () {
    'use strict';
    if (!this.app.$.player.audio.paused) {
      this.$.playButton.icon = 'av:play-arrow';
    } else {
      this.$.playButton.icon = 'av:pause';
    }
    this.app.$.player.playPause();
  },
  openPlaylist: function () {
    'use strict';
    this.app.showPlaylist('bottom');
  },
  progressClick: function (event, detail) {
    'use strict';
    this.async(function () {
      var audio = this.app.$.player.audio;
      var slide = this.progress / 100;
      audio.currentTime = audio.duration - (audio.duration - (audio.duration * slide));
    });
  }
});
