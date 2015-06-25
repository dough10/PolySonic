Polymer('mini-player', {
  ready: function () {
    this.timer = 0;
  },
  domReady: function () {
    this.app = document.getElementById('tmpl');
    this.label = chrome.i18n.getMessage('nowPlayingTitle');
    document.addEventListener('track-changed', function () {
      this.img = this.app.playlist[this.app.playing].cover;
      this.artist = this.app.playlist[this.app.playing].artist;
      this.track = this.app.playlist[this.app.playing].title;
    }.bind(this));
  },
  waitingToPlayChanged: function () {
    if (!this.waitingToPlay) {
      this.$.spinner.hidden = true;
    } else {
      this.$.spinner.hidden = false;
    }
  },
  isNowPlayingChanged: function (newVal, oldVal) {
    if (newVal) {
      this.page = 1;
      clearTimeout(this.timer);
      this.timer = 0;
      if (this.app.$.audio.paused) {
        this.$.playButton.icon = 'av:play-arrow';
      } else {
        this.$.playButton.icon = 'av:pause';
      }
    } else {
      if (this.app) {
        if (!this.app.playlist[0]) {
          this.page = 0;
        } else {
          this.timer = setTimeout(function () {
            this.page = 0;
          }.bind(this), 60000);
        }
      }
    }
  },
  toPlayer: function () {
    this.app.nowPlaying();
  },
  playPause: function () {
    if (!this.app.$.audio.paused) {
      this.$.playButton.icon = 'av:play-arrow';
    } else {
      this.$.playButton.icon = 'av:pause';
    }
    this.app.playPause();
  },
  openPlaylist: function () {
    this.app.showPlaylist();
  },
  progressClick: function (event, detail) {
    var audio = this.app.$.audio;
    var clicked = (event.x / window.innerWidth);
    this.app.$.progress.value = clicked * 100;
    this.app.$.audio.currentTime = audio.duration - (audio.duration - (audio.duration * clicked));
  }
});
