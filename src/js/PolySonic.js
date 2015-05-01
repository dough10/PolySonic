/*global chrome, CryptoJS, console, window, document, XMLHttpRequest, setInterval, screen, analytics, Blob, navigator, Image, CoreAnimation, ColorThief, setTimeout */
(function () {
  'use strict';
  var app = document.querySelector('#tmpl');
  app.addEventListener('template-bound', function () {
    this.loadData();
  });

  /*
    begin analistics on window load
  */
  window.onload = function () {
    app.service = analytics.getService('PolySonic');
    app.tracker = app.service.getTracker('UA-50154238-6');  // Supply your GA Tracking ID.
  };

  /*
    locale settings
  */
  app.appName = chrome.i18n.getMessage("appName");
  app.appDesc = chrome.i18n.getMessage("appDesc");
  app.folderSelector = chrome.i18n.getMessage("folderSelector");
  app.shuffleButton = chrome.i18n.getMessage("shuffleButton");
  app.artistButton = chrome.i18n.getMessage("artistButton");
  app.podcastButton = chrome.i18n.getMessage("podcastButton");
  app.favoritesButton = chrome.i18n.getMessage("favoritesButton");
  app.searchButton = chrome.i18n.getMessage("searchButton");
  app.settingsButton = chrome.i18n.getMessage("settingsButton");
  app.nowPlayingLabel = chrome.i18n.getMessage("nowPlayingLabel");
  app.folderSelectorLabel = chrome.i18n.getMessage("folderSelectorLabel");
  app.clearQueue = chrome.i18n.getMessage("clearQueue");
  app.volumeLabel = chrome.i18n.getMessage("volumeLabel");
  app.analistics = chrome.i18n.getMessage("analistics");
  app.accept = chrome.i18n.getMessage("accept");
  app.decline = chrome.i18n.getMessage("decline");
  app.shuffleOptionsLabel = chrome.i18n.getMessage("shuffleOptionsLabel");
  app.optional = chrome.i18n.getMessage("optional");
  app.artistLabel = chrome.i18n.getMessage("artistLabel");
  app.albumLabel = chrome.i18n.getMessage("albumLabel");
  app.genreLabel = chrome.i18n.getMessage("genreLabel");
  app.songReturn = chrome.i18n.getMessage("songReturn");
  app.playButton = chrome.i18n.getMessage("playButton");
  app.yearError = chrome.i18n.getMessage("yearError");
  app.releasedAfter = chrome.i18n.getMessage("releasedAfter");
  app.releasedBefore = chrome.i18n.getMessage("releasedBefore");
  app.submitButton = chrome.i18n.getMessage("submitButton");
  app.deleteConfirm = chrome.i18n.getMessage("deleteConfirm");
  app.noResults = chrome.i18n.getMessage("noResults");
  app.urlError = chrome.i18n.getMessage("urlError");
  app.podcastSubmissionLabel = chrome.i18n.getMessage("podcastSubmissionLabel");
  app.diskUsed = chrome.i18n.getMessage("diskused");
  app.diskRemaining = chrome.i18n.getMessage("diskRemaining");
  app.playlistsButton = chrome.i18n.getMessage("playlistsButton");
  app.createPlaylistLabel = chrome.i18n.getMessage("createPlaylistLabel");
  app.playlistLabel = chrome.i18n.getMessage("playlistLabel");
  app.reloadAppLabel = chrome.i18n.getMessage("reloadApp");
  app.settingsDeleted = chrome.i18n.getMessage("settingsDeleted");
  app.recommendReload = chrome.i18n.getMessage("recommendReload");


  /*
    query size for shuffle options
  */
  app.shuffleSizes = [
    20,
    40,
    50,
    75,
    100,
    200
  ];


  /*
    sort catagoies
  */
  app.sortTypes = [
    {sort: 'newest', name: chrome.i18n.getMessage("newButton")},
    {sort: 'alphabeticalByArtist', name: chrome.i18n.getMessage("byArtistButton")},
    {sort: 'alphabeticalByName', name: chrome.i18n.getMessage("titleButton")},
    {sort: 'frequent', name: chrome.i18n.getMessage("frequentButton")},
    {sort: 'recent', name: chrome.i18n.getMessage("recentButton")}
  ];


  /*
    indexeddb
  */
  app.indexedDB = window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB || window.OIndexedDB || window.msIndexedDB;

  app.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.OIDBTransaction || window.msIDBTransaction;

  app.dbVersion = 1.0;

  app.request = app.indexedDB.open("albumInfo", app.dbVersion);

  app.request.onerror = function () {
    console.log("Error creating/accessing IndexedDB database");
  };

  app.request.onsuccess = function () {
    console.log("Success creating/accessing IndexedDB database");
    app.db = app.request.result;

    // Interim solution for Google Chrome to create an objectStore. Will be deprecated
    if (app.db.setVersion) {
      if (app.db.version !== app.dbVersion) {
        var setVersion = app.db.setVersion(this.dbVersion);
        setVersion.onsuccess = function () {
          app.createObjectStore(this.db);
        };
      }
    }
  };

  app.request.onupgradeneeded = function (event) {
    app.createObjectStore(event.target.result);
  };

  app.createObjectStore = function (dataBase) {
    console.log("Creating objectStore");
    dataBase.createObjectStore("albumInfo");
  };

  app.dbErrorHandler = function (e) {
    console.error(e);
  };

  /* pull image from server */
  app.getImageFile = function (url, id, callback) {
    app.doXhr(url, 'blob', function (e) {
      var blob = new Blob([e.target.response], {type: 'image/jpeg'});
      app.putInDb(blob, id, callback);
      console.log('Image Added to indexedDB ' + id);
    });
  };

  app.putInDb = function (data, id, callback) {
    var transaction = app.db.transaction(["albumInfo"], "readwrite");
    if (id) {
      transaction.objectStore("albumInfo").put(data, id);
      transaction.objectStore("albumInfo").get(id).onsuccess = callback;
    }
  };

  app.calculateStorageSize = function () {
    navigator.webkitTemporaryStorage.queryUsageAndQuota(function (used, remaining) {
      var usedQuota = Math.round(10 * (((used / 1000) / 1000))) / 10,
        remainingQuota = Math.round(10 * ((remaining / 1000) / 1000)) / 10,
        bytes = 'MB';
      if (remainingQuota > 1000) {
        remainingQuota = Math.round(10 * (((remaining / 1000) / 1000) / 1000)) / 10;
        bytes = 'GB';
      }
      app.storageQuota = app.diskUsed + ": " + usedQuota  + " MB, " + app.diskRemaining + ": " + remainingQuota + " " + bytes;
    }, function (e) {
      console.log('Error', e);
    });
  };

  app.getDbItem = function (id, callback) {
    if (id) {
      var transaction = app.db.transaction(["albumInfo"], "readwrite"),
        request = transaction.objectStore("albumInfo").get(id);
      request.onsuccess = callback;
      request.onerror = app.dbErrorHandler;
    }
  };


  /*
    app xhr commands
  */
  app.xhrError = function (e) {
    app.dataLoading = false;
    console.log(e);
    app.doToast(chrome.i18n.getMessage("connectionError"));
  };

  app.doXhr = function (url, dataType, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.responseType = dataType;
    xhr.onload = callback;
    xhr.onerror = app.xhrError;
    xhr.send();
  };



  app.playlist = [];

  app.page = app.page || 0;

  app.pageLimit = false;

  /*
    app window commands
  */
  app.reloadApp = function () {
    chrome.runtime.reload();
  };

  app.minimize = function () {
    chrome.app.window.current().minimize();
  };

  app.maximize = function () {
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

  app.close = function () {
    window.close();
  };

  app.closeDrawer = function (callback) {
    var panel = app.$.panel;
    panel.closeDrawer();
    callback();
  };

  app.openPanel = function () {
    var panel = app.$.panel;
    panel.openDrawer();
  };

  app.appScroller = function () {
    return app.$.headerPanel.scroller;
  };

  app.doToast = function (text) {
    var toast = app.$.toast;
    toast.text = text;
    toast.show();
  };


  /*
    color thief functions
  */
  app.getColor = function (image) {
    var colorThief = new ColorThief();
    return colorThief.getPalette(image, 4);
  };

  app.getContrast50  = function (hexcolor) {
    return (parseInt(hexcolor, 16) > 0xffffff / 2) ? 'black' : 'white';
  };

  app.componentToHex = function (c) {
    var hex = c.toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };

  app.rgbToHex = function (r, g, b) {
    return app.componentToHex(r) + app.componentToHex(g) + app.componentToHex(b);
  };

  /*
    colorArray[0] fab color

    colorArray[1] fab contrasting color

    colorArray[2] progress bar buffering color

    colorArray[3] progress bar background
  */
  app.colorThiefHandler = function (imgURL, artId, callback) {
    var imgElement = new Image();
    imgElement.src = imgURL;
    imgElement.onload = function () {
      var color = app.getColor(imgElement),
        colorArray = [],
        r = color[1][0],
        g = color[1][1],
        b = color[1][2],
        hex = app.rgbToHex(r, g, b);
      colorArray[0] = 'rgb(' + r + ',' + g + ',' + b + ');';
      colorArray[1] = app.getContrast50(hex);
      colorArray[2] = 'rgba(' + r + ',' + g + ',' + b + ',0.5);';
      if (colorArray[1] !== 'white') {
        colorArray[3] = '#444444';
      } else {
        colorArray[3] = '#c8c8c8';
      }
      app.putInDb(colorArray, artId + '-palette', function () {
        callback(colorArray);
        console.log('Color palette saved ' + artId);
      });
    };
  };


  /*
    play functions
  */
  app.playAudio = function (artist, title, src, image, id) {
    var audio = app.$.audio,
      note = app.$.playNotify,
      time = new Date(),
      now = time.getTime(),
      url;
    if (artist === '') {
      app.currentPlaying = title;
      note.title = title;
    } else {
      app.currentPlaying = artist + ' - ' + title;
      note.title = artist + ' - ' + title;
    }
    if (app.activeUser.scrobblingEnabled) {
      url = app.url + '/rest/scrobble.view?u=' + app.user + '&p=' + app.pass + '&v=' + app.version + '&c=PolySonic&f=json&id=' + id + '&time=' + now;
      app.doXhr(url, 'json', function (e) {
        if (e.target.response['subsonic-response'].status === 'failed') {
          console.log('Last FM submission: ' + e.target.response['subsonic-response'].status);
          app.tracker.sendEvent('Last FM submission', 'Failed');
        }
      });
    }
    audio.src = src;
    audio.play();
    note.icon = image;
    note.show();
    app.tracker.sendEvent('Audio', 'Playing');
  };

  app.playNext = function (next) {
    var audio = app.$.audio;
    if (app.playlist[next]) {
      app.playing = next;
    } else {
      audio.pause();
      app.clearPlaylist();
    }
  };

  app.nextTrack = function () {
    var next = app.playing + 1;
    app.playNext(next);
  };

  app.lastTrack = function () {
    var next = app.playing - 1;
    app.playNext(next);
  };

  app.playThis = function () {
    app.setFabColor(this.playlist[this.playing]);
    var url;
    if (app.playlist[app.playing].artist === '') {
      // is a podcast
      url = this.url + '/rest/stream.view?u=' + app.user + '&p=' + app.pass + '&v=' + app.version + '&c=PolySonic&format=raw&estimateContentLength=true&id=' + app.playlist[this.playing].id;
    } else {
      // normal trascoded file type
      url = this.url + '/rest/stream.view?u=' + app.user + '&p=' + app.pass + '&v=' + app.version + '&c=PolySonic&maxBitRate=' + app.bitRate + '&id=' + app.playlist[this.playing].id;
    }
    app.playAudio(app.playlist[app.playing].artist, app.playlist[app.playing].title, url, app.playlist[app.playing].cover, app.playlist[app.playing].id);
    if (app.playlist[app.playing].cover) {
      app.getImageForPlayer(app.playlist[app.playing].cover, function () {});
    } else {
      app.defaultPlayImage();
    }
  };

  app.playPause = function () {
    var audio = app.$.audio;
    if (!audio.paused) {
      audio.pause();
    } else {
      audio.play();
    }
  };

  app.playPlaylist = function (event, detail, sender) {
    var url = app.url + '/rest/getPlaylist.view?u=' + app.user + '&p=' + app.pass + '&v=' + app.version + '&c=PolySonic&f=json&id=' + sender.attributes.ident.value,
      tracks,
      mins,
      seconds,
      artId,
      obj,
      timeString,
      i = 0;
    app.dataLoading = true;
    app.playlist = null;
    app.playlist = [];
    app.$.audio.pause();
    app.doXhr(url, 'json', function (e) {
      tracks = e.target.response['subsonic-response'].playlist.entry;
      Array.prototype.forEach.call(tracks, function (item) {
        mins = Math.floor(item.duration / 60);
        seconds = Math.floor(item.duration - (mins * 60));
        timeString = mins + ':' + ('0' + seconds).slice(-2);
        artId = "al-" + item.albumId;
        obj = {id: item.id, artist: item.artist, title: item.title, duration: timeString, cover: artId};
        app.fixCoverArtForShuffle(obj, function () {
          i = i + 1;
          if (i === tracks.length) {
            app.doShufflePlayback();
            app.dataLoading = false;
            app.closePlaylists();
          }
        });
      });
    });
  };

  app.shufflePlay = function () {
    app.dataLoading = true;
    app.shuffleLoading = true;
    app.playlist = null;
    app.playlist = [];
    var url,
      imgURL,
      artId,
      obj,
      mins,
      seconds,
      timeString,
      i = 0;

    if (!app.startYearInvalid && !app.endYearInvalid) {
      app.$.audio.pause();
      if (app.endingYear && app.startingYear && app.genreFilter) {
        url = app.url + '/rest/getRandomSongs.view?u=' + app.user + '&p=' + app.pass + '&v=' + app.version + '&c=PolySonic&f=json&size=' + app.shuffleSize + '&genre=' + encodeURIComponent(app.genreFilter) + '&fromYear=' + app.startingYear + '&toYear=' + app.endingYear;
      } else if (app.endingYear && app.startingYear) {
        url = app.url + '/rest/getRandomSongs.view?u=' + app.user + '&p=' + app.pass + '&v=' + app.version + '&c=PolySonic&f=json&size=' + app.shuffleSize + '&fromYear=' + app.startingYear + '&toYear=' + app.endingYear;
      } else if (app.endingYear && app.genreFilter) {
        url = app.url + '/rest/getRandomSongs.view?u=' + app.user + '&p=' + app.pass + '&v=' + app.version + '&c=PolySonic&f=json&size=' + app.shuffleSize + '&genre=' + encodeURIComponent(app.genreFilter) + '&toYear=' + app.endingYear;
      } else if (app.startingYear && app.genreFilter) {
        url = app.url + '/rest/getRandomSongs.view?u=' + app.user + '&p=' + app.pass + '&v=' + app.version + '&c=PolySonic&f=json&size=' + app.shuffleSize + '&genre=' + encodeURIComponent(app.genreFilter) + '&fromYear=' + app.startingYear;
      } else if (app.genreFilter) {
        url = app.url + '/rest/getRandomSongs.view?u=' + app.user + '&p=' + app.pass + '&v=' + app.version + '&c=PolySonic&f=json&size=' + app.shuffleSize + '&genre=' + encodeURIComponent(app.genreFilter);
      } else if (app.startingYear) {
        url = app.url + '/rest/getRandomSongs.view?u=' + app.user + '&p=' + app.pass + '&v=' + app.version + '&c=PolySonic&f=json&size=' + app.shuffleSize + '&fromYear=' + app.startingYear;
      } else if (app.endingYear) {
        url = app.url + '/rest/getRandomSongs.view?u=' + app.user + '&p=' + app.pass + '&v=' + app.version + '&c=PolySonic&f=json&size=' + app.shuffleSize + '&toYear=' + app.endingYear;
      } else {
        url = app.url + '/rest/getRandomSongs.view?u=' + app.user + '&p=' + app.pass + '&v=' + app.version + '&c=PolySonic&f=json&size=' + app.shuffleSize;
      }
      app.doXhr(url, 'json', function (event) {
        var data = event.target.response['subsonic-response'];
        if (data.randomSongs.song) {
          Array.prototype.forEach.call(data.randomSongs.song, function (item) {
            mins = Math.floor(item.duration / 60);
            seconds = Math.floor(item.duration - (mins * 60));
            timeString = mins + ':' + ('0' + seconds).slice(-2);
            artId = "al-" + item.albumId;
            obj = {id: item.id, artist: item.artist, title: item.title, duration: timeString, cover: artId};
            app.fixCoverArtForShuffle(obj, function () {
              i = i + 1;
              if (i === data.randomSongs.song.length) {
                app.doShufflePlayback();
                app.dataLoading = false;
              }
            });
          });
        } else {
          app.doToast(chrome.i18n.getMessage("noMatch"));
          app.shuffleLoading = false;
        }
      });
    } else {
      app.shuffleLoading = false;
      app.doToast(chrome.i18n.getMessage("invalidEntry"));
    }
  };

  app.doShufflePlayback = function () {
    if (app.$.audio.paused) {
      var art = app.url + '/rest/stream.view?u=' + app.user + '&p=' + app.pass + '&v=' + app.version + '&c=PolySonic&maxBitRate=' + app.bitRate + '&id=' + app.playlist[0].id;
      app.playing = 0;
      app.playAudio(app.playlist[0].artist, app.playlist[0].title, art, app.playlist[0].cover, app.playlist[0].id);
      app.getImageForPlayer(app.playlist[0].cover, function () {
        app.page = 1;
        app.setFabColor(app.playlist[0]);
        app.$.shuffleOptions.close();
        app.shuffleLoading = false;
      });
    }
  };

  /*
    clear playlist
  */
  app.clearPlaylist = function () {
    app.$.audio.pause();
    app.$.playlistDialog.close();
    app.page = 0;
    app.playlist = null;
    app.playlist = [];
  };


  /*
    volume controls
  */
  app.toggleVolume = function () {
    var dialog = app.$.volumeDialog;
    dialog.open();
  };

  app.closeVolume = function () {
    var dialog = app.$.volumeDialog;
    dialog.close();
  };

  app.volUp = function () {
    if (app.volume < 100) {
      app.volume = app.volume + 2;
    }
  };

  app.volDown = function () {
    if (app.volume > 0) {
      app.volume = app.volume - 2;
    }
  };



  /*
    handle image for player background
  */
  app.getImageForPlayer = function (url, callback) {
    var art = app.$.coverArt,
      note = app.$.playNotify;
    art.style.backgroundImage = "url('" + url + "')";
    note.icon = url;
    callback();
  };

  app.defaultPlayImage = function () {
    var art = app.$.coverArt,
      note = app.$.playNotify;
    art.style.backgroundImage =  "url('images/default-cover-art.png')";
    note.icon = 'images/default-cover-art.png';
  };

  /*
    player UI control
  */
  app.playerProgress = function (e) {
    var audio, button, progress, currentMins, currentSecs, totalMins, totalSecs;
    if (e) {
      if (e.type === 'waiting') {
        app.waitingToPlay = true;
      } else if (e.type === 'timeupdate') {
        app.waitingToPlay = false;
      }
      audio = e.srcElement;
    } else {
      audio = app.$.audio;
    }
    button = app.$.avIcon;
    progress = Math.round((audio.currentTime / audio.duration * 100) * 100) / 100;
    currentMins = Math.floor(audio.currentTime / 60);
    currentSecs = Math.floor(audio.currentTime - (currentMins * 60));
    totalMins = Math.floor(audio.duration / 60);
    totalSecs = Math.floor(audio.duration - (totalMins * 60));
    if (audio.duration) {
      app.buffer = (audio.buffered.end(0) / audio.duration) * 100;
    } else {
      app.buffer = 0;
    }

    if (!audio.paused) {
      button.icon = "av:pause";
      app.isNowPlaying = true;
      if (!audio.duration) {
        app.contentLoading = true;
        app.playTime = currentMins + ':' + ('0' + currentSecs).slice(-2) + ' / ?:??';
        app.progress = 0;
      } else {
        app.contentLoading = false;
        app.playTime = currentMins + ':' + ('0' + currentSecs).slice(-2) + ' / ' + totalMins + ':' + ('0' + totalSecs).slice(-2);
        app.progress = progress;
      }
    } else {
      app.isNowPlaying = false;
      button.icon = "av:play-arrow";
    }
  };

  /*
    UI events
  */
  app.showApp = function () {
    var loader = document.getElementById("loader"),
      visible = loader.classList.contains("hide"),
      box = document.getElementById("box");

    if (!visible) {
      loader.classList.add('hide');
      box.classList.add('hide');
      box.classList.add('hide');
      app.askAnalistics();
    }
  };

  app.sizePlayer = function () {
    var height = (window.innerHeight - 256) + 'px',
      width = window.innerWidth + 'px',
      art = app.$.coverArt;

    art.style.width = width;
    art.style.height = height;
    art.style.backgroundSize = width;
  };

  app.askUser = function () {
    app.$.analistics.open();
  };

  /* request premission for analistics */
  app.askAnalistics = function () {
    chrome.storage.sync.get(function (result) {
      app.service.getConfig().addCallback(
        /** @param {!analytics.Config} config */
        function (config) {
          if (result.analistics === undefined) {
            app.askUser();
          } else {
            config.setTrackingPermitted(result.analistics);
            app.analisticsEnabled = result.analistics;
          }
          app.allowAnalistics = function () {
            app.analisticsEnabled = true;
            config.setTrackingPermitted(true);
            chrome.storage.sync.set({
              'analistics': true
            });
          };

          app.disAllowAnalistics = function () {
            app.analisticsEnabled = false;
            config.setTrackingPermitted(false);
            chrome.storage.sync.set({
              'analistics': false
            });
          };
        }
      );
    });
  };

  app.jumpTo = function (event, detail, sender) {
    app.$.wall.jumpToLetter(sender.attributes.it.value);
  };

  app.setFolder = function (event, detail, sender) {
    var value = parseInt(sender.attributes.i.value, 10);
    app.folder = value;
    chrome.storage.sync.set({
      'mediaFolder': value
    });
  };

  app.fixCoverArtForShuffle = function (obj, callback) {
    var artId = obj.cover,
      img = app.url + '/rest/getCoverArt.view?u=' + app.user + '&p=' + app.pass + '&v=' + app.version + '&c=PolySonic&f=json&id=' + artId;

    app.getDbItem(artId, function (ev) {
      if (ev.target.result) {
        var raw = ev.target.result,
          imgURL = window.URL.createObjectURL(raw);
        obj.cover = imgURL;
        app.getDbItem(artId + '-palette', function (ev) {
          obj.palette = ev.target.result;
          app.playlist.push(obj);
          app.async(callback);
        });
      } else {
        app.getImageFile(img, artId, function (ev) {
          var raw = ev.target.result,
            imgURL = window.URL.createObjectURL(raw);
          obj.cover = imgURL;
          app.colorThiefHandler(imgURL, artId, function (colorArray) {
            obj.palette = colorArray;
            app.playlist.push(obj);
            app.async(callback);
          });
        });
      }
    });
  };

  app.setFabColor = function (obj) {
    if (app.colorThiefEnabled && obj.palette) {
      app.colorThiefFab = obj.palette[0];
      app.colorThiefFabOff = obj.palette[1];
      app.colorThiefBuffered = obj.palette[2];
      app.colorThiefProgBg = obj.palette[3];
    }
  };

  app.progressClick = function (event) {
    var audio = app.$.audio,
      clicked = (event.x / window.innerWidth),
      sum = audio.duration - (audio.duration - (audio.duration * clicked)),
      bar = app.$.progress;
    bar.value = clicked * 100;
    audio.currentTime = sum;
  };

  app.savePlayQueue = function () {
    app.$.playlistDialog.close();
    app.$.createPlaylist.open();
    app.defaultName = new Date();
  };

  app.savePlayQueue2Playlist = function () {
    var url = app.url + '/rest/createPlaylist.view?u=' + app.user + '&p=' + app.pass + '&v=' + app.version + '&c=PolySonic&f=json&name=' + encodeURIComponent(app.defaultName),
      hasRun = false,
      i = 0;
    app.savingPlaylist = true;
    Array.prototype.forEach.call(app.playlist, function (item) {
      url = url + '&songId=' + item.id;
      i = i + 1;
      if (i === app.playlist.length) {
        app.doXhr(url, 'json', function (e) {
          if (e.target.response['subsonic-response'].status === 'ok') {
            app.doToast(chrome.i18n.getMessage('playlistCreated'));
            app.$.createPlaylist.close();
            app.savingPlaylist = false;
          } else {
            app.doToast(chrome.i18n.getMessage('playlistError'));
            app.savingPlaylist = false;
          }
        });
      }
    });
  };

  app.closePlaylistSaver = function () {
    app.$.createPlaylist.close();
  };

  /*
    load data
  */
  app.loadData = function () {
    chrome.storage.sync.get(function (result) {
      if (result.url === undefined) {
        app.$.firstRun.open();
      }
      app.url = result.url;
      app.user = result.user;
      app.pass = result.pass;
      app.listMode = result.listMode || 'cover';
      app.bitRate = result.bitRate || 320;
      app.shuffleSize = app.shuffleSize || '50';
      app.version = '1.11.0';
      app.querySize = 30;
      app.volume = result.volume || 100;
      app.queryMethod = result.queryMethod || 'ID3';
      app.colorThiefEnabled = true;
      app.dataLoading = false;
      app.sizePlayer();
      app.calculateStorageSize();
      if (app.url && app.user && app.pass && app.version) {
        var url = app.url + '/rest/ping.view?u=' + app.user + '&p=' + app.pass + '&v=' + app.version + '&c=PolySonic&f=json',
          url2;
        app.doXhr(url, 'json', function (e) {
          if (e.target.status === 200) {
            app.version = e.target.response['subsonic-response'].version;
            url2 = app.url + "/rest/getMusicFolders.view?u=" + app.user + "&p=" + app.pass + "&f=json&v=" + app.version + "&c=PolySonic";
            if (e.target.response['subsonic-response'].status === 'ok') {
              app.userDetails();
              console.log('Connected to Subconic loading data');
              app.doXhr(url2, 'json', function (e) {
                app.mediaFolders = e.target.response['subsonic-response'].musicFolders.musicFolder;
                /* setting mediaFolder causes a ajax call to get album wall data */
                app.folder = result.mediaFolder || 0;
                if (!e.target.response['subsonic-response'].musicFolders.musicFolder[1]) {
                  app.$.sortBox.style.display = 'none';
                }
                app.tracker.sendAppView('Album Wall');
              });
            } else {
              app.tracker.sendEvent('Connection Error', response.error.meessage);
              app.$.firstRun.toggle();
              app.doToast(response.error.meessage);
            }
          } else {
            app.tracker.sendEvent('Connection Error', e.target.response['subsonic-response'].error.meessage);
            app.$.firstRun.toggle();
            app.doToast(e.target.response['subsonic-response'].error.meessage);
          }
        });
      }
    });
    
    var scroller = app.appScroller(),
      audio = app.$.audio,
      maximized = chrome.app.window.current().isMaximized(),
      button = app.$.max,
      timer;
      
    if (maximized) {
      button.icon = 'check-box-outline-blank';
    } else {
      button.icon = 'flip-to-back';
    }
    scroller.onscroll = function () {
     var fab = app.$.fab,
        wall = app.$.wall;
  
      if (app.page === 0 && fab.state !== 'off' && scroller.scrollTop < app.position && wall.showing !== 'podcast') {
        fab.state = 'off';
      } else if (app.page === 0 && fab.state !== 'bottom' && scroller.scrollTop > app.position && wall.showing !== 'podcast') {
        fab.state = 'bottom';
      }
      app.position = scroller.scrollTop;
    };
  
    /*
      only needed if fullscreen enabled
  
    */
    //window.onresize = this.sizePlayer;
  
    audio.onwaiting = app.playerProgress;
  
    audio.onstalled = function (e) {
      if (timer) {
        clearInterval(timer);
      }
      timer = setInterval(function () {
        app.playerProgress();
      }, 250);
    };
  
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
        app.playerProgress();
      }, 250);
    };
  
    audio.ontimeupdate = app.playerProgress;
  
    audio.onended = app.nextTrack;
  
    audio.onerror = function (e) {
      app.page = 0;
      console.error('audio playback error ', e);
      app.doToast('Audio Playback Error');
      app.tracker.sendEvent('Audio Playback Error', e.target);
    };
  };

  /*
    action fab
  */
  app.doAction = function (event, detail, sender) {
    var scroller = app.appScroller(),
      wall = app.$.wall,
      animation = new CoreAnimation();
    animation.duration = 1000;
    animation.iterations = 'Infinity';
    animation.keyframes = [
      {opacity: 1},
      {opacity: 0}
    ];
    animation.target = sender;
    if (app.page === 0 && scroller.scrollTop !== 0 && wall.showing !== 'podcast' && app.$.fab.state === 'bottom') {
      app.async(function () {
        scroller.scrollTop = 0;
      });
    }
    if (app.page === 0 && wall.showing === 'podcast') {
      app.$.addPodcast.open();
    }
    if (app.page === 1) {
      app.showPlaylist();
    }
    if (app.page === 0 && app.$.fab.state === 'mid') {
      animation.play();
      app.$.wall.playSomething(sender.ident, function () {
        animation.cancel();
      });
    }
    if (app.page === 3) {
      animation.play();
      app.$.aDetails.playSomething(sender.ident, function () {
        animation.cancel();
      });
    }
  };

  /*jslint unparam: true*/
  app.fixScroller = function (event, detail, sender) {
    /*var scrollbar = app.appScroller();
    if (event.type === 'core-animated-pages-transition-prepare' && event.target.id === 'main' && scrollbar.scrollTop !== 0) {
      scrollbar.scrollTop = 0;
    }*/
  };
  /*jslint unparam: false*/

  app.openSearch = function () {
    app.closeDrawer(function () {
      app.$.searchDialog.toggle();
    });
  };

  app.closeSearch = function () {
    app.$.searchDialog.close();
  };

  app.doSearch = function () {
    if (app.searchQuery) {
      app.closeDrawer(function () {
        app.dataLoading = true;
        var url = app.url + '/rest/search3.view?u=' + app.user + '&p=' + app.pass + '&v=' + app.version + '&c=PolySonic&f=json&query=' + encodeURIComponent(app.searchQuery);
        app.doXhr(url, 'json', function (e) {
          if (e.target.response['subsonic-response'].status === 'ok') {
            app.searchQuery = '';
            var response = e.target.response;
            app.$.wall.clearData(function () {
              app.$.wall.response = response;
              app.async(function () {
                app.showing = app.listMode;
              });
            });
          }
        });
      });
    } else {
      app.doToast(chrome.i18n.getMessage("noSearch"));
    }
  };

  app.showPlaylist = function () {
    var dialog = app.$.playlistDialog;
    dialog.toggle();
  };

  app.closePlaylist = function () {
  var dialog = app.$.playlistDialog;
    dialog.close();
  };

  app.openPlaylists = function () {
    app.closeDrawer(function ()  {
      app.playlistsLoading = true;
      var url = app.url + '/rest/getPlaylists.view?u=' + app.user + '&p=' + app.pass + '&v=' + app.version + '&c=PolySonic&f=json';
      app.doXhr(url, 'json', function (e) {
        app.playlistsLoading = false;
        app.playlists = e.target.response['subsonic-response'].playlists.playlist;
        app.$.playlistsDialog.open();
      });
    });
  };

  app.closePlaylists = function () {
    app.$.playlistsDialog.close();
  };

  app.reallyDelete = function (event, detail, sender) {
    app.delID =  sender.attributes.ident.value;
    app.$.playlistsDialog.close();
    app.$.playlistConfirm.open();
  };

  app.deletePlaylist = function (event, detail, sender) {
    var url = app.url + '/rest/deletePlaylist.view?u=' + app.user + '&p=' + app.pass + '&v=' + app.version + '&c=PolySonic&f=json&id=' + sender.attributes.ident.value,
      url2 = app.url + '/rest/getPlaylists.view?u=' + app.user + '&p=' + app.pass + '&v=' + app.version + '&c=PolySonic&f=json';
    app.doXhr(url, 'json', function (e) {
      if (e.target.response['subsonic-response'].status === 'ok') {
        app.playlistsLoading = true;
        app.doXhr(url2, 'json', function (e) {
          app.playlistsLoading = false;
          app.playlists = e.target.response['subsonic-response'].playlists.playlist;
          app.$.playlistsDialog.open();
        });
      } else {
        app.doToast(chrome.i18n.getMessage('deleteError'));
      }
    });
  };

  app.closeShuffleOptions = function () {
    app.$.shuffleOptions.close();
  };

  app.shuffleOptions = function () {
    app.async(function () {
      var url = app.url + '/rest/getGenres.view?u=' + app.user + '&p=' + app.pass + '&v=' + app.version + '&c=PolySonic&f=json';
      app.closeDrawer(function () {
        app.doXhr(url, 'json', function (e) {
          app.genres = e.target.response['subsonic-response'].genres.genre;
          app.$.shuffleOptions.open();
        });
      });
    });
  };

  app.closePodcastDialog = function () {
    app.$.addPodcast.close();
  };

  app.toggleWall = function () {
    app.dataLoading = true;
    app.async(function () {
      var wall = app.$.wall;
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
      app.tracker.sendEvent('ListMode Changed', wall.listMode);
    });
  };

  app.requestSession = function () {
    chrome.cast.requestSession(onRequestSessionSuccess, onLaunchError);
  };

  app.back2List = function () {
    app.async(function () {
      app.dataLoading = true;
      app.page = 0;
      app.async(function () {
        app.dataLoading = false;
      });
    });
  };

  app.nowPlaying = function () {
    app.async(function () {
      app.page = 1;
    });
  };

  /*jslint unparam: true*/
  app.selectAction = function (event, detail, sender) {
    var wall = app.$.wall;
    app.async(function () {
      app.closeDrawer(function () {
        app.async(function () {
          if (wall.sort === sender.attributes.i.value) {
            app.pageLimit = false;
            if (app.queryMethod === 'ID3') {
              wall.request = 'getAlbumList2';
            } else {
              wall.request = 'getAlbumList';
            }
            wall.post.type = sender.attributes.i.value;
            wall.refreshContent();
            wall.showing = app.listMode;
            wall.$.threshold.clearLower();
          }
          wall.sort = sender.attributes.i.value;
        });
      });
    });
  };
  /*jslint unparam: false*/

  app.getPodcast = function () {
    var wall = app.$.wall;
    app.async(function () {
      app.closeDrawer(function () {
        app.async(function () {
          wall.getPodcast();
        });
      });
    });
  };

  app.getStarred = function () {
    var wall = app.$.wall;
    app.async(function () {
      app.closeDrawer(function () {
        app.async(function () {
          wall.getStarred();
        });
      });
    });
  };

  app.getArtist = function () {
    var wall = app.$.wall;
    app.async(function () {
      app.closeDrawer(function () {
        app.async(function () {
          wall.getArtist();
        });
      });
    });
  };

  app.gotoSettings = function () {
    app.closeDrawer(function () {
      app.async(function () {
        app.page = 2;
      });
    });
  };

  app.refreshPodcast = function (event, detail, sender) {
    app.async(function () {
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
      url = app.url + "/rest/refreshPodcasts.view?u=" + app.user + "&p=" + app.pass + "&f=json&v=" + app.version + "&c=PolySonic";
      app.doXhr(url, 'json', function (e) {
        if (e.target.response['subsonic-response'].status === 'ok') {
          animation.cancel();
          app.$.wall.refreshContent();
          app.doToast(chrome.i18n.getMessage("podcastCheck"));
        }
      });
    });
  };

  app.addChannel = function () {
    app.async(function () {
      if (!app.castURL) {
        app.doToast(app.urlError);
      }
      if (!app.invalidURL) {
        app.addingChannel = true;
        var url = app.url + "/rest/createPodcastChannel.view?u=" + app.user + "&p=" + app.pass + "&f=json&v=" + app.version + "&c=PolySonic&url=" + encodeURIComponent(app.castURL);
        app.doXhr(url, 'json', function (e) {
          if (e.target.response['subsonic-response'].status === 'ok') {
            app.addingChannel = false;
            app.$.addPodcast.close();
            app.$.wall.refreshContent();
            app.doToast(chrome.i18n.getMessage("channelAdded"));
            app.castURL = '';
          } else {
            app.doToast(chrome.i18n.getMessage("podcastError"));
          }
        });
      }
    });
  };

  app.doDelete = function (event, detail, sender) {
    app.$.wall.deleteChannel(sender.attributes.ident.value);
  };

  app.deleteEpisode = function (event, detail, sender) {
    app.$.wall.deleteEpisode(sender.attributes.ident.value);
  };

  app.getLicense = function (callback) {
    var url = app.url + "/rest/getLicense.view?u=" + app.user + "&p=" + app.pass + "&f=json&v=" + app.version + "&c=PolySonic";
    app.doXhr(url, 'json', function (e) {
      var response = e.target.response['subsonic-response'];
      if (response.status === 'ok') {
        app.serverLicense = response.license;
        app.$.licenseDialog.open();
        callback();
      }
    });
  };

  app.licenseDialogClose = function () {
    app.$.licenseDialog.close();
  };

  app.userDetails = function () {
    var url = app.url + "/rest/getUser.view?u=" + app.user + "&p=" + app.pass + "&f=json&v=" + app.version + "&c=PolySonic&username=" + app.user;
    app.doXhr(url, 'json', function (e) {
      var response = e.target.response['subsonic-response'];
      if (response.status === 'ok') {
        app.activeUser = response.user;
      }
    });
  };

  /*
    cast API
  */
  function onRequestSessionSuccess(e) {
    console.log('request run');
    session = e;
    console.log(e);
  }

  function onLaunchError(e) {
    console.error(e.code);
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

  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.command == "play") {
      sendResponse({farewell: "Command Sent"});
    }
  });

}());
