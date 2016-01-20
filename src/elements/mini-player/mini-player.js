(function () {
  var app = document.getElementById('tmpl');
  Polymer('mini-player', {
    time: 0,


    setPlaying: function (obj) {
      this._img = obj.cover;
      this._artist = obj.artist;
      this._track = obj.title;
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
      } else {
        if (app && !app.playlist[0]) {
          this.page = 0;
        }
      }
      if (app && '$' in app) {
        if (app.$.player.audio.paused) {
          this.$.playButton.icon = 'av:play-arrow';
        } else  {
          this.$.playButton.icon = 'av:pause';
        }
      }
    },


    _toPlayer: function () {
      app.nowPlaying();
    },


    _playPause: function () {
      if (!app.$.player.audio.paused) {
        this.$.playButton.icon = 'av:play-arrow';
      } else {
        this.$.playButton.icon = 'av:pause';
      }
      app.$.player.playPause();
    },


    _openPlaylist: function () {
      app.showPlaylist('bottom');
    },


    _progressClick: function (event, detail) {
      this.async(function () {
        var audio = app.$.player.audio;
        var slide = this.progress / 100;
        audio.currentTime = audio.duration - (audio.duration - (audio.duration * slide));
      });
    }
  });
})();
