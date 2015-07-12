Polymer('music-player',{
  ready: function () {
    this.page = 0;
    this.audio = this.$.audio;
    this.audio.onwaiting = this.playerProgress.bind(this);
    this.audio.onprogress = this.buffering.bind(this);
    this.audio.ontimeupdate = this.playerProgress.bind(this);
    this.audio.onended = this.nextTrack.bind(this);
    this.audio.onerror = this.audioError.bind(this);
  },
  resize: function () {
    if (this.app){
      if (this.app.repeatPlaylist) {
        if (this.page === 0) {
          this.$.rButton.style.color = 'white';
        } else {
          this.$.rButton2.style.color = 'black';
        }
      } else {
        this.$.rButton.style.color = 'rgb(158, 158, 158)';
        this.$.rButton2.style.color = 'rgb(158, 158, 158)';
      }
    }
    this.$.wrap.style.height = Math.floor(window.innerHeight - 128) + 'px';
  },
  domReady: function () {
    this.app = document.getElementById('tmpl');
    this.note = this.app.$.playNotify;
  },
  playingChanged: function (oldVal, newVal) {
    this.async(function () {
      this.$.cover2.style.backgroundImage = "url('" + this.app.playlist[newVal].cover + "')";
      this.$.coverArt.style.backgroundImage = "url('" + this.app.playlist[newVal].cover + "')";
      this.$.bg.style.backgroundImage = "url('" + this.app.playlist[newVal].cover + "')";
      this.playAudio(this.app.playlist[newVal]);
    });
  },
  playAudio: function (obj) {
    var minis = document.querySelectorAll('mini-player');
    var length = minis.length;
    for (var i = 0; i < length; i++) {
      minis[i].setPlaying({artist: obj.artist, title: obj.title, cover: obj.cover});
    }
    if (obj.artist === '') {
      this.app.currentPlaying = obj.title;
      this.note.title = obj.title;
      this.audio.src = this.app.buildUrl('stream', {format: 'raw', estimateContentLength: true, id: obj.id});
    } else {
      this.app.currentPlaying = obj.artist + ' - ' + obj.title;
      this.note.title = obj.artist + ' - ' + obj.title;
      this.audio.src = this.app.buildUrl('stream', {maxBitRate: this.app.bitRate, id: obj.id});
    }
    this.note.icon = obj.cover;
    this.audio.play();
    this.note.show();
    this.$.cover2.style.backgroundImage = "url('" + obj.cover + "')";
    this.$.coverArt.style.backgroundImage = "url('" + obj.cover + "')";
    this.app.tracker.sendEvent('Audio', 'Started');
    if (this.app.activeUser.scrobblingEnabled) {
      this.app.doXhr(this.app.buildUrl('scrobble', {id: obj.id, time: new Date().getTime()}), 'json', function (e) {
        if (e.target.response['subsonic-response'].status === 'failed') {
          console.log('Last FM submission: ' + e.target.response['subsonic-response'].status);
          this.app.tracker.sendEvent('Last FM submission', 'Failed');
        }
      }.bind(this));
    }
  },
  getImageForPlayer: function (url, callback) {
    this.$.coverArt.style.backgroundImage = "url('" + url + "')";
    this.app.$.playNotify.icon = url;
    if (callback) {
      this.async(callback);
    }
  },
  playPause: function () {
    if (!this.audio.paused) {
      this.audio.pause();
    } else {
      this.audio.play();
    }
  },
  playNext: function (next) {
    if (this.app.repeatPlaylist && !this.app.playlist[next]) {
      this.app.playing = 0;
    } else if (this.app.playlist[next]) {
      this.app.playing = next;
    } else {
      this.$.audio.pause();
      this.app.clearPlaylist();
      var minis = document.querySelectorAll('mini-player');
      var length = minis.length;
      for (var i = 0; i < length; i++) {
        minis[i].page = 0;
      }
    }
  },
  nextTrack: function () {
    this.playNext(this.app.playing + 1);
  },
  lastTrack: function () {
    this.playNext(this.app.playing - 1);
  },
  audioError: function (e) {
    this.app.page = 0;
    console.error('audio playback error ', e);
    this.app.doToast('Audio Playback Error');
    this.app.tracker.sendEvent('Audio Playback Error', e.target);
  },
  buffering: function (e) {
    var audio = e.srcElement;
    if (audio.duration) {
      this.buffer = Math.floor((audio.buffered.end(0) / audio.duration) * 100);
    } else {
      this.buffer = 0;
    }
    audio = null;
  },
  playerProgress: function (e) {
    var audio = e.srcElement;
    if (e) {
      if (e.type === 'waiting') {
        this.app.waitingToPlay = true;   // spinner on album art shown
      } else if (e.type === 'timeupdate') {
        this.app.waitingToPlay = false;   // spinner on album art hidden
      }
    }
    this.currentMins = Math.floor(audio.currentTime / 60);
    this.currentSecs = Math.floor(audio.currentTime - (this.currentMins * 60));
    this.totalMins = Math.floor(audio.duration / 60);
    this.totalSecs = Math.floor(audio.duration - (this.totalMins * 60));

    if (!audio.paused) {
      this.$.avIcon.icon = "av:pause";
      if (!audio.duration) {
        this.playTime = this.currentMins + ':' + ('0' + this.currentSecs).slice(-2) + ' / ?:??';
        this.progress = 0;
      } else {
        this.playTime = this.currentMins + ':' + ('0' + this.currentSecs).slice(-2) + ' / ' + this.totalMins + ':' + ('0' + this.totalSecs).slice(-2);
        this.progress = Math.floor(audio.currentTime / audio.duration * 100);
      }
    } else {
      this.$.avIcon.icon = "av:play-arrow";
    }
    if (!audio.paused) {
      this.app.isNowPlaying = true;
    } else {
      this.app.isNowPlaying = false;
    }
    audio = null;
    e = null;
  },
  toggleVolume: function () {
    this.app.toggleVolume();
  },
  progressClick: function (event) {
    var width, x, clicked;
    if (this.page === 0) {
      width = window.innerWidth;
      x = event.x;
    } else {
      width = 500;
      x = event.x - (window.innerWidth - width) / 2;
    }
    var duration = this.$.audio.duration;
    var clicked = (x / width);
    this.progress = clicked * 100;
    this.$.audio.currentTime = duration - (duration - (duration * clicked));
  },
  toggleRepeat: function () {
    if (this.app.repeatPlaylist) {
      this.app.repeatPlaylist = false;
      this.app.repeatState = chrome.i18n.getMessage('disabled');
      this.app.repeatText = chrome.i18n.getMessage('playlistRepeatOff');
      this.$.rButton.style.color = 'rgb(158, 158, 158)';
      this.$.rButton2.style.color = 'rgb(158, 158, 158)';
      this.app.$.repeatButton.style.color = '#db4437';
    } else {
      this.app.repeatState = chrome.i18n.getMessage('enabled');
      if (this.page === 0) {
        this.$.rButton.style.color = 'white';
      } else {
        this.$.rButton2.style.color = 'black';
      }
      this.app.$.repeatButton.style.color = '#57BA67';
      this.app.repeatPlaylist = true;
      this.app.repeatText = chrome.i18n.getMessage('playlistRepeatOn');
    }
  },
  smallChanged: function (oldVal, newVal) {
    this.async(function () {
      if (newVal) {
        this.page = 0;
      } else {
        this.page = 1;
      }
    });
  }
});
