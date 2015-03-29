/*global chrome, CryptoJS, console, window, document, XMLHttpRequest, setInterval, screen, analytics, Blob */
document.querySelector('#tmpl').addEventListener('template-bound', function () {
  'use strict';

  this.service = analytics.getService('PolySonic');

  this.tracker = this.service.getTracker('UA-50154238-6');  // Supply your GA Tracking ID.

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

  this.getImageForPlayer = function (url) {
    var art = this.$.coverArt,
      note = this.$.playNotify;

    art.style.backgroundImage = "url('" + url + "')";
    note.icon = url;
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
    {sort: 'newest', name: 'Newest'},
    {sort: 'frequent', name: 'Frequently Played'},
    {sort: 'alphabeticalByName', name: 'By Title'},
    {sort: 'alphabeticalByArtist', name: 'By Artist'},
    {sort: 'recent', name: 'Recently Played'}
  ];

  this.closeDrawer = function () {
    var panel = this.$.panel;
    panel.closeDrawer();
  };

  this.appScroller = function () {
    return this.$.headerPanel.scroller;
  };

  this.scrollerPos = 0;

  this.setScrollerPos = function () {
    var scrollbar = this.appScroller();
    this.scrollerPos = scrollbar.scrollTop;
  };

  /*jslint unparam: true*/
  this.fixScroller = function (event, detail, sender) {
    var scrollbar = this.appScroller();
    if (event.type === 'core-animated-pages-transition-end' && event.target.id === 'main' && this.scrollerPos !== 0 && this.page === 0) {
      scrollbar.scrollTop = this.scrollerPos;
    } else if (event.type === 'core-animated-pages-transition-prepare' && event.target.id === 'main' && scrollbar.scrollTop !== 0) {
      scrollbar.scrollTop = 0;
    }
  };
  /*jslint unparam: false*/

  this.openSearch = function () {
    this.closeDrawer();
    this.$.searchDialog.toggle();
  };

  this.xhrError = function (e) {
    console.log(e);
    this.doToast('Error connecting to Subsonic');
  }.bind(this);
  
  this.xhrProgress = function (e) {
    if (e.lengthComputable) {
      /*var precent = Math.round(e.loaded / e.total) * 100;
      console.log(precent);*/
    }
  };

  this.doXhr = function (url, dataType, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.responseType = dataType;
    xhr.onload = callback;
    xhr.onerror = this.xhrError;
    xhr.onprogress = this.xhrProgress;
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
          }
          this.allowAnalistics = function () {
            config.setTrackingPermitted(true);
            chrome.storage.sync.set({
              'analistics': true
            });
          };

          this.disAllowAnalistics = function () {
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
      this.doToast('No Query to Search');
    }
  };

  this.checkForImage = function (id, callback) {
    var transaction = this.db.transaction(["albumInfo"], "readwrite"),
      request = transaction.objectStore("albumInfo").count(id);
    request.onsuccess = callback;
    request.onerror = this.dbErrorHandler;
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
    navigator.webkitTemporaryStorage.queryUsageAndQuota(
    function(used, remaining) {
      var usedQuota = Math.round(10 * (((used / 1000) / 1000))) / 10,
          remainingQuota = Math.round(10 * ((remaining / 1000) / 1000)) / 10,
          bytes = 'MB';
      if (remainingQuota > 1000) {
        remainingQuota = Math.round(10 * (((remaining / 1000) / 1000) / 1000)) / 10;
        bytes = 'GB';
      }
      this.storageQuota = "Disk Used: " + usedQuota  + " MB, Disk Remaining: " + remainingQuota + " " + bytes;
    }.bind(this), function(e) {
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

  this.shuffleOptions = function () {
    var url = this.url + '/rest/getGenres.view?u=' + this.user + '&p=' + this.pass + '&v=' + this.version + '&c=PolySonic&f=json';
    this.doXhr(url, 'json', function (e) {
      this.genres = e.target.response['subsonic-response'].genres.genre;
      this.$.shuffleOptions.open();
      this.closeDrawer();
    }.bind(this));
  };

  this.shufflePlay = function () {
    this.shuffleLoading = true;
    this.playlist = null;
    this.playlist = [];
    var url,
      imgURL,
      artId,
      obj,
      mins,
      seconds,
      timeString;
    if (!this.startYearInvalid && !this.endYearInvalid) {
      this.$.audio.pause();
      if (this.endingYear && this.startingYear && this.genreFilter) {
        url = this.url + '/rest/getRandomSongs.view?u=' + this.user + '&p=' + this.pass + '&v=' + this.version + '&c=PolySonic&f=json&size=50&genre=' + encodeURIComponent(this.genreFilter) + '&fromYear=' + this.startingYear + '&toYear=' + this.endingYear;
      } else if (this.endingYear && this.startingYear) {
        url = this.url + '/rest/getRandomSongs.view?u=' + this.user + '&p=' + this.pass + '&v=' + this.version + '&c=PolySonic&f=json&size=50&fromYear=' + this.startingYear + '&toYear=' + this.endingYear;
      } else if (this.endingYear && this.genreFilter) {
        url = this.url + '/rest/getRandomSongs.view?u=' + this.user + '&p=' + this.pass + '&v=' + this.version + '&c=PolySonic&f=json&size=50&genre=' + encodeURIComponent(this.genreFilter) + '&toYear=' + this.endingYear;
      } else if (this.startingYear && this.genreFilter) {
        url = this.url + '/rest/getRandomSongs.view?u=' + this.user + '&p=' + this.pass + '&v=' + this.version + '&c=PolySonic&f=json&size=50&genre=' + encodeURIComponent(this.genreFilter) + '&fromYear=' + this.startingYear;
      } else if (this.genreFilter) {
        url = this.url + '/rest/getRandomSongs.view?u=' + this.user + '&p=' + this.pass + '&v=' + this.version + '&c=PolySonic&f=json&size=50&genre=' + encodeURIComponent(this.genreFilter);
      } else if (this.startingYear) {
        url = this.url + '/rest/getRandomSongs.view?u=' + this.user + '&p=' + this.pass + '&v=' + this.version + '&c=PolySonic&f=json&size=50&fromYear=' + this.startingYear;
      } else if (this.endingYear) {
        url = this.url + '/rest/getRandomSongs.view?u=' + this.user + '&p=' + this.pass + '&v=' + this.version + '&c=PolySonic&f=json&size=50&toYear=' + this.endingYear;
      } else {
        url = this.url + '/rest/getRandomSongs.view?u=' + this.user + '&p=' + this.pass + '&v=' + this.version + '&c=PolySonic&f=json&size=50';
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
            this.fixCoverArtForShuffle(obj);
          }.bind(this));
        } else {
          this.doToast('No Matches');
          this.shuffleLoading = false;
        }
      }.bind(this));
    } else {
      this.shuffleLoading = false;
      this.doToast("Invalid Entry");
    }
  };

  this.fixCoverArtForShuffle = function (obj) {
    var img = this.url + '/rest/getCoverArt.view?u=' + this.user + '&p=' + this.pass + '&v=' + this.version + '&c=PolySonic&f=json&id=' + obj.cover;
    this.checkForImage(obj.cover, function(e) {
      if (e.target.result === 0) {
        this.getImageFile(img, obj.cover, function (ev) {
          var raw = ev.target.result,
            imgURL = window.URL.createObjectURL(raw);
          obj.cover = imgURL;
          this.playlist.push(obj);
          this.doShufflePlayback();
        }.bind(this));
      } else {
        this.getDbItem(obj.cover, function (ev) {
          var raw = ev.target.result,
            imgURL = window.URL.createObjectURL(raw);
          obj.cover = imgURL;
          this.playlist.push(obj);
          this.doShufflePlayback();
        }.bind(this));
      }
    }.bind(this));
  };

  this.doShufflePlayback = function () {
    if (this.$.audio.paused) {
      var art = this.url + '/rest/stream.view?u=' + this.user + '&p=' + this.pass + '&v=' + this.version + '&c=PolySonic&maxBitRate=' + this.bitRate + '&id=' + this.playlist[0].id;
      this.playing = 0;
      this.playAudio(this.playlist[0].artist, this.playlist[0].title, art, this.playlist[0].cover);
      this.getImageForPlayer(this.playlist[0].cover);
      this.page = 1;
      this.$.shuffleOptions.close();
      this.shuffleLoading = false;
    }
  };

  this.doAction = function () {
    var scroller = this.appScroller(),
      wall = this.$.wall;

    if (this.page === 0 && scroller.scrollTop !== 0 && wall.showing !== 'podcast') {
      scroller.scrollTop = 0;
    }
    if (this.page === 0 && wall.showing === 'podcast') {
      this.$.addPodcast.open();
    }
    if (this.page === 1) {
      this.showPlaylist();
    }
    if (this.page === 3) {
      this.$.details.playAlbum();
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
      buttons = document.querySelectorAll('.max');

    if (maximized) {
      Array.prototype.forEach.call(buttons, function (e) {
        e.icon = 'flip-to-back';
      });
    } else {
      Array.prototype.forEach.call(buttons, function (e) {
        e.icon = 'check-box-outline-blank';
      });
    }

    this.position = scroller.scrollTop;

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

    window.onresize = this.sizePlayer.bind(this);

    audio.onended = this.nextTrack.bind(this);

    audio.onerror = function (e) {
      this.tracker.sendEvent('Audio Playback Error', e.target);
    }.bind(this);
  };

  this.loadData = function () {
    chrome.storage.sync.get(function (result) {
      //console.log(result);
      if (result.url === undefined) {
        this.$.firstRun.open();
      } else {
        this.url = result.url;
      }
      this.user = result.user;
      this.pass = result.pass;
      this.version = result.version;
      if (result.version !== undefined) {
        this.tracker.sendEvent('API Version', result.version);
      }
      if (result.listMode === undefined) {
        chrome.storage.sync.set({
          'listMode': 'cover'
        });
        this.listMode = 'cover';
        this.view = 'view-stream';
      } else {
        this.tracker.sendEvent('ListMode', result.listMode);
        this.listMode = result.listMode;
        if (result.listMode === 'cover') {
          this.view = 'view-stream';
        } else {
          this.view = 'view-module';
        }
      }
      if (result.bitRate === undefined) {
        chrome.storage.sync.set({
          'bitRate': '320'
        });
        this.bitRate = '320';
      } else {
        this.bitRate = result.bitRate;
        this.tracker.sendEvent('Playback Bitrate', result.bitRate);
      }
      if (result.sort === undefined) {
        this.selected = '';
      }
      if (result.querySize === undefined) {
        chrome.storage.sync.set({
          'querySize': 20
        });
        this.querySize = 20;
      } else {
        this.querySize = result.querySize;
      }
      if (result.volume !== undefined) {
        this.volume = result.volume;
      }
      if (result.queryMethod !== undefined) {
        this.queryMethod = result.queryMethod;
      } else {
        this.queryMethod = 'ID3';
      }
      if (result.mediaFolder !== undefined && result.mediaFolder !== 0) {
        this.folder = result.mediaFolder;
      }
      if (this.url && this.user && this.pass && this.version) {
        var url = this.url + '/rest/ping.view?u=' + this.user + '&p=' + this.pass + '&v=' + this.version + '&c=PolySonic&f=json';
        this.doXhr(url, 'json', function (e) {
          if (e.target.status === 200) {
            var response = e.target.response['subsonic-response'];
            if (response.status === 'ok') {
              console.log('Connected to Subconic loading data');
              this.doXhr(this.url + "/rest/getMusicFolders.view?u=" + this.user + "&p=" + this.pass + "&f=json&v=" + this.version + "&c=PolySonic", 'json', function (e) {
                this.mediaFolders = e.target.response['subsonic-response'].musicFolders.musicFolder;
                if (!e.target.response['subsonic-response'].musicFolders.musicFolder[1]) {
                  this.$.sortBox.style.display = 'none';
                }
              }.bind(this));
              this.$.wall.doAjax();
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
    var toast = this.$.toast;
    toast.text = text;
    toast.show();
  };

  this.playAudio = function (artist, title, src, image) {
    var audio = this.$.audio,
      note = this.$.playNotify;
    if (artist === '') {
      this.currentPlaying = title;
      note.title = title;
    } else {
      this.currentPlaying = artist + ' - ' + title;
      note.title = artist + ' - ' + title;
    }
    audio.src = src;
    audio.play();
    note.icon = image;
    note.show();
    this.tracker.sendEvent('Audio', 'Started Playing');
  };

  /*jslint unparam: true*/
  this.playThis = function (event, detail, sender) {
    var url;
    if (sender.attributes.artist.value === '') {
      // is a podcast
      url = this.url + '/rest/stream.view?u=' + this.user + '&p=' + this.pass + '&v=' + this.version + '&c=PolySonic&format=raw&estimateContentLength=true&id=' + sender.attributes.ident.value;
    } else {
      // normal trascoded file type
      url = this.url + '/rest/stream.view?u=' + this.user + '&p=' + this.pass + '&v=' + this.version + '&c=PolySonic&maxBitRate=' + this.bitRate + '&id=' + sender.attributes.ident.value;
    }
    this.playAudio(sender.attributes.artist.value, sender.attributes.title.value, url, sender.attributes.cover.value);
    if (sender.attributes.cover.value) {
      this.getImageForPlayer(sender.attributes.cover.value);
    } else {
      this.defaultPlayImage();
    }
  };
  /*jslint unparam: false*/

  this.playNext = function (next) {
    var url;
    if (this.playlist[next]) {
      if (this.playlist[next].artist === '') {
        url = this.url + '/rest/stream.view?u=' + this.user + '&p=' + this.pass + '&v=' + this.version + '&c=PolySonic&format=raw&estimateContentLength=true&id=' + this.playlist[next].id;
      } else {
        url = this.url + '/rest/stream.view?u=' + this.user + '&p=' + this.pass + '&v=' + this.version + '&c=PolySonic&maxBitRate=' + this.bitRate + '&id=' + this.playlist[next].id;
      }
      this.playAudio(this.playlist[next].artist, this.playlist[next].title, url, this.playlist[next].cover);
      this.playing = next;
      if (this.playlist[next].cover) {
        this.getImageForPlayer(this.playlist[next].cover);
      } else {
        this.defaultPlayImage();
      }
    } else {
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
    var wall = this.$.wall;
    if (wall.listMode === 'cover') {
      wall.listMode = 'list';
      this.view = 'view-module';
      chrome.storage.sync.set({
        'listMode': 'list'
      });
    } else {
      wall.listMode = 'cover';
      this.view = 'view-stream';
      chrome.storage.sync.set({
        'listMode': 'cover'
      });
    }
    this.tracker.sendEvent('ListMode Changed', wall.listMode);
  };

  this.clearPlayer = function () {
    console.log('Playlist Cleared');
    this.page = 0;
    this.src = '';
    this.playlist = null;
    this.playlist = [];
  };

  this.back2List = function () {
    this.page = 0;
    this.$.wall.listModeChanged();
  };

  this.nowPlaying = function () {
    this.setScrollerPos();
    this.page = 1;
  };

  this.playPause = function () {
    var audio = this.$.audio;
    if (!audio.paused) {
      audio.pause();
    } else {
      audio.play();
    }
  };

  this.minimize = function () {
    chrome.app.window.current().minimize();
  };

  this.maximize = function () {
    var maximized = chrome.app.window.current().isMaximized(),
      buttons = document.querySelectorAll('.max');
    if (maximized) {
      Array.prototype.forEach.call(buttons, function (e) {
        e.icon = 'check-box-outline-blank';
      });
      chrome.app.window.current().restore();
    } else {
      Array.prototype.forEach.call(buttons, function (e) {
        e.icon = 'flip-to-back';
      });
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
    if (wall.sort === sender.attributes.i.value) {
      this.pageLimit = false;
      if (this.queryMethod === 'ID3') {
        wall.request = 'getAlbumList2';
      } else {
        wall.request = 'getAlbumList';
      }
      wall.post.type = sender.attributes.i.value;
      wall.refreshContent();
      wall.showing = 'cover';
      wall.$.threshold.clearLower();
    }
    wall.sort = sender.attributes.i.value;
    this.closeDrawer();
    this.tracker.sendEvent('Sort By', sender.attributes.i.value);
  };
  /*jslint unparam: false*/

  this.getPodcast = function () {
    var wall = this.$.wall;
    this.closeDrawer();
    wall.getPodcast();
    this.tracker.sendEvent('Sort By', 'Podcast');
  };

  this.getStarred = function () {
    var wall = this.$.wall;
    this.closeDrawer();
    wall.getStarred();
    this.tracker.sendEvent('Sort By', 'Favorites');
  };

  this.getArtist = function () {
    var wall = this.$.wall;
    this.closeDrawer();
    wall.getArtist();
    this.tracker.sendEvent('Sort By', 'Artist');
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
    var value = parseInt(sender.attributes.i.value);
    this.folder = value;
    chrome.storage.sync.set({
      'mediaFolder': value
    });
  };

  this.openPanel = function () {
    var panel = this.$.panel;
    panel.openDrawer();
  };

  this.gotoSettings = function () {
    this.page = 2;
    this.closeDrawer();
  };

  this.volUp = function () {
    if (this.volume < 100) {
      this.volume = this.volume + 10;
    }
    return this.volume;
  };

  this.volDown = function () {
    if (this.volume > 0) {
      this.volume = this.volume - 10;
    }
    return this.volume;
  };
  
  this.artistDetails = function (event, detail, sender) {
    var artist = document.getElementById("aDetails");
    this.setScrollerPos();
    artist.artistId = sender.attributes.i.value;
    artist.queryData();
    this.$.searchDialog.close();
    this.page = 4;
  };

  this.clearPlaylist = function () {
    this.$.audio.pause();
    this.$.audio.src = '';
    this.$.playlistDialog.close();
    this.page = 0;
    this.playlist = null;
    this.playlist = [];
  };

  this.refreshPodcast = function (event, detail, sender) {
    var animation = new CoreAnimation();
    animation.duration = 1000;
    animation.iterations = 'Infinity';
    animation.keyframes = [
      {opacity: 1},
      {opacity: 0}
    ];
    animation.target = sender;
    animation.play();
    var url = this.url + "/rest/refreshPodcasts.view?u=" + this.user + "&p=" + this.pass + "&f=json&v=" + this.version + "&c=PolySonic";
    this.doXhr(url, 'json', function (e) {
      if (e.target.response['subsonic-response'].status === 'ok') {
        animation.cancel();
        this.$.wall.refreshContent();
        this.doToast('Checking for new Episodes');
      }
    }.bind(this));
  };
  
  this.addChannel = function () {
    if (!this.invalidURL) {
      this.addingChannel = true;
      var url = this.url + "/rest/createPodcastChannel.view?u=" + this.user + "&p=" + this.pass + "&f=json&v=" + this.version + "&c=PolySonic&url=" + encodeURIComponent(this.castURL);
      this.doXhr(url, 'json', function (e) {
        if (e.target.response['subsonic-response'].status === 'ok') {
          this.addingChannel = false;
          this.$.addPodcast.close();
          this.$.wall.refreshContent();
          this.doToast('Channel Added');
          this.castURL = '';
        }
      }.bind(this));
    }
  };

  this.doDelete = function (event, detail, sender) {
    this.$.wall.deleteChannel(sender.attributes.ident.value);
  };
  
  this.deleteEpisode = function (event, detail, sender) {
    this.$.wall.deleteEpisode(sender.attributes.ident.value);
  };
  
  this.checkForImage = function (id, callback) {
    var transaction = this.db.transaction(["albumInfo"], "readwrite"),
      request = transaction.objectStore("albumInfo").count(id);
    request.onsuccess = callback;
    request.onerror = this.dbErrorHandler;
  };

  this.loadListeners();
  this.loadData();
  this.sizePlayer();
  this.calculateStorageSize();

  setInterval(function () {
    var audio = this.$.audio,
      button = this.$.avIcon,
      progress = Math.round((audio.currentTime / audio.duration * 100) * 100) / 100,
      currentMins = Math.floor(audio.currentTime / 60),
      currentSecs = Math.round(audio.currentTime - (currentMins * 60)),
      totalMins = Math.floor(audio.duration / 60),
      totalSecs = Math.round(audio.duration - (totalMins * 60)),
      buffer;
      
    if (audio.duration) {
      buffer = (audio.buffered.end(0) / audio.duration) * 100;
      this.buffer = buffer;
    }

    if (!audio.paused) {
      button.icon = "av:pause";
      this.isNowPlaying = true;
      if (!audio.duration) {
        this.playTime = currentMins + ':' + ('0' + currentSecs).slice(-2) + ' / ?:??';
        this.progress = 0;
      } else {
        this.playTime = currentMins + ':' + ('0' + currentSecs).slice(-2) + ' / ' + totalMins + ':' + ('0' + totalSecs).slice(-2);
        this.progress = progress;
      }
    } else {
      this.isNowPlaying = false;
      button.icon = "av:play-arrow";
    }
  }.bind(this), 200);

  chrome.commands.onCommand.addListener(function (command) {
    var audio =this.$.audio;
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
