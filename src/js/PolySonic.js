/*global chrome, CryptoJS, console, window, document, XMLHttpRequest, setInterval, screen, analytics, Blob, navigator, Image, CoreAnimation, ColorThief, setTimeout */
(function () {
  'use strict';
  var app = document.querySelector('#tmpl');
  app.scrolling = false;
  app.addEventListener('template-bound', function () {
    app.sizePlayer();
    chrome.storage.sync.get(function (result) {
      //console.log(result);
      if (result.url === undefined) {
        app.$.firstRun.open();
      }
      app.url = result.url;
      app.user = result.user;
      app.pass = result.pass;
      app.listMode = 'cover';
      app.bitRate = result.bitRate || 320;
      app.shuffleSettings.size = app.shuffleSettings.size || '50';
      app.version = '1.11.0';
      app.querySize = 40;
      app.volume = result.volume || 100;
      app.queryMethod = result.queryMethod || 'ID3';
      app.repeatPlaylist = false;
      app.repeatText = chrome.i18n.getMessage('playlistRepeatOff');
      app.colorThiefEnabled = true;
      app.dataLoading = false;
      app.params = {
        u: app.user,
        v: app.version,
        c: 'PolySonic',
        f: 'json'
      };
      if (app.url && app.user && app.pass && app.version) {
        app.doXhr(app.buildUrl('ping', ''), 'json', function (e) {
          if (e.target.status === 200) {
            app.version = e.target.response['subsonic-response'].version;
            if (e.target.response['subsonic-response'].status === 'ok') {
              app.userDetails();
              console.log('Connected to Subconic loading data');
              app.doXhr(app.buildUrl('getMusicFolders', ''), 'json', function (e) {
                app.mediaFolders = e.target.response['subsonic-response'].musicFolders.musicFolder;
                /* setting mediaFolder causes a ajax call to get album wall data */
                app.folder = result.mediaFolder || 0;
                if (!e.target.response['subsonic-response'].musicFolders.musicFolder[1]) {
                  app.$.sortBox.style.display = 'none';
                }
                app.tracker.sendAppView('Album Wall');
              });
            } else {
              app.tracker.sendEvent('Connection Error', e.target.response['subsonic-response'].error.meessage);
              app.$.firstRun.toggle();
              app.doToast( e.target.response['subsonic-response'].error.meessage);
            }
          } else {
            app.tracker.sendEvent('Connection Error', e.target.response['subsonic-response'].error.meessage);
            app.$.firstRun.toggle();
            app.doToast(e.target.response['subsonic-response'].error.meessage);
          }
        });
      }
    });

    var audio = app.$.audio;

    app.appScroller().onscroll = app.scrollCallback;

    audio.onwaiting = app.playerProgress;

    audio.onprogress = app.buffering;

    audio.ontimeupdate = app.playerProgress;

    audio.onended = app.nextTrack;

    audio.onerror = function (e) {
      app.page = 0;
      console.error('audio playback error ', e);
      app.doToast('Audio Playback Error');
      app.tracker.sendEvent('Audio Playback Error', e.target);
    };

    app.service = analytics.getService('PolySonic');
    app.tracker = this.service.getTracker('UA-50154238-6');  // Supply your GA Tracking ID.

  });

  app.shuffleSettings = {};
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
  app.jumpToLabel = chrome.i18n.getMessage("jumpToLabel");
  app.closeLabel = chrome.i18n.getMessage("closeLabel");
  app.moreOptionsLabel = chrome.i18n.getMessage("moreOptionsLabel");
  app.refreshPodcastLabel = chrome.i18n.getMessage("refreshPodcast");
  app.registeredEmail = chrome.i18n.getMessage("registeredEmail");
  app.licenseKey = chrome.i18n.getMessage("licenseKey");
  app.keyDate = chrome.i18n.getMessage("keyDate");
  app.validLicense = chrome.i18n.getMessage("validLicense");
  app.invalidLicense = chrome.i18n.getMessage("invalidLicense");
  app.adjustVolumeLabel = chrome.i18n.getMessage("adjustVolumeLabel");
  app.showDownloads = chrome.i18n.getMessage('showDownloads');

  app.shuffleSizes = [
    20,
    40,
    50,
    75,
    100,
    200
  ];

  app.sortTypes = [
    {sort: 'newest', name: chrome.i18n.getMessage("newButton")},
    {sort: 'alphabeticalByArtist', name: chrome.i18n.getMessage("byArtistButton")},
    {sort: 'alphabeticalByName', name: chrome.i18n.getMessage("titleButton")},
    {sort: 'frequent', name: chrome.i18n.getMessage("frequentButton")},
    {sort: 'recent', name: chrome.i18n.getMessage("recentButton")}
  ];

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

  app.getImageFile = function (url, id, callback) {
    app.doXhr(url, 'blob', function (e) {
      app.putInDb(new Blob([e.target.response], {type: 'image/jpeg'}), id, callback);
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

  function formatBytes(bytes) {
    if (bytes < 1024) return bytes + ' Bytes';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(2) + ' KB';
    else if (bytes < 1073741824) return (bytes / 1048576).toFixed(2) + ' MB';
    else return (bytes / 1073741824).toFixed(2) + ' GB';
  }

  app.calculateStorageSize = function () {
    navigator.webkitTemporaryStorage.queryUsageAndQuota(function (used, remaining) {
      app.storageQuota = app.diskUsed + ": " + formatBytes(used) + ', ' + app.diskRemaining + ": " + formatBytes(remaining);
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

  app.doXhr = function (url, dataType, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.responseType = dataType;
    xhr.onload = callback;
    xhr.onerror = function (e) {
      app.dataLoading = false;
      app.doToast(chrome.i18n.getMessage("connectionError"));
      app.async(function () {
        app.doToast(chrome.i18n.getMessage('reconnecting'));
        app.doXhr(url, dataType, callback);
      }, null, 15000);
    };
    xhr.send();
  };

  app.playlist = [];

  app.page = app.page || 0;

  app.pageLimit = false;

  app.reloadApp = function () {
    chrome.runtime.reload();
  };

  app.minimize = function () {
    chrome.app.window.current().minimize();
  };

  app.openDownloads = function () {
    app.$.downloadDialog.open();
  };

  app.closeDownloads = function () {
    app.$.downloadDialog.close();
  };

  app.closeDrawer = function (callback) {
    app.dataLoading = true;
    app.$.panel.closeDrawer();
    if (callback) {
      app.async(callback, null, 500);
    }
  };

  app.openPanel = function () {
    app.$.panel.openDrawer();
  };

  app.appScroller = function () {
    return app.$.headerPanel.scroller;
  };

  app.doToast = function (text) {
    var toast = app.$.toast;
    toast.text = text;
    toast.show();
  };

  app.scrollCallback = function () {
    var fab = app.$.fab;
    var wall = app.$.wall;
    var scroller = app.appScroller();
    var timer = 0;

    if (app.page === 0 && fab.state !== 'off' && scroller.scrollTop < app.position && wall.showing !== 'podcast') {
      fab.state = 'off';
    } else if (app.page === 0 && fab.state !== 'bottom' && scroller.scrollTop > app.position && wall.showing !== 'podcast') {
      fab.state = 'bottom';
    } else if (app.page === 3 && fab.state !== 'off' && scroller.scrollTop < app.position) {
      fab.state = 'off';
    } else if (app.page === 3 && fab.state !== 'bottom' && scroller.scrollTop > app.position) {
      fab.state = 'bottom';
    }
    app.position = scroller.scrollTop;
    app.scrolling = true;
    if (timer) {
      clearTimeout(timer);
      timer = 0;
    } else {
      timer = setTimeout(function () {
        app.scrolling = false;
      }.bind(this), 50);
    }
  };

  app.close = function () {
    app.checkUnsavedDownloads(function () {
      window.close();
    }, function () {
      this.$.unsavedDownloads.open();
    }.bind(this));
  };

  app.checkUnsavedDownloads = function (callback, haveUnsaved) {
    if (this.$.downloads.childElementCount !== 0) {
      var downloads = this.$.downloads.querySelectorAll('download-manager');
      var length = downloads.length;
      var count = 0;
      for (var i = 0; i < length; i++) {
        if (!downloads[i].hasSaved) {
          count = count + 1;
        }
        if (i === length - 1 && count ===0) {
          callback();
        } else {
          haveUnsaved();
        }
      }
    } else {
      callback();
    }
  };

  app.closeAnyway = function () {
    window.close();
  };

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
      colorArray[2] = 'rgba(' + r + ',' + g + ',' + b + ',0.4);';
      if (colorArray[1] !== 'white') {
        colorArray[3] = '#444444';
      } else {
        colorArray[3] = '#c8c8c8';
      }
      app.putInDb(colorArray, artId + '-palette', function () {
        if (callback) {
          callback(colorArray);
        }
        console.log('Color palette saved ' + artId);
      });
    };
  };


  /*
    play functions
  */
  app.playAudio = function (obj) {
    var minis = document.querySelectorAll('mini-player');
    var length = minis.length;
    var url;
    for (var i = 0; i < length; i++) {
      minis[i].setPlaying({artist: obj.artist, title: obj.title, cover: obj.cover});
    }
    var audio = app.$.audio;
    var note = app.$.playNotify;
    if (obj.artist === '') {
      app.currentPlaying = obj.title;
      note.title = obj.title;
      url = app.buildUrl('stream', {format: 'raw', estimateContentLength: true, id: obj.id});
    } else {
      app.currentPlaying = obj.artist + ' - ' + obj.title;
      note.title = obj.artist + ' - ' + obj.title;
      url = app.buildUrl('stream', {maxBitRate: app.bitRate, id: obj.id});
    }
    if (app.activeUser.scrobblingEnabled) {
      app.doXhr(app.buildUrl('scrobble', {id: obj.id, time: new Date().getTime()}), 'json', function (e) {
        if (e.target.response['subsonic-response'].status === 'failed') {
          console.log('Last FM submission: ' + e.target.response['subsonic-response'].status);
          app.tracker.sendEvent('Last FM submission', 'Failed');
        }
      });
    }
    audio.src = url;
    note.icon = obj.cover;
    audio.play();
    note.show();
    app.tracker.sendEvent('Audio', 'Started');
  };

  app.playNext = function (next) {
    if (app.repeatPlaylist && !app.playlist[next]) {
      app.playing = 0;
      app.playAudio(app.playlist[0]);
    } else if (app.playlist[next]) {
      app.playing = next;
      app.playAudio(app.playlist[next]);
    } else {
      app.$.audio.pause();
      app.clearPlaylist();
      var minis = document.querySelectorAll('mini-player');
      var length = minis.length;
      for (var i = 0; i < length; i++) {
        minis[i].page = 0;
      }
    }
  };

  app.nextTrack = function () {
    app.playNext(app.playing + 1);
  };

  app.lastTrack = function () {
    app.playNext(app.playing - 1);
  };

  app.playThis = function () {
    app.async(function () {
      app.setFabColor(app.playlist[app.playing]);
      app.playAudio(app.playlist[app.playing]);
      if (app.playlist[app.playing].cover) {
        app.getImageForPlayer(app.playlist[app.playing].cover);
      } else {
        app.defaultPlayImage();
      }
    });
  };

  app.playPause = function () {
    var audio = app.$.audio;
    if (!audio.paused) {
      audio.pause();
    } else {
      audio.play();
    }
  };

  function endLoop() {
    if (app.$.audio.paused) {
      app.doShufflePlayback();
      app.dataLoading = false;
      app.closePlaylists();
    }
  }

  app.playPlaylist = function (event, detail, sender) {
    app.dataLoading = true;
    app.playlist = null;
    app.playlist = [];
    app.$.audio.pause();
    app.doXhr(app.buildUrl('getPlaylist', {id: sender.attributes.ident.value}), 'json', function (e) {
      var tracks = e.target.response['subsonic-response'].playlist.entry;
      var length = tracks.length;
      for (var i = 0; i < length; i++) {
        var mins = Math.floor(tracks[i].duration / 60);
        var obj = {
          id: tracks[i].id,
          artist: tracks[i].artist,
          title: tracks[i].title,
          duration: mins + ':' + ('0' + Math.floor(tracks[i].duration - (mins * 60))).slice(-2),
          cover: "al-" + tracks[i].albumId
        };
        app.fixCoverArtForShuffle(obj, endLoop);
      }
    });
  };

  app.shufflePlay = function () {
    app.dataLoading = true;
    app.shuffleLoading = true;
    app.playlist = null;
    app.playlist = [];
    if (!app.startYearInvalid && !app.endYearInvalid) {
      app.$.audio.pause();
      app.doXhr(app.buildUrl('getRandomSongs', app.shuffleSettings), 'json', function (event) {
        var data = event.target.response['subsonic-response'].randomSongs.song;
        var length = data.length;
        if (data) {
          for (var i = 0; i < length; i++) {
            var mins = Math.floor(data[i].duration / 60);
            var obj = {
              id: data[i].id,
              artist: data[i].artist,
              title: data[i].title,
              duration: mins + ':' + ('0' + Math.floor(data[i].duration - (mins * 60))).slice(-2),
              cover: "al-" + data[i].albumId
            };
            app.fixCoverArtForShuffle(obj, endLoop);
          }
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
      app.playing = 0;
      app.playAudio(app.playlist[0]);
      app.getImageForPlayer(app.playlist[0].cover, function () {
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
    app.$.volumeDialog.open();
  };

  app.closeVolume = function () {
    app.$.volumeDialog.close();
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

  app.toggleRepeat = function (event, detail, sender) {
    var text;
    if (app.repeatPlaylist) {
      app.repeatPlaylist = false;
      text = chrome.i18n.getMessage('playlistRepeatOff');
      app.$.repeat.style.color = 'white';
    } else {
      app.$.repeat.style.color = 'yellow';
      app.repeatPlaylist = true;
      text = chrome.i18n.getMessage('playlistRepeatOn');
    }
    app.doToast(text);
    app.repeatText = text;
  };

  /*
    handle image for player background
  */
  app.getImageForPlayer = function (url, callback) {
    app.$.coverArt.style.backgroundImage = "url('" + url + "')";
    app.$.playNotify.icon = url;
    if (callback) {
      app.async(callback);
    }
  };

  app.defaultPlayImage = function () {
    app.$.coverArt.style.backgroundImage =  "url('images/default-cover-art.png')";
    app.$.playNotify.icon = 'images/default-cover-art.png';
  };

  /*
    player UI control
  */
  app.buffering = function (e) {
    var audio = e.srcElement;
    if (audio.duration) {
     app.buffer = Math.floor((audio.buffered.end(0) / audio.duration) * 100);
    } else {
      app.buffer = 0;
    }
    audio = null;
    e = null;
  };

  app.playerProgress = function (e) {
    var audio = e.srcElement;

    if (e) {
      if (e.type === 'waiting') {
        app.waitingToPlay = true;   // spinner on album art shown
      } else if (e.type === 'timeupdate') {
        app.waitingToPlay = false;   // spinner on album art hidden
      }
    }
    app.currentMins = Math.floor(audio.currentTime / 60);
    app.currentSecs = Math.floor(audio.currentTime - (app.currentMins * 60));
    app.totalMins = Math.floor(audio.duration / 60);
    app.totalSecs = Math.floor(audio.duration - (app.totalMins * 60));

    if (!audio.paused) {
      app.$.avIcon.icon = "av:pause";
      if (!audio.duration) {
        app.playTime = app.currentMins + ':' + ('0' + app.currentSecs).slice(-2) + ' / ?:??';
        app.progress = 0;
      } else {
        app.playTime = app.currentMins + ':' + ('0' + app.currentSecs).slice(-2) + ' / ' + app.totalMins + ':' + ('0' + app.totalSecs).slice(-2);
        app.progress = Math.floor(audio.currentTime / audio.duration * 100);
      }
    } else {
      app.$.avIcon.icon = "av:play-arrow";
    }
    if (!audio.paused) {
      app.isNowPlaying = true;
    } else {
      app.isNowPlaying = false;
    }
    audio = null;
    e = null;
  };

  app.showApp = function () {
    var loader = document.getElementById("loader"),
      box = document.getElementById("box");

    if (!loader.classList.contains("hide")) {
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

  /* request premission for analistics */
  app.askAnalistics = function () {
    chrome.storage.sync.get(function (result) {
      app.service.getConfig().addCallback(
        /** @param {!analytics.Config} config */
        function (config) {
          if (result.analistics === undefined) {
            app.$.analistics.open();
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
    app.folder = parseInt(sender.attributes.i.value, 10);
    chrome.storage.sync.set({
      'mediaFolder': app.folder
    });
  };

  app.fixCoverArtForShuffle = function (obj, callback) {
    var artId = obj.cover;
    app.getDbItem(artId, function (ev) {
      if (ev.target.result) {
        var imgURL = window.URL.createObjectURL(ev.target.result);
        obj.cover = imgURL;
        app.getDbItem(artId + '-palette', function (ev) {
          obj.palette = ev.target.result;
          app.playlist.push(obj);
          app.async(callback);
        });
      } else {
        app.getImageFile(app.buildUrl('getCoverArt', {id: artId}), artId, function (ev) {
          var imgURL = window.URL.createObjectURL(ev.target.result);
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

  app.setFabColor = function (array) {
    if (app.colorThiefEnabled && array.palette) {
      app.colorThiefFab = array.palette[0];
      app.colorThiefFabOff = array.palette[1];
      app.colorThiefBuffered = array.palette[2];
      app.colorThiefProgBg = array.palette[3];
    }
  };

  app.progressClick = function (event) {
    var clicked = (event.x / window.innerWidth);
    app.$.progress.value = clicked * 100;
    app.$.audio.currentTime = audio.duration - (audio.duration - (audio.duration * clicked));
  };

  app.savePlayQueue = function () {
    app.$.playlistDialog.close();
    app.$.createPlaylist.open();
    app.defaultName = new Date().toGMTString();
  };

  function save2PlayQueueCallback (e) {
    if (e.target.response['subsonic-response'].status === 'ok') {
      app.doToast(chrome.i18n.getMessage('playlistCreated'));
      app.$.createPlaylist.close();
      app.savingPlaylist = false;
    } else {
      app.doToast(chrome.i18n.getMessage('playlistError'));
      app.savingPlaylist = false;
    }
  }

  app.savePlayQueue2Playlist = function () {
    var url = app.buildUrl('createPlaylist', {name: app.defaultName}),
      length = app.playlist.length;
    app.savingPlaylist = true;
    for (var i = 0; i < length; i++) {
      url = url + '&songId=' + app.playlist[i].id;
      if (i === length - 1) {
        app.doXhr(url, 'json', save2PlayQueueCallback);
      }
    }
  };

  app.closePlaylistSaver = function () {
    app.$.createPlaylist.close();
  };

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
      scroller.scrollTop = 0;
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
        app.$.fab.state = 'bottom';
      });
    }
    if (app.page === 3) {
      animation.play();
      app.$.aDetails.playSomething(sender.ident, function () {
        animation.cancel();
        app.$.fab.state = 'bottom';
      });
    }
  };

  app.doSearch = function () {
    if (app.searchQuery) {
      app.async(function () {
        app.closeDrawer(function () {
          app.async(function () {
            app.doXhr(app.buildUrl('search3', {query: encodeURIComponent(app.searchQuery)}), 'json', function (e) {
              app.dataLoading = true;
              if (e.target.response['subsonic-response'].status === 'ok') {
                app.searchQuery = '';
                var response = e.target.response;
                if (response['subsonic-response'].searchResult3.album) {
                  app.async(function () {
                    app.$.wall.clearData(function () {
                      app.$.wall.response = response;
                      app.showing = app.listMode;
                    });
                  });
                } else {
                  app.dataLoading = false;
                  app.doToast(chrome.i18n.getMessage('noResults'));
                }
              }
            });
          });
        });
      });
    } else {
      app.doToast(chrome.i18n.getMessage("noSearch"));
    }
  };

  app.showPlaylist = function (p) {
    /* p is just a small string i send with the click function */
    if (p) {
      app.$.playlistDialog.transition = "core-transition-bottom";
    } else {
      app.$.playlistDialog.transition = "core-transition-top";
    }
    app.async(function () {
      app.$.playlistDialog.toggle();
    });
  };

  app.closePlaylist = function () {
    app.async(function () {
      app.$.playlistDialog.close();
    });
  };

  app.openPlaylists = function () {
    app.closeDrawer(function ()  {
      app.dataLoading = false;
      app.playlistsLoading = true;
      app.doXhr(app.buildUrl('getPlaylists', ''), 'json', function (e) {
        app.playlistsLoading = false;
        app.playlists = e.target.response['subsonic-response'].playlists.playlist;
        app.async(function () {
          app.$.playlistsDialog.open();
        });
      });
    });
  };

  app.closePlaylists = function () {
    app.async(function () {
      app.$.playlistsDialog.close();
    });
  };

  app.reallyDelete = function (event, detail, sender) {
    app.delID =  sender.attributes.ident.value;
    app.async(function () {
      app.$.playlistsDialog.close();
      app.$.playlistConfirm.open();
    });
  };

  app.deletePlaylist = function (event, detail, sender) {
    app.doXhr(app.buildUrl('deletePlaylist', {id: sender.attributes.ident.value}), 'json', function (e) {
      if (e.target.response['subsonic-response'].status === 'ok') {
        app.playlistsLoading = true;
        app.doXhr(app.buildUrl('getPlaylists', ''), 'json', function (e) {
          app.playlistsLoading = false;
          app.playlists = e.target.response['subsonic-response'].playlists.playlist;
          app.async(function () {
            app.$.playlistsDialog.open();
          });
        });
      } else {
        app.doToast(chrome.i18n.getMessage('deleteError'));
      }
    });
  };

  app.closeShuffleOptions = function () {
    app.async(function () {
      app.$.shuffleOptions.close();
    });
  };

  app.shuffleOptions = function () {
    app.closeDrawer(function () {
      app.doXhr(app.buildUrl('getGenres', ''), 'json', function (e) {
        app.genres = e.target.response['subsonic-response'].genres.genre;
        app.dataLoading = false;
        app.async(function () {
          app.$.shuffleOptions.open();
        });
      });
    });
  };

  app.closePodcastDialog = function () {
    app.async(function () {
      app.$.addPodcast.close();
    });
  };

  app.toggleWall = function () {
    app.dataLoading = true;
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
  };

  app.back2List = function () {
    app.async(function () {
      app.page = 0;
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
    app.closeDrawer(function () {
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
  };
  /*jslint unparam: false*/

  app.getPodcast = function () {
    app.closeDrawer(function () {
      app.$.wall.getPodcast();
    });
  };

  app.getStarred = function () {
    app.closeDrawer(function () {
      app.$.wall.getStarred();
    });
  };

  app.getArtist = function () {
    app.closeDrawer(function () {
      app.$.wall.getArtist();
    });
  };

  app.gotoSettings = function () {
    app.async(function () {
      app.$.panel.closeDrawer();
      app.page = 2;
    });
  };

  app.refreshPodcast = function (event, detail, sender) {
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
    app.doXhr(app.buildUrl('refreshPodcasts', ''), 'json', function (e) {
      if (e.target.response['subsonic-response'].status === 'ok') {
        animation.cancel();
        app.$.wall.refreshContent();
        app.doToast(chrome.i18n.getMessage("podcastCheck"));
      }
    });
  };

  app.addChannel = function () {
    if (!app.castURL) {
      app.doToast(app.urlError);
    }
    if (!app.invalidURL) {
      app.addingChannel = true;
      app.doXhr(app.buildUrl('createPodcastChannel', {url: encodeURIComponent(app.castURL)}), 'json', function (e) {
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
  };

  app.doDelete = function (event, detail, sender) {
    app.$.wall.deleteChannel(sender.attributes.ident.value);
  };

  app.deleteEpisode = function (event, detail, sender) {
    app.$.wall.deleteEpisode(sender.attributes.ident.value);
  };

  app.getLicense = function (callback) {
    app.doXhr(app.buildUrl('getLicense', ''), 'json', function (e) {
      var response = e.target.response['subsonic-response'];
      if (response.status === 'ok') {
        app.serverLicense = response.license;
        var fromServer = new Date(app.serverLicense.date);
        var nextYear = Math.floor(fromServer.getFullYear() + 1);
        var expires = new Date(fromServer.setFullYear(nextYear));
        var now = new Date();
        var minute = 1000 * 60;
        var hour = minute * 60;
        var day = hour * 24;
        var daysLeft = Math.ceil((expires.getTime() - now.getTime())/(day));
        var hoursLeft = Math.ceil((expires.getTime() - now.getTime())/(hour));
        if (daysLeft > 0) {
          app.serverLicense.daysLeft = daysLeft + ' days';
        } else {
          app.serverLicense.daysLeft = hoursLeft + 'hours';
        }
        app.$.licenseDialog.open();
        app.async(callback);
      }
    });
  };

  app.licenseDialogClose = function () {
    app.$.licenseDialog.close();
  };

  app.userDetails = function () {
    app.async(function () {
      app.doXhr(app.buildUrl('getUser', {username: app.user}), 'json', function (e) {
        var response = e.target.response['subsonic-response'];
        if (response.status === 'ok') {
          app.activeUser = response.user;
        } else {
          console.error('Error getting User details');
        }
      });
    });
  };

  function toQueryString(params) {
    var r = [];
    for (var n in params) {
      n = encodeURIComponent(n);
      r.push(params[n] === null ? n : (n + '=' + encodeURIComponent(params[n])));
    }
    return r.join('&');
  }

  String.prototype.hexEncode = function () {
    var r = '';
    var i = 0;
    var h;
    while (i<this.length) {
      h = this.charCodeAt(i++).toString(16);
      while (h.length<2) {
        h = h;
      }
      r += h;
    }
    return 'enc:'+r;
  };

  function makeSalt(length) {
    var text = "";
    var possible = "ABCD/EFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for( var i=0; i < length; i++ )
      text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
  }

  app.buildUrl = function(method, options) {
    if (options !== null && typeof options === 'object') {
      options = '&' + toQueryString(options);
    }
    if (app.user !== app.params.u) {
      app.params.u = app.user;
    }
    if (app.version !== app.params.v) {
      app.params.v = app.version;
    }
    if (parseFloat(app.version, 10) <= 1.12) {
      app.params.p = app.pass.hexEncode();
      return app.url + '/rest/' + method + '.view?' + toQueryString(app.params) + options;
    } else {
      app.params.s = makeSalt(16);
      app.params.t = md5(app.pass + app.params.s);
      return app.url + '/rest/' + method + '.view?' + toQueryString(app.params) + options;
    }
  };

}());
