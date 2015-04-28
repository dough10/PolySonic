/*global chrome, CryptoJS, console, window, document, XMLHttpRequest, setInterval, screen, analytics, Blob, navigator, Image, CoreAnimation, ColorThief, setTimeout */
(function () {
  'use strict';
  
  /*
    cast API 
  */
  function onRequestSessionSuccess(e) {
    session = e;
    console.log(session);
  }
  
  function onLaunchError(e) {
    console.log(e.code);
  }
 
  var initializeCastApi = function() {
    var sessionRequest = new chrome.cast.SessionRequest(chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID);
    var apiConfig = new chrome.cast.ApiConfig(sessionRequest,
      sessionListener,
      receiverListener);
    chrome.cast.initialize(apiConfig, onInitSuccess, onInitError);
  };
    
  function receiverListener(e) {
    if( e === chrome.cast.ReceiverAvailability.AVAILABLE) {
      console.log(e);
    }
  }
  
  function sessionListener(e) {
    session = e;
    if (session.media.length !== 0) {
      onMediaDiscovered('onRequestSessionSuccess', session.media[0]);
    }
  }
  
  function onInitSuccess(e) {
    console.log('CastAPI Ready');
  }
  
  function onInitError(e) {
    console.log(e);
  }
  
  window['__onGCastApiAvailable'] = function(loaded, errorInfo) {
    if (loaded) {
      initializeCastApi();
    } else {
      console.log(errorInfo);
    }
  };

  /* polymer auto-binding template ready */
  var tmpl = document.querySelector('#tmpl');
  tmpl.addEventListener('template-bound', function () {
  
    /*locale settings */
  
    this.appName = chrome.i18n.getMessage("appName");
    
    this.appDesc = chrome.i18n.getMessage("appDesc");
  
    this.folderSelector = chrome.i18n.getMessage("folderSelector");
  
    this.shuffleButton = chrome.i18n.getMessage("shuffleButton");
  
    this.artistButton = chrome.i18n.getMessage("artistButton");
    
    this.podcastButton = chrome.i18n.getMessage("podcastButton");
    
    this.favoritesButton = chrome.i18n.getMessage("favoritesButton");
    
    this.searchButton = chrome.i18n.getMessage("searchButton");
    
    this.settingsButton = chrome.i18n.getMessage("settingsButton");
    
    this.nowPlayingLabel = chrome.i18n.getMessage("nowPlayingLabel");
    
    this.folderSelectorLabel = chrome.i18n.getMessage("folderSelectorLabel");
    
    this.clearQueue = chrome.i18n.getMessage("clearQueue");
    
    this.volumeLabel = chrome.i18n.getMessage("volumeLabel");
    
    this.analistics = chrome.i18n.getMessage("analistics");
    
    this.accept = chrome.i18n.getMessage("accept");
    
    this.decline = chrome.i18n.getMessage("decline");
    
    this.shuffleOptionsLabel = chrome.i18n.getMessage("shuffleOptionsLabel");
    
    this.optional = chrome.i18n.getMessage("optional");
    
    this.artistLabel = chrome.i18n.getMessage("artistLabel");
  
    this.albumLabel = chrome.i18n.getMessage("albumLabel");
  
    this.genreLabel = chrome.i18n.getMessage("genreLabel");
  
    this.songReturn = chrome.i18n.getMessage("songReturn");
  
    this.playButton = chrome.i18n.getMessage("playButton");
  
    this.yearError = chrome.i18n.getMessage("yearError");
  
    this.releasedAfter = chrome.i18n.getMessage("releasedAfter");
  
    this.releasedBefore = chrome.i18n.getMessage("releasedBefore");
  
    this.submitButton = chrome.i18n.getMessage("submitButton");
  
    this.deleteConfirm = chrome.i18n.getMessage("deleteConfirm");
  
    this.noResults = chrome.i18n.getMessage("noResults");
  
    this.urlError = chrome.i18n.getMessage("urlError");
  
    this.podcastSubmissionLabel = chrome.i18n.getMessage("podcastSubmissionLabel");
  
    this.diskUsed = chrome.i18n.getMessage("diskused");
  
    this.diskRemaining = chrome.i18n.getMessage("diskRemaining");
    
    this.playlistsButton = chrome.i18n.getMessage("playlistsButton");
    
    this.createPlaylistLabel = chrome.i18n.getMessage("createPlaylistLabel");
    
    this.playlistLabel = chrome.i18n.getMessage("playlistLabel");
    
    this.reloadAppLabel = chrome.i18n.getMessage("reloadApp");
    
    this.settingsDeleted = chrome.i18n.getMessage("settingsDeleted");
    
    this.recommendReload = chrome.i18n.getMessage("recommendReload");
  
    
    /* begin analistics */
    this.service = analytics.getService('PolySonic');
  
    this.tracker = this.service.getTracker('UA-50154238-6');  // Supply your GA Tracking ID.
  
  
    this.startCast = function () {
      chrome.cast.requestSession(onRequestSessionSuccess, onLaunchError);
    };
  
    /* indexeddb */
    this.indexedDB = window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB || window.OIndexedDB || window.msIndexedDB;
  
    this.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.OIDBTransaction || window.msIDBTransaction;
  
    this.dbVersion = 1.0;
  
    this.request = this.indexedDB.open("albumInfo", this.dbVersion);
  
    this.request.onerror = function () {
      console.log("Error creating/accessing IndexedDB database");
    };
  
    this.request.onsuccess = function () {
      console.log("Success creating/accessing IndexedDB database");
      this.db = this.request.result;
  
      // Interim solution for Google Chrome to create an objectStore. Will be deprecated
      if (this.db.setVersion) {
        if (this.db.version !== this.dbVersion) {
          var setVersion = this.db.setVersion(this.dbVersion);
          setVersion.onsuccess = function () {
            this.createObjectStore(this.db);
          };
        }
      }
    }.bind(this);
  
    this.request.onupgradeneeded = function (event) {
      this.createObjectStore(event.target.result);
    }.bind(this);
  
    this.createObjectStore = function (dataBase) {
      console.log("Creating objectStore");
      dataBase.createObjectStore("albumInfo");
    };
  
    this.getImageForPlayer = function (url, callback) {
      var art = this.$.coverArt,
        note = this.$.playNotify;
  
      art.style.backgroundImage = "url('" + url + "')";
      note.icon = url;
      callback();
    };
  
    this.defaultPlayImage = function () {
      var art = this.$.coverArt,
        note = this.$.playNotify;
  
      art.style.backgroundImage =  "url('images/default-cover-art.png')";
      note.icon = 'images/default-cover-art.png';
    };
  
    this.playlist = [];
  
    this.page = this.page || 0;
  
    this.pageLimit = false;
  
    this.sortTypes = [
      {sort: 'newest', name: chrome.i18n.getMessage("newButton")},
      {sort: 'alphabeticalByArtist', name: chrome.i18n.getMessage("byArtistButton")},
      {sort: 'alphabeticalByName', name: chrome.i18n.getMessage("titleButton")},
      {sort: 'frequent', name: chrome.i18n.getMessage("frequentButton")},
      {sort: 'recent', name: chrome.i18n.getMessage("recentButton")}
    ];
  
    this.closeDrawer = function (callback) {
      var panel = this.$.panel;
      panel.closeDrawer();
      callback();
    };
  
    this.appScroller = function () {
      return this.$.headerPanel.scroller;
    };
  
    /*jslint unparam: true*/
    this.fixScroller = function (event, detail, sender) {
      /*var scrollbar = this.appScroller();
      if (event.type === 'core-animated-pages-transition-prepare' && event.target.id === 'main' && scrollbar.scrollTop !== 0) {
        scrollbar.scrollTop = 0;
      }*/
    };
    /*jslint unparam: false*/
  
    this.openSearch = function () {
      this.closeDrawer(function () {
        this.$.searchDialog.toggle();
      }.bind(this));
    };
  
    this.closeVolume = function () {
      this.$.volumeDialog.close();
    };
  
    this.xhrError = function (e) {
      this.dataLoading = false;
      console.log(e);
      this.doToast(chrome.i18n.getMessage("connectionError"));
    }.bind(this);
  
    this.doXhr = function (url, dataType, callback) {
      var xhr = new XMLHttpRequest();
      xhr.open("GET", url, true);
      xhr.responseType = dataType;
      xhr.onload = callback;
      xhr.onerror = this.xhrError;
      xhr.send();
    };
  
    this.showApp = function () {
      var loader = document.getElementById("loader"),
        visible = loader.classList.contains("hide"),
        box = document.getElementById("box");
  
      if (!visible) {
        loader.classList.add('hide');
        box.classList.add('hide');
        box.classList.add('hide');
        this.askAnalistics();
      }
    };
  
    /* request premission for analistics */
    this.askAnalistics = function () {
      chrome.storage.sync.get(function (result) {
        this.service.getConfig().addCallback(
          /** @param {!analytics.Config} config */
          function (config) {
            if (result.analistics === undefined) {
              this.askUser();
            } else {
              config.setTrackingPermitted(result.analistics);
              this.analisticsEnabled = result.analistics;
            }
            this.allowAnalistics = function () {
              this.analisticsEnabled = true;
              config.setTrackingPermitted(true);
              chrome.storage.sync.set({
                'analistics': true
              });
            };
  
            this.disAllowAnalistics = function () {
              this.analisticsEnabled = false;
              config.setTrackingPermitted(false);
              chrome.storage.sync.set({
                'analistics': false
              });
            };
          }.bind(this)
        );
      }.bind(this));
    };
  
    this.askUser = function () {
      this.$.analistics.toggle();
    };
  
    this.jumpTo = function (event, detail, sender) {
      this.$.wall.jumpToLetter(sender.attributes.it.value);
    };
  
    this.doSearch = function () {
      if (this.searchQuery) {
        this.searching = true;
        var url = this.url + '/rest/search3.view?u=' + this.user + '&p=' + this.pass + '&v=' + this.version + '&c=PolySonic&f=json&query=' + encodeURIComponent(this.searchQuery);
        this.doXhr(url, 'json', function (e) {
          if (e.target.response['subsonic-response'].status === 'ok') {
            this.searching = false;
            var response = e.target.response['subsonic-response'];
            this.searchResults = [];
            this.searchResults.artist = response.searchResult3.artist;
            this.searchResults.album = [];
            this.searchResults.song = response.searchResult3.song;
            if (response.searchResult3.album !== null && response.searchResult3.album !== undefined) {
              Array.prototype.forEach.call(response.searchResult3.album, function (e) {
                var data = {artist: e.artist, coverArt: e.coverArt, id: e.id, name: e.name, url: this.url, user: this.user, pass: this.pass, version: this.version, bitRate: this.bitRate, listMode: 'cover'};
                this.searchResults.album.push(data);
              }.bind(this));
            }
          }
        }.bind(this));
      } else {
        this.doToast(chrome.i18n.getMessage("noSearch"));
      }
    };
  
    /* pull image from server */
    this.getImageFile = function (url, id, callback) {
      this.doXhr(url, 'blob', function (e) {
        var blob = new Blob([e.target.response], {type: 'image/jpeg'});
        this.putInDb(blob, id, callback);
        console.log('Image Added to indexedDB ' + id);
      }.bind(this));
    };
  
    this.putInDb = function (data, id, callback) {
      var transaction = this.db.transaction(["albumInfo"], "readwrite");
      if (id) {
        transaction.objectStore("albumInfo").put(data, id);
        transaction.objectStore("albumInfo").get(id).onsuccess = callback;
      }
    };
  
    this.calculateStorageSize = function () {
      navigator.webkitTemporaryStorage.queryUsageAndQuota(function (used, remaining) {
        var usedQuota = Math.round(10 * (((used / 1000) / 1000))) / 10,
          remainingQuota = Math.round(10 * ((remaining / 1000) / 1000)) / 10,
          bytes = 'MB';
        if (remainingQuota > 1000) {
          remainingQuota = Math.round(10 * (((remaining / 1000) / 1000) / 1000)) / 10;
          bytes = 'GB';
        }
        this.storageQuota = this.diskUsed + ": " + usedQuota  + " MB, " + this.diskRemaining + ": " + remainingQuota + " " + bytes;
      }.bind(this), function (e) {
        console.log('Error', e);
      });
    };
  
    this.getDbItem = function (id, callback) {
      if (id) {
        var transaction = this.db.transaction(["albumInfo"], "readwrite"),
          request = transaction.objectStore("albumInfo").get(id);
        request.onsuccess = callback;
        request.onerror = this.dbErrorHandler;
      }
    };
  
    this.shuffleSizes = [
      20,
      40,
      50,
      75,
      100,
      200
    ];
    
    this.openPlaylists = function () {
      this.closeDrawer(function ()  {
        this.playlistsLoading = true;
        var url = this.url + '/rest/getPlaylists.view?u=' + this.user + '&p=' + this.pass + '&v=' + this.version + '&c=PolySonic&f=json';
        this.doXhr(url, 'json', function (e) {
          this.playlistsLoading = false;
          this.playlists = e.target.response['subsonic-response'].playlists.playlist;
          this.$.playlistsDialog.open();
        }.bind(this));
      }.bind(this));
    };
    
    this.savePlayQueue = function () {
      this.$.playlistDialog.close();
      this.$.createPlaylist.open();
      this.defaultName = new Date();
    };
    
    this.savePlayQueue2Playlist = function () {
      var url = this.url + '/rest/createPlaylist.view?u=' + this.user + '&p=' + this.pass + '&v=' + this.version + '&c=PolySonic&f=json&name=' + encodeURIComponent(this.defaultName),
        hasRun = false,
        i = 0;
      this.savingPlaylist = true;
      Array.prototype.forEach.call(this.playlist, function (item) {
        url = url + '&songId=' + item.id;
        i = i + 1;
        if (i === this.playlist.length) {
          this.doXhr(url, 'json', function (e) {
            if (e.target.response['subsonic-response'].status === 'ok') {
              this.doToast(chrome.i18n.getMessage('playlistCreated'));
              this.$.createPlaylist.close();
              this.savingPlaylist = false;
            } else {
              this.doToast(chrome.i18n.getMessage('playlistError'));
              this.savingPlaylist = false;
            }
          }.bind(this));
        }
      }.bind(this));
    };
    
    this.closePlaylistSaver = function () {
      this.$.createPlaylist.close();
    };
    
    this.playPlaylist = function (event, detail, sender) {
      var url = this.url + '/rest/getPlaylist.view?u=' + this.user + '&p=' + this.pass + '&v=' + this.version + '&c=PolySonic&f=json&id=' + sender.attributes.ident.value,
        tracks,
        mins,
        seconds,
        artId,
        obj,
        timeString,
        i = 0;
      this.dataLoading = true;
      this.playlist = null;
      this.playlist = [];
      this.$.audio.pause();
      this.doXhr(url, 'json', function (e) {
        tracks = e.target.response['subsonic-response'].playlist.entry;
        Array.prototype.forEach.call(tracks, function (item) {
          mins = Math.floor(item.duration / 60);
          seconds = Math.floor(item.duration - (mins * 60));
          timeString = mins + ':' + ('0' + seconds).slice(-2);
          artId = "al-" + item.albumId;
          obj = {id: item.id, artist: item.artist, title: item.title, duration: timeString, cover: artId};
          this.fixCoverArtForShuffle(obj, function () {
            i = i + 1;
            if (i === tracks.length) {
              this.doShufflePlayback();
              this.dataLoading = false;
              this.closePlaylists();
            }
          }.bind(this));
        }.bind(this));
      }.bind(this));
    };
    
    this.reallyDelete = function (event, detail, sender) {
      this.delID =  sender.attributes.ident.value;
      this.$.playlistsDialog.close();
      this.$.playlistConfirm.open();
    };
  
    this.deletePlaylist = function (event, detail, sender) {
      var url = this.url + '/rest/deletePlaylist.view?u=' + this.user + '&p=' + this.pass + '&v=' + this.version + '&c=PolySonic&f=json&id=' + sender.attributes.ident.value,
        url2 = this.url + '/rest/getPlaylists.view?u=' + this.user + '&p=' + this.pass + '&v=' + this.version + '&c=PolySonic&f=json';
      this.doXhr(url, 'json', function (e) {
        if (e.target.response['subsonic-response'].status === 'ok') {
          this.playlistsLoading = true;
          this.doXhr(url2, 'json', function (e) {
            this.playlistsLoading = false;
            this.playlists = e.target.response['subsonic-response'].playlists.playlist;
            this.$.playlistsDialog.open();
          }.bind(this));
        } else {
          this.doToast(chrome.i18n.getMessage('deleteError'));
        }
      }.bind(this));
    };
    
    this.closePlaylists = function () {
      this.$.playlistsDialog.close();
    };
  
    this.shuffleSize = this.shuffleSize || '50';
  
    this.shuffleOptions = function () {
      this.async(function () {
        var url = this.url + '/rest/getGenres.view?u=' + this.user + '&p=' + this.pass + '&v=' + this.version + '&c=PolySonic&f=json';
        this.closeDrawer(function () {
          this.doXhr(url, 'json', function (e) {
            this.genres = e.target.response['subsonic-response'].genres.genre;
            this.$.shuffleOptions.open();
          }.bind(this));
        }.bind(this));
      });
    };
    
    this.closeShuffleOptions = function () {
      this.$.shuffleOptions.close();
    };
  
    this.shufflePlay = function () {
      this.dataLoading = true;
      this.shuffleLoading = true;
      this.playlist = null;
      this.playlist = [];
      var url,
        imgURL,
        artId,
        obj,
        mins,
        seconds,
        timeString,
        i = 0;
        
      if (!this.startYearInvalid && !this.endYearInvalid) {
        this.$.audio.pause();
        if (this.endingYear && this.startingYear && this.genreFilter) {
          url = this.url + '/rest/getRandomSongs.view?u=' + this.user + '&p=' + this.pass + '&v=' + this.version + '&c=PolySonic&f=json&size=' + this.shuffleSize + '&genre=' + encodeURIComponent(this.genreFilter) + '&fromYear=' + this.startingYear + '&toYear=' + this.endingYear;
        } else if (this.endingYear && this.startingYear) {
          url = this.url + '/rest/getRandomSongs.view?u=' + this.user + '&p=' + this.pass + '&v=' + this.version + '&c=PolySonic&f=json&size=' + this.shuffleSize + '&fromYear=' + this.startingYear + '&toYear=' + this.endingYear;
        } else if (this.endingYear && this.genreFilter) {
          url = this.url + '/rest/getRandomSongs.view?u=' + this.user + '&p=' + this.pass + '&v=' + this.version + '&c=PolySonic&f=json&size=' + this.shuffleSize + '&genre=' + encodeURIComponent(this.genreFilter) + '&toYear=' + this.endingYear;
        } else if (this.startingYear && this.genreFilter) {
          url = this.url + '/rest/getRandomSongs.view?u=' + this.user + '&p=' + this.pass + '&v=' + this.version + '&c=PolySonic&f=json&size=' + this.shuffleSize + '&genre=' + encodeURIComponent(this.genreFilter) + '&fromYear=' + this.startingYear;
        } else if (this.genreFilter) {
          url = this.url + '/rest/getRandomSongs.view?u=' + this.user + '&p=' + this.pass + '&v=' + this.version + '&c=PolySonic&f=json&size=' + this.shuffleSize + '&genre=' + encodeURIComponent(this.genreFilter);
        } else if (this.startingYear) {
          url = this.url + '/rest/getRandomSongs.view?u=' + this.user + '&p=' + this.pass + '&v=' + this.version + '&c=PolySonic&f=json&size=' + this.shuffleSize + '&fromYear=' + this.startingYear;
        } else if (this.endingYear) {
          url = this.url + '/rest/getRandomSongs.view?u=' + this.user + '&p=' + this.pass + '&v=' + this.version + '&c=PolySonic&f=json&size=' + this.shuffleSize + '&toYear=' + this.endingYear;
        } else {
          url = this.url + '/rest/getRandomSongs.view?u=' + this.user + '&p=' + this.pass + '&v=' + this.version + '&c=PolySonic&f=json&size=' + this.shuffleSize;
        }
        this.doXhr(url, 'json', function (event) {
          var data = event.target.response['subsonic-response'];
          if (data.randomSongs.song) {
            Array.prototype.forEach.call(data.randomSongs.song, function (item) {
              mins = Math.floor(item.duration / 60);
              seconds = Math.floor(item.duration - (mins * 60));
              timeString = mins + ':' + ('0' + seconds).slice(-2);
              artId = "al-" + item.albumId;
              obj = {id: item.id, artist: item.artist, title: item.title, duration: timeString, cover: artId};
              this.fixCoverArtForShuffle(obj, function () {
                i = i + 1;
                if (i === data.randomSongs.song.length) {
                  this.doShufflePlayback();
                  this.dataLoading = false;
                }
              }.bind(this));
            }.bind(this));
          } else {
            this.doToast(chrome.i18n.getMessage("noMatch"));
            this.shuffleLoading = false;
          }
        }.bind(this));
      } else {
        this.shuffleLoading = false;
        this.doToast(chrome.i18n.getMessage("invalidEntry"));
      }
    };
    
    this.closePodcastDialog = function () {
      this.$.addPodcast.close();
    };
    

    this.colorThiefHandler = function (imgURL, artId, callback) {
      var imgElement = new Image();
      imgElement.src = imgURL;
      imgElement.onload = function () {
        var color = this.getColor(imgElement),
          colorArray = [],
          r = color[1][0],
          g = color[1][1],
          b = color[1][2],
          hex = this.rgbToHex(r, g, b);

        /*
          array[0] fab color

          array[1] fab contrasting color

          array[2] progress bar buffering color

          array[3] progress bar background
        */
        colorArray[0] = 'rgb(' + r + ',' + g + ',' + b + ');';
        colorArray[1] = this.getContrast50(hex);
        colorArray[2] = 'rgba(' + r + ',' + g + ',' + b + ',0.5);';
        if (colorArray[1] !== 'white') {
          colorArray[3] = '#444444';
        } else {
          colorArray[3] = '#c8c8c8';
        }
        this.putInDb(colorArray, artId + '-palette', function () {
          callback(colorArray);
          console.log('Color palette saved ' + artId);
        }.bind(this));
      }.bind(this);
    };
  
    this.fixCoverArtForShuffle = function (obj, callback) {
      var artId = obj.cover,
        img = this.url + '/rest/getCoverArt.view?u=' + this.user + '&p=' + this.pass + '&v=' + this.version + '&c=PolySonic&f=json&id=' + artId;
          
      this.getDbItem(artId, function (ev) {
        if (ev.target.result) {
          var raw = ev.target.result,
            imgURL = window.URL.createObjectURL(raw);
          obj.cover = imgURL;
          this.getDbItem(artId + '-palette', function (ev) {
            obj.palette = ev.target.result;
            this.playlist.push(obj);
            this.async(callback);
          }.bind(this));
        } else {
          this.getImageFile(img, artId, function (ev) {
            var raw = ev.target.result,
              imgURL = window.URL.createObjectURL(raw);
            obj.cover = imgURL;
            this.colorThiefHandler(imgURL, artId, function (colorArray) {
              this.async(function () {
                obj.palette = colorArray;
                this.playlist.push(obj);
                this.async(callback);
              });
            }.bind(this));
          }.bind(this));
        }
      }.bind(this));
    };
    
    this.setFabColor = function (obj) {
      if (this.colorThiefEnabled && obj.palette) {
        this.colorThiefFab = obj.palette[0];
        this.colorThiefFabOff = obj.palette[1];
        this.colorThiefBuffered = obj.palette[2];
        this.colorThiefProgBg = obj.palette[3];
      }
    };
  
    this.doShufflePlayback = function () {
      if (this.$.audio.paused) {
        var art = this.url + '/rest/stream.view?u=' + this.user + '&p=' + this.pass + '&v=' + this.version + '&c=PolySonic&maxBitRate=' + this.bitRate + '&id=' + this.playlist[0].id;
        this.playing = 0;
        this.playAudio(this.playlist[0].artist, this.playlist[0].title, art, this.playlist[0].cover, this.playlist[0].id);
        this.getImageForPlayer(this.playlist[0].cover, function () {
          this.page = 1;
          this.setFabColor(this.playlist[0]);
          this.$.shuffleOptions.close();
          this.shuffleLoading = false;
        }.bind(this));
      }
    };
  
    this.doAction = function (event, detail, sender) {
      this.async(function () {
        var scroller = this.appScroller(),
          wall = this.$.wall,
          animation = new CoreAnimation();
        animation.duration = 1000;
        animation.iterations = 'Infinity';
        animation.keyframes = [
          {opacity: 1},
          {opacity: 0}
        ];
        animation.target = sender;
        if (this.page === 0 && scroller.scrollTop !== 0 && wall.showing !== 'podcast' && this.$.fab.state === 'bottom') {
          this.async(function () {
            scroller.scrollTop = 0;
          });
        }
        if (this.page === 0 && wall.showing === 'podcast') {
          this.$.addPodcast.open();
        }
        if (this.page === 1) {
          this.showPlaylist();
        }
        if (this.page === 0 && this.$.fab.state === 'mid') {
          animation.play();
          this.$.wall.playSomething(sender.ident, function () {
            animation.cancel();
          });
        }
        if (this.page === 3) {
          animation.play();
          this.$.aDetails.playSomething(sender.ident, function () {
            animation.cancel();
          });
        }
      });
    };
  
    this.playerProgress = function (e) {
      var audio, button, progress, currentMins, currentSecs, totalMins, totalSecs;
      if (e) {
        if (e.type === 'waiting') {
          this.waitingToPlay = true;
        } else if (e.type === 'timeupdate') {
          this.waitingToPlay = false;
        }
        audio = e.srcElement;
      } else {
        audio = this.$.audio;
      }
      button = this.$.avIcon;
      progress = Math.round((audio.currentTime / audio.duration * 100) * 100) / 100;
      currentMins = Math.floor(audio.currentTime / 60);
      currentSecs = Math.floor(audio.currentTime - (currentMins * 60));
      totalMins = Math.floor(audio.duration / 60);
      totalSecs = Math.floor(audio.duration - (totalMins * 60));
      if (audio.duration) {
        this.buffer = (audio.buffered.end(0) / audio.duration) * 100;
      } else {
        this.buffer = 0;
      }

      if (!audio.paused) {
        button.icon = "av:pause";
        this.isNowPlaying = true;
        if (!audio.duration) {
          this.contentLoading = true;
          this.playTime = currentMins + ':' + ('0' + currentSecs).slice(-2) + ' / ?:??';
          this.progress = 0;
        } else {
          this.contentLoading = false;
          this.playTime = currentMins + ':' + ('0' + currentSecs).slice(-2) + ' / ' + totalMins + ':' + ('0' + totalSecs).slice(-2);
          this.progress = progress;
        }
      } else {
        this.isNowPlaying = false;
        button.icon = "av:play-arrow";
      }
    };
  
    this.sizePlayer = function () {
      var height = (window.innerHeight - 256) + 'px',
        width = window.innerWidth + 'px',
        art = this.$.coverArt;
  
      art.style.width = width;
      art.style.height = height;
      art.style.backgroundSize = width;
    };
  
    this.loadListeners = function () {
      var scroller = this.appScroller(),
        audio = this.$.audio,
        maximized = chrome.app.window.current().isMaximized(),
        button = this.$.max,
        timer;
        
      if (maximized) {
        button.icon = 'check-box-outline-blank';
      } else {
        button.icon = 'flip-to-back';
      }
  
      scroller.onscroll = function () {
        var fab = this.$.fab,
          wall = this.$.wall;
  
        if (this.page === 0 && fab.state !== 'off' && scroller.scrollTop < this.position && wall.showing !== 'podcast') {
          fab.state = 'off';
        } else if (this.page === 0 && fab.state !== 'bottom' && scroller.scrollTop > this.position && wall.showing !== 'podcast') {
          fab.state = 'bottom';
        }
        this.position = scroller.scrollTop;
      }.bind(this);
  
      /*
        only needed if fullscreen enabled
  
      */
      //window.onresize = this.sizePlayer.bind(this);
      
      audio.onwaiting = this.playerProgress.bind(this);
      
      audio.onstalled = function (e) {
        if (timer) {
          clearInterval(timer);
        }
        timer = setInterval(function () {
          this.playerProgress();
        }.bind(this), 250);
      }.bind(this);
      
      audio.onplay = function (e) {
        if (timer) {
          clearInterval(timer);
        }
      };
      
      audio.onpause = function (e) {
        if (timer) {
          clearInterval(timer);
        }
        timer = setInterval(function () {
          this.playerProgress();
        }.bind(this), 250);
      }.bind(this);
      
      audio.ontimeupdate = this.playerProgress.bind(this);
  
      audio.onended = this.nextTrack.bind(this);
  
      audio.onerror = function (e) {
        console.log('audio playback error ', e);
        this.tracker.sendEvent('Audio Playback Error', e.target);
      }.bind(this);
    };
  
    this.loadData = function () {
      chrome.storage.sync.get(function (result) {
        if (result.url === undefined) {
          this.$.firstRun.open();
        }
        this.url = result.url;
        this.user = result.user;
        this.pass = result.pass;
        this.listMode = result.listMode || 'cover';
        this.bitRate = result.bitRate || 320;
        this.version = '1.11.0';
        this.querySize = 30;
        this.volume = result.volume || 100;
        this.queryMethod = result.queryMethod || 'ID3';
        this.colorThiefEnabled = true;
        if (this.url && this.user && this.pass && this.version) {
          var url = this.url + '/rest/ping.view?u=' + this.user + '&p=' + this.pass + '&v=' + this.version + '&c=PolySonic&f=json',
            url2;
          this.doXhr(url, 'json', function (e) {
            if (e.target.status === 200) {
              var response = e.target.response['subsonic-response'];
              this.version = response.version;
              url2 = this.url + "/rest/getMusicFolders.view?u=" + this.user + "&p=" + this.pass + "&f=json&v=" + this.version + "&c=PolySonic";
              if (response.status === 'ok') {
                console.log('Connected to Subconic loading data');
                this.doXhr(url2, 'json', function (e) {
                  this.mediaFolders = e.target.response['subsonic-response'].musicFolders.musicFolder;
                  /* setting mediaFolder causes a ajax call to get album wall data */
                  this.folder = result.mediaFolder || 0;
                  if (!e.target.response['subsonic-response'].musicFolders.musicFolder[1]) {
                    this.$.sortBox.style.display = 'none';
                  }
                  this.tracker.sendAppView('Album Wall');
                }.bind(this));
              } else {
                this.tracker.sendEvent('Connection Error', response.error.meessage);
                this.$.firstRun.toggle();
                this.doToast(response.error.meessage);
              }
            } else {
              this.tracker.sendEvent('Connection Error', e.target.response['subsonic-response'].error.meessage);
              this.$.firstRun.toggle();
              this.doToast(e.target.response['subsonic-response'].error.meessage);
            }
          }.bind(this));
        }
      }.bind(this));
    };
  
    this.closeSearch = function () {
      this.$.searchDialog.close();
    };
  
    this.closePlaylist = function () {
      this.$.playlistDialog.close();
    };
  
    this.doToast = function (text) {
      this.async(function () {
        var toast = this.$.toast;
        toast.text = text;
        toast.show();
      });
    };
  
    this.playAudio = function (artist, title, src, image, id) {
      var audio = this.$.audio,
        note = this.$.playNotify,
        time = new Date(),
        now = time.getTime(),
        url = this.url + '/rest/scrobble.view?u=' + this.user + '&p=' + this.pass + '&v=' + this.version + '&c=PolySonic&f=json&id=' + id + '&time=' + now;
      if (artist === '') {
        this.currentPlaying = title;
        note.title = title;
      } else {
        this.currentPlaying = artist + ' - ' + title;
        note.title = artist + ' - ' + title;
      }
      this.doXhr(url, 'json', function (e) {
        if (e.target.response['subsonic-response'].status === 'failed') {
          console.log('Last FM submission: ' + e.target.response['subsonic-response'].status);
          this.tracker.sendEvent('Last FM submission', 'Failed');
        }
      }.bind(this));
      audio.src = src;
      audio.play();
      note.icon = image;
      note.show();
      this.tracker.sendEvent('Audio', 'Playing');
    };

    this.playThis = function () {
      this.setFabColor(this.playlist[this.playing]);
      var url;
      if (this.playlist[this.playing].artist === '') {
        // is a podcast
        url = this.url + '/rest/stream.view?u=' + this.user + '&p=' + this.pass + '&v=' + this.version + '&c=PolySonic&format=raw&estimateContentLength=true&id=' + this.playlist[this.playing].id;
      } else {
        // normal trascoded file type
        url = this.url + '/rest/stream.view?u=' + this.user + '&p=' + this.pass + '&v=' + this.version + '&c=PolySonic&maxBitRate=' + this.bitRate + '&id=' + this.playlist[this.playing].id;
      }
      this.playAudio(this.playlist[this.playing].artist, this.playlist[this.playing].title, url, this.playlist[this.playing].cover, this.playlist[this.playing].id);
      if (this.playlist[this.playing].cover) {
        this.getImageForPlayer(this.playlist[this.playing].cover, function () {});
      } else {
        this.defaultPlayImage();
      }
    };
  
    this.playNext = function (next) {
      if (this.playlist[next]) {
        this.playing = next;
      } else {
        this.$.audio.pause();
        this.clearPlayer();
      }
    };
  
    this.nextTrack = function () {
      var next = this.playing + 1;
      this.playNext(next);
    };
  
    this.lastTrack = function () {
      var next = this.playing - 1;
      this.playNext(next);
    };
  
    this.toggleWall = function () {
      this.dataLoading = true;
      this.async(function () {
        var wall = this.$.wall;
        if (wall.listMode === 'cover') {
          wall.listMode = 'list';
          chrome.storage.sync.set({
            'listMode': 'list'
          });
        } else {
          wall.listMode = 'cover';
          chrome.storage.sync.set({
            'listMode': 'cover'
          });
        }
        this.tracker.sendEvent('ListMode Changed', wall.listMode);
      });
    };
  
    this.clearPlayer = function () {
      this.async(function () {
        this.page = 0;
        this.playlist = null;
        this.playlist = [];
        console.log('Playlist Clear');
      });
    };
  
    this.back2List = function () {
      this.async(function () {
        this.dataLoading = true;
        this.page = 0;
        this.async(function () {
          this.dataLoading = false;
        });
      });
    };
  
    this.nowPlaying = function () {
      this.async(function () {
        this.page = 1;
      });
    };
  
    this.playPause = function () {
      var audio = this.$.audio;
      if (!audio.paused) {
        audio.pause();
      } else {
        audio.play();
      }
    };
    
    this.reloadApp = function () {
      chrome.runtime.reload();
    };
  
    this.minimize = function () {
      chrome.app.window.current().minimize();
    };
  
    this.maximize = function () {
      var maximized = chrome.app.window.current().isMaximized(),
        button = this.$.max;
      if (maximized) {
        button.icon = 'check-box-outline-blank';
        chrome.app.window.current().restore();
      } else {
        button.icon = 'flip-to-back';
        chrome.app.window.current().maximize();
      }
    };
  
    this.close = function () {
      window.close();
    };
  
    this.progressClick = function (event) {
      var audio = this.$.audio,
        clicked = (event.x / window.innerWidth),
        sum = audio.duration - (audio.duration - (audio.duration * clicked)),
        bar = this.$.progress;
      bar.value = clicked * 100;
      audio.currentTime = sum;
    };
  
    /*jslint unparam: true*/
    this.selectAction = function (event, detail, sender) {
      var wall = this.$.wall;
      this.async(function () {
        this.closeDrawer(function () {
          this.async(function () {
            if (wall.sort === sender.attributes.i.value) {
              this.pageLimit = false;
              if (this.queryMethod === 'ID3') {
                wall.request = 'getAlbumList2';
              } else {
                wall.request = 'getAlbumList';
              }
              wall.post.type = sender.attributes.i.value;
              wall.refreshContent();
              wall.showing = this.listMode;
              wall.$.threshold.clearLower();
            }
            wall.sort = sender.attributes.i.value;
          });
        }.bind(this));
      });
    };
    /*jslint unparam: false*/
  
    this.getPodcast = function () {
      var wall = this.$.wall;
      this.async(function () {
        this.closeDrawer(function () {
          this.async(function () {
            wall.getPodcast();
          });
        }.bind(this));
      });
    };
  
    this.getStarred = function () {
      var wall = this.$.wall;
      this.async(function () {
        this.closeDrawer(function () {
          this.async(function () {
            wall.getStarred();
          });
        }.bind(this));
      });
    };
  
    this.getArtist = function () {
      var wall = this.$.wall;
      this.async(function () {
        this.closeDrawer(function () {
          this.async(function () {
            wall.getArtist();
          });
        }.bind(this));
      });
    };
  
    this.toggleVolume = function () {
      var dialog = this.$.volumeDialog;
      dialog.toggle();
    };
  
    this.showPlaylist = function () {
      var dialog = this.$.playlistDialog;
      dialog.toggle();
    };
  
    this.setFolder = function (event, detail, sender) {
      this.async(function () {
        var value = parseInt(sender.attributes.i.value, 10);
        this.folder = value;
        chrome.storage.sync.set({
          'mediaFolder': value
        });
      });
    };
  
    this.openPanel = function () {
      this.async(function () {
        var panel = this.$.panel;
        panel.openDrawer();
      });
    };
  
    this.gotoSettings = function () {
      this.closeDrawer(function () {
        this.async(function () {
          this.page = 2;
        });
      }.bind(this));
    };
  
    this.volUp = function () {
      if (this.volume < 100) {
        this.volume = this.volume + 10;
      }
    };
  
    this.volDown = function () {
      if (this.volume > 0) {
        this.volume = this.volume - 10;
      }
    };
  
    this.clearPlaylist = function () {
      this.async(function () {
        this.$.audio.pause();
        this.$.playlistDialog.close();
        this.page = 0;
        this.playlist = null;
        this.playlist = [];
      });
    };
  
    this.refreshPodcast = function (event, detail, sender) {
      this.async(function () {
        var animation = new CoreAnimation(),
          url;
        animation.duration = 1000;
        animation.iterations = 'Infinity';
        animation.keyframes = [
          {opacity: 1},
          {opacity: 0}
        ];
        animation.target = sender;
        animation.play();
        url = this.url + "/rest/refreshPodcasts.view?u=" + this.user + "&p=" + this.pass + "&f=json&v=" + this.version + "&c=PolySonic";
        this.doXhr(url, 'json', function (e) {
          if (e.target.response['subsonic-response'].status === 'ok') {
            animation.cancel();
            this.$.wall.refreshContent();
            this.doToast(chrome.i18n.getMessage("podcastCheck"));
          }
        }.bind(this));
      });
    };
  
    this.addChannel = function () {
      this.async(function () {
        if (!this.castURL) {
          this.doToast(this.urlError);
        }
        if (!this.invalidURL) {
          this.addingChannel = true;
          var url = this.url + "/rest/createPodcastChannel.view?u=" + this.user + "&p=" + this.pass + "&f=json&v=" + this.version + "&c=PolySonic&url=" + encodeURIComponent(this.castURL);
          this.doXhr(url, 'json', function (e) {
            if (e.target.response['subsonic-response'].status === 'ok') {
              this.addingChannel = false;
              this.$.addPodcast.close();
              this.$.wall.refreshContent();
              this.doToast(chrome.i18n.getMessage("channelAdded"));
              this.castURL = '';
            } else {
              this.doToast(chrome.i18n.getMessage("podcastError"));
            }
          }.bind(this));
        }
      });
    };
  
    this.doDelete = function (event, detail, sender) {
      this.$.wall.deleteChannel(sender.attributes.ident.value);
    };
    
    this.deleteEpisode = function (event, detail, sender) {
      this.$.wall.deleteEpisode(sender.attributes.ident.value);
    };
  
    this.getColor = function (image) {
      var colorThief = new ColorThief();
      return colorThief.getPalette(image, 4);
    };
  
    this.getContrast50  = function (hexcolor) {
      return (parseInt(hexcolor, 16) > 0xffffff / 2) ? 'black' : 'white';
    };
  
    this.componentToHex = function (c) {
      var hex = c.toString(16);
      return hex.length === 1 ? "0" + hex : hex;
    };
  
    this.rgbToHex = function (r, g, b) {
      return this.componentToHex(r) + this.componentToHex(g) + this.componentToHex(b);
    };
  
    this.dataLoading = false;
    this.loadListeners();
    this.loadData();
    this.sizePlayer();
    this.calculateStorageSize();

    chrome.commands.onCommand.addListener(function (command) {
      var audio = this.$.audio;
      if (command === "playPauseMediaKey") {
        this.playPause();
      } else if (!audio.paused && command === "nextTrackMediaKey") {
        this.nextTrack();
      } else if (!audio.paused && command === "lastTrackMediaKey") {
        this.lastTrack();
      } else if (!audio.paused && command === "MediaPlayPause") {
        this.playPause();
      }
    }.bind(this));
  
  });

}());
