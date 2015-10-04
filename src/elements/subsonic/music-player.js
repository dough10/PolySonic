Polymer('music-player',{
  count: 0,
  bookmarkDeleted: false,
  ready: function () {
    this.page = 0;
    this.audio = new Audio();
  },
  applyAudioListeners: function (element) {
    element.onprogress = this.buffering.bind(this);
    element.onwaiting = this.playerProgress.bind(this);
    element.ontimeupdate = this.playerProgress.bind(this);
    element.onended = this.nextTrack.bind(this);
    element.onerror = this.audioError.bind(this);
    element.volume = this.app.volume / 100;
  },
  resize: function () {
    if (this.app){
      
      // repeat active 
      if (this.app.repeatPlaylist) {
        if (this.page === 0) {
          this.$.rButton.style.color = 'white';
        } else {
          this.$.rButton2.style.color = 'black';
        }
        
      // repeat off
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
    if (this.isCued && newVal !== oldVal + 1) {
      this.isCued = false;
    }
    this.async(function () {
      if (this.app.alreadyPlaying) {
        // ignore default functions when shuffleing
        this.app.alreadyPlaying = false;
      } else {
        this.$.cover2.style.backgroundImage = "url('" + this.app.playlist[newVal].cover + "')";
        this.$.coverArt.style.backgroundImage = "url('" + this.app.playlist[newVal].cover + "')";
        this.$.bg.style.backgroundImage = "url('" + this.app.playlist[newVal].cover + "')";
        this.app.setFabColor(this.app.playlist[newVal]);
        this.playAudio(this.app.playlist[newVal]);
      }
    });
  },
  playAudio: function (obj) {
    
    // set playing on mini player 
    var minis = document.querySelectorAll('mini-player');
    var length = minis.length;
    for (var i = 0; i < length; i++) {
      minis[i].setPlaying(obj);
    }
    
    // gapless playback if cached
    if (this.app.gapless && this.isCued) {
      this.audio = this.isCued;
      this.applyAudioListeners(this.audio);
      this.audio.play();
      this.isCued = false;
      this.app.currentPlaying = obj.artist + ' - ' + obj.title;
    } else {
      if (this.audio && !this.audio.paused) {
        this.audio.pause();
      }
      this.audio = new Audio();
      this.applyAudioListeners(this.audio);
      if (obj.artist === '') {
        this.app.currentPlaying = obj.title;
        this.note.title = obj.title;
        if (!this.isCued) {
          this.audio.src = this.app.buildUrl('stream', {
            format: 'raw',
            estimateContentLength: true,
            id: obj.id
          });
        }
        
      // default playback  * transcoded audio * 
      } else {
        this.app.currentPlaying = obj.artist + ' - ' + obj.title;
        this.note.title = obj.artist + ' - ' + obj.title;
        if (!this.isCued) {
          this.audio.src = this.app.buildUrl('stream', {
            maxBitRate: this.app.bitRate,
            id: obj.id
          });
        }
      }
      this.audio.play();
    }
    
    this.note.icon = obj.cover;
    
    // set playback position if bookmarked file
    if (obj.bookmarkPosition) {
      this.audio.currentTime = obj.bookmarkPosition / 1000;
    } else {
      this.audio.currentTime = 0;
    }
    
    this.note.show();
    this.$.cover2.style.backgroundImage = "url('" + obj.cover + "')";
    this.$.coverArt.style.backgroundImage = "url('" + obj.cover + "')";
    this.$.bg.style.backgroundImage = "url('" + obj.cover + "')";
    this.app.tracker.sendEvent('Playback Started', new Date());
    this.scrobbled = false;
  },
  getImageForPlayer: function (url, callback) {
    this.$.coverArt.style.backgroundImage = "url('" + url + "')";
    this.app.$.playNotify.icon = url;
    if (callback) {
      this.async(callback);
    }
  },
  playPause: function () {
    if (this.currentPlayer === 1) {
      if (!this.audio.paused) {
        this.audio.pause();
      } else {
        this.audio.play();
      }
    } else {
      if (!this.audio2.paused) {
        this.audio2.pause();
      } else {
        this.audio2.play();
      }  
    }
  },
  playNext: function (next) {
    if (this.app.repeatPlaylist && !this.app.playlist[next]) {
      this.app.playing = 0;
    } else if (this.app.playlist[next]) {
      this.app.playing = next;
    } else {
      this.audio.pause();
      this.app.clearPlaylist();
      var minis = document.querySelectorAll('mini-player');
      var length = minis.length;
      for (var i = 0; i < length; i++) {
        minis[i].page = 0;
      }
    }
  },
  nextTrack: function () {
    // if track longer then 20 min and autobookmark enabled 
    // will delete the bookmark 
    if (this.app.autoBookmark && this.audio.duration > 1200) {
      this.app.doXhr(this.app.buildUrl('deleteBookmark', {
        id: this.app.playlist[this.app.playing].id
      }), 'json', function (e) {
        if (e.target.response['subsonic-response'].status === 'failed') {
          console.error(e.target.response['subsonic-response'].error.message);
        }
      });
    }
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
    if (audio.duration && audio.buffered.end(0)) {
      this.buffer = Math.floor((audio.buffered.end(0) / audio.duration) * 100);
    } else {
      this.buffer = 0;
    }
    audio = null;
  },
  playerProgress: function (e) {
    var audio = e.srcElement;
    // gapless?
    if (this.app.gapless && audio.currentTime >= audio.duration - 60 
    && !this.isCued && this.app.playlist[this.app.playing + 1]) {
      this.isCued = new Audio(this.app.buildUrl('stream', {
        maxBitRate: this.app.bitRate,
        id: this.app.playlist[this.app.playing + 1].id
      }));
    }
    
    // if waiting for playback to start
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
    
    // scrobble lastFM if over half of song has been played played & it is not a podcast
    if (this.app.activeUser.scrobblingEnabled 
    && Math.abs(audio.currentTime / audio.duration * 100) > 50
    && !this.scrobbled
    && this.app.playlist[this.app.playing].artist !== '') {
      this.scrobbled = true;
      this.app.doXhr(this.app.buildUrl('scrobble', {
        id: this.app.playlist[this.app.playing].id, 
        time: new Date().getTime()
      }), 'json', function (e) {
        if (e.target.response['subsonic-response'].status === 'failed') {
          console.log('Last FM submission: ' + e.target.response['subsonic-response'].status);
          this.app.tracker.sendEvent('Last FM submission', 'Failed');
        }
      }.bind(this));
    }


    // if file longer then 20 min and autobookmark enabled 
    // creates a bookmark about every 1 min.
    if (this.app.autoBookmark && audio.duration > 1200
      && audio.currentTime > 60 && !this.app.waitingToPlay
      && Math.floor(audio.currentTime / audio.duration * 100) < 98) {
      this.count = this.count + 1;
      if (this.count >= 250) {
        this.count = 0;
        this.app.doXhr(this.app.buildUrl('createBookmark', {
          id: this.app.playlist[this.app.playing].id,
          position: Math.floor(audio.currentTime * 1000),
          comment: this.app.playlist[this.app.playing].title + ' at ' + this.app.secondsToMins(audio.currentTime)
        }), 'json', function (e) {
          if (e.target.response['subsonic-response'].status === 'failed') {
            console.error(e.target.response['subsonic-response'].error.message);
          }
        });
      }
    }

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
    var width, x;
    if (this.page === 1 && !this.app.narrow) {
      width = 500;
      x = event.x - ((window.innerWidth - width) / 2) - 128;
    } else if (this.page === 0) {
      width = window.innerWidth;
      x = event.x;
    } else {
      width = 500;
      x = event.x - (window.innerWidth - width) / 2;
    }
    var duration = this.audio.duration;
    var clicked = (x / width);
    this.progress = clicked * 100;
    this.audio.currentTime = duration - (duration - (duration * clicked));
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
  },
  createBookmark: function () {
    var artist = this.app.playlist[this.app.playing].artist;
    var track = this.app.playlist[this.app.playing].title;
    this.app.$.playlistDialog.close();
    this.app.$.bookmarkDialog.open();
    this.app.bookmarkComment = this.app.playlist[this.app.playing].title + ' at ' + this.app.secondsToMins(this.audio.currentTime);
  },
  submitBookmark: function () {
    this.app.submittingBookmark = true;
    var pos = Math.floor(this.audio.currentTime * 1000);
    this.app.doXhr(
      this.app.buildUrl('createBookmark', {
        id: this.app.playlist[this.app.playing].id,
        position: pos,
        comment: this.app.bookmarkComment
      }), 'json', function (e) {
      this.app.submittingBookmark = false;
      if (e.target.response['subsonic-response'].status === 'ok') {
        this.app.doToast(this.app.markCreated);
        this.app.$.bookmarkDialog.close();
      } else {
        this.app.doToast(e.target.response['subsonic-response'].error.message);
      }
    }.bind(this));
  },
  shufflePlaylist: function () {
    this.app.shufflePlaylist();
  }
});
