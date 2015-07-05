Polymer('mini-player', {
  ready: function () {
    'use strict';
    this.timer = 0;
  },
  domReady: function () {
    'use strict';
    this.app = document.getElementById('tmpl');
    this.label = chrome.i18n.getMessage('nowPlayingTitle');
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
      clearTimeout(this.timer);
      this.timer = 0;
    } else {
      if (this.app) {
        if (!this.app.playlist[0]) {
          this.page = 0;
        } else {
          this.timer = setTimeout(function () {
            this.page = 0;
          }.bind(this), 120000);
        }
      }
    }
    if (this.app) {
      if (this.app.$.audio.paused) {
        this.$.playButton.icon = 'av:play-arrow';
      } else {
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
    if (!this.app.$.audio.paused) {
      this.$.playButton.icon = 'av:play-arrow';
    } else {
      this.$.playButton.icon = 'av:pause';
    }
    this.app.playPause();
  },
  openPlaylist: function () {
    'use strict';
    this.app.showPlaylist('bottom');
  },
  progressClick: function (event, detail) {
    'use strict';
    var audio = this.app.$.audio;
    var slide = this.progress / 100;
    audio.currentTime = audio.duration - (audio.duration - (audio.duration * slide));
  }
});
