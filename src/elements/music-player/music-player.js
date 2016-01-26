Polymer('music-player',{
  count: 0,
  bookmarkDeleted: false,

  /**
   * element is ready
   */
  ready: function () {
    this.page = 0;
  },

  /**
   * apply all needed callbacks and values to the audio element
   * @param {Object} element - the audio element to add callbacks / values
   */
  applyAudioListeners: function (element) {
    element.onprogress = this.buffering.bind(this);
    element.onwaiting = this.playerProgress.bind(this);
    element.ontimeupdate = this.playerProgress.bind(this);
    element.onended = this.nextTrack.bind(this);
    element.onerror = this.audioError.bind(this);
    element.volume = this.app.volume / 100;
  },

  removeListeners: function (element) {
    element.onprogress = null;
    element.onwaiting = null;
    element.ontimeupdate = null;
    element.onended = null;
    element.onerror = null;
  },

  /**
   * app resize callback
   * position and style things
   */
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

  /**
   * dom ready to use
   */
  domReady: function () {
    this.app = document.getElementById('tmpl');
    this.note = this.$.playNotify;
  },

  /**
   * index of playlist item being played has changed
   * @param {Object} oldVal - value changing form
   * @param {Object} newVal - then new value after change
   */
  playingChanged: function (oldVal, newVal) {
    if (this.isCued && newVal !== oldVal + 1) {
      delete this.isCued;
    }
    if (this.app.alreadyPlaying) {
      // ignore default functions when shuffleing
      this.app.alreadyPlaying = false;
    } else {
      this.$.cover2.style.backgroundImage = "url('" + this.app.playlist[newVal].cover + "')";
      this.$.coverArt.style.backgroundImage = "url('" + this.app.playlist[newVal].cover + "')";
      this.$.bg.style.backgroundImage = "url('" + this.app.playlist[newVal].cover + "')";
      this.playAudio(this.app.playlist[newVal]);
    }
  },

  /**
   * the main play function
   * @param {Object} obj - the playlist object to playback
   */
  playAudio: function (obj) {

    // clean up old players
    if (this.audio && !this.audio.paused) {
      this.audio.pause();
      this.removeListeners(this.audio);
      delete this.audio;
    }

    // gapless playback if cached
    if (this.app.gapless && this.isCued) {
      this.audio = this.isCued;
      this.app.currentPlaying = obj.artist + ' - ' + obj.title;
      this.note.title = obj.artist + ' - ' + obj.title;
      delete this.isCued;
    // when not using gapless playback
    } else {
      this.audio = new Audio();
      if (obj.artist === '') {
        this.app.currentPlaying = obj.title;
        this.note.title = obj.title;
        this.audio.src = this.$.globals.buildUrl('stream', {
          format: 'raw',
          estimateContentLength: true,
          id: obj.id
        });
      // default playback  * transcoded audio *
      } else {
        this.app.currentPlaying = obj.artist + ' - ' + obj.title;
        this.note.title = obj.artist + ' - ' + obj.title;
        if (!this.isCued) {
          this.audio.src = this.$.globals.buildUrl('stream', {
            maxBitRate: this.app.bitRate,
            id: obj.id
          });
        }
      }
    }
    
    // set playback position if bookmarked file
    if (obj.bookmarkPosition) {
      this.audio.currentTime = obj.bookmarkPosition / 1000;
    } else {
      this.audio.currentTime = 0;
    }
    
    // set action fab color to match color of playing track art
    if (obj.palette) {
      this.app.colorThiefFab = obj.palette[0];
      this.app.colorThiefFabOff = obj.palette[1];
      this.app.colorThiefBuffered = obj.palette[2];
      this.app.colorThiefProgBg = obj.palette[3];
    }

    // set cover art
    this.$.cover2.style.backgroundImage = "url('" + obj.cover + "')";
    this.$.coverArt.style.backgroundImage = "url('" + obj.cover + "')";
    this.$.bg.style.backgroundImage = "url('" + obj.cover + "')";

    // this track has not been scrobbled to last.fm
    this.scrobbled = false;

    // set playing on mini player
    var minis = document.querySelectorAll('mini-player');
    var length = minis.length;
    for (var i = 0; i < length; i++) {
      minis[i].setPlaying(obj);
    }

    // start playback
    this.applyAudioListeners(this.audio);
    this.audio.play();

    // notify user of new track
    this.note.icon = obj.cover;
    this.note.show();

    // send analitics
    this.app.tracker.sendEvent('Playback Started', new Date());
  },
  
  /**
   * toggle play / pause state
   */ 
  playPause: function () {
    if (!this.audio.paused) {
      this.audio.pause();
    } else {
      this.audio.play();
    }
  },
  
  /**
   * will play the next track with a given index
   * @param {Number} next = index of the next item to play
   */
  playNext: function (next) {
    if (this.app.repeatPlaylist && !this.app.playlist[next]) {
      if (this.app.playing === 0) {
        this.playAudio(this.app.playlist[0]);
      } else {
        this.app.playing = 0;
      }
    } else if (this.app.playlist[next]) {
      this.app.playing = next;
    } else {
      this.audio.pause();
      this.removeListeners(this.audio);
      delete this.audio;
      this.app.clearPlaylist();

      // hide mini players
      var minis = document.querySelectorAll('mini-player');
      var length = minis.length;
      for (var i = 0; i < length; i++) {
        minis[i].page = 0;
      }
    }
  },
  
  /**
   * incriment the playing item by 1 & remove any bookmark for the play file
   */
  nextTrack: function () {
    // if track longer then 20 min and autobookmark enabled 
    // will delete the last bookmark 
    if (this.app.autoBookmark && this.audio.duration > 1200) {
      var url = this.$.globals.buildUrl('deleteBookmark', {
        id: this.app.playlist[this.app.playing].id
      });
      this.$.globals.doXhr(url, 'json').then(function (e) {
        if (e.target.response['subsonic-response'].status === 'failed') {
          console.error(e.target.response['subsonic-response'].error.message);
        }
      });
    }
    //this.app.playing = this.app.playing || 0;
    this.playNext(this.app.playing + 1);
  },
  
  /**
   * incriment the playing item by -1
   */
  lastTrack: function () {
    this.playNext(this.app.playing - 1);
  },
  
  /**
   * audio playback error
   */
  audioError: function (e) {
    this.app.page = 0;
    console.error('audio playback error ', e);
    this.$.globals.makeToast('Audio Playback Error');
    this.app.tracker.sendEvent('Audio Playback Error', e.target);
  },
  
  /**
   * download progress callback
   * @param {Event} e -  progress event
   */
  buffering: function (e) {
    var audio = e.srcElement;
    if (audio.duration && audio.buffered.end(0)) {
      this.buffer = Math.floor((audio.buffered.end(0) / audio.duration) * 100);
    } else {
      this.buffer = 0;
    }
    audio = null;
  },
  
  /**
   * playback progress callback
   * 
   * if gapless playback is enable will start precache 
   * of next track @ 1 min from end of currently playing
   * 
   * will scrobble to last.fm if more then half of the track has been played 
   * 
   * will create a bookmark for files longer then 20 mins @ about every 1 min of play time 
   * if more then 2 mins into track and 
   * 
   * @param {Event} e - progress event
   */
  playerProgress: function (e) {
    var audio = e.srcElement;
    // gapless?
    if (this.app.gapless && audio.currentTime >= Math.abs(audio.duration - 60) 
    && !this.isCued && this.app.playlist[this.app.playing + 1]) {
      this.isCued = new Audio();
      if (this.app.playlist[this.app.playing + 1].artist === '') {
        this.isCued.src = this.$.globals.buildUrl('stream', {
          format: 'raw',
          estimateContentLength: true,
          id: this.app.playlist[this.app.playing + 1].id
        });
      } else {
        this.isCued.src = this.$.globals.buildUrl('stream', {
          maxBitRate: this.app.bitRate,
          id: this.app.playlist[this.app.playing + 1].id
        });
      }
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
      this.$.globals.doXhr(this.$.globals.buildUrl('scrobble', {
        id: this.app.playlist[this.app.playing].id, 
        time: new Date().getTime()
      }), 'json').then(function (e) {
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
      && Math.abs(audio.currentTime / audio.duration * 100) < 98) {
      this.count = this.count + 1;
      if (this.count >= 250) {
        this.count = 0;
        var url = this.$.globals.buildUrl('createBookmark', {
          id: this.app.playlist[this.app.playing].id,
          position: Math.floor(audio.currentTime * 1000),
          comment: this.app.playlist[this.app.playing].title + ' at ' + this.$.globals.secondsToMins(audio.currentTime)
        });
        this.$.globals.doXhr(url, 'json').then(function (e) {
          if (e.target.response['subsonic-response'].status === 'failed') {
            console.error(e.target.response['subsonic-response'].error.message);
          }
        });
      }
    }

    if (!audio.paused) {
      this.app.isNowPlaying = true;
      this.$.avIcon.icon = "av:pause";
      if (!audio.duration) {
        this.playTime = this.currentMins + ':' + ('0' + this.currentSecs).slice(-2) + ' / ?:??';
        this.progress = 0;
      } else {
        this.playTime = this.currentMins + ':' + ('0' + this.currentSecs).slice(-2) + ' / ' + this.totalMins + ':' + ('0' + this.totalSecs).slice(-2);
        this.progress = Math.floor(audio.currentTime / audio.duration * 100);
      }
    } else {
      this.app.isNowPlaying = false;
      this.$.avIcon.icon = "av:play-arrow";
    }
  },
  
  /**
   * open the volume dialog
   */
  toggleVolume: function () {
    this.app.toggleVolume();
  },
  
  /**
   * user click on progress bar callback
   * @param {Event} e - click event
   */
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
  
  /**
   * toggle playlist repeat option
   */
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
  
  /**
   * callback for media query state change
   * toggles player view
   * @param {Number} oldVal
   * @param {Number} newVal
   */
  smallChanged: function (oldVal, newVal) {
    this.async(function () {
      if (newVal) {
        this.page = 0;
      } else {
        this.page = 1;
      }
    });
  },
  
  /**
   * open the bookmark creation dialog
   */
  createBookmark: function () {
    var artist = this.app.playlist[this.app.playing].artist;
    var track = this.app.playlist[this.app.playing].title;
    this.app.$.playlistDialog.close();
    this.app.$.bookmarkDialog.open();
    this.app.bookmarkComment = this.app.playlist[this.app.playing].title + ' at ' +     this.$.globals.secondsToMins(this.audio.currentTime);
  },
  
  /**
   * submit data to server to create a bookmark
   */
  submitBookmark: function () {
    this.app.submittingBookmark = true;
    var pos = Math.floor(this.audio.currentTime * 1000);
    var url = this.$.globals.buildUrl('createBookmark', {
      id: this.app.playlist[this.app.playing].id,
      position: pos,
      comment: this.app.bookmarkComment
    });
    this.$.globals.doXhr(url, 'json').then(function (e) {
      this.app.submittingBookmark = false;
      if (e.target.response['subsonic-response'].status === 'ok') {
        this.$.globals.makeToast(this.$.globals.markCreated);
        this.app.$.bookmarkDialog.close();
      } else {
        this.$.globals.makeToast(e.target.response['subsonic-response'].error.message);
      }
    }.bind(this));
  },
  
  /**
   * shuffle the current play queue
   */
  shufflePlaylist: function () {
    this.app.shufflePlaylist();
  }
});
