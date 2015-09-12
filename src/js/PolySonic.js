(function bootApp() {
  'use strict';
  var app = document.querySelector('#app');

  var indexedDB = window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB || window.OIndexedDB || window.msIndexedDB;

  var IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.OIDBTransaction || window.msIDBTransaction;

  var dbVersion = 1.0;

  var request = indexedDB.open("albumInfo", dbVersion);

  request.onerror = function () {
    console.log("Error creating/accessing IndexedDB database");
  };

  request.onsuccess = function () {
    console.log("Success creating/accessing IndexedDB database");
    app.db = request.result;

    // Interim solution for Google Chrome to create an objectStore. Will be deprecated
    if (app.db.setVersion) {
      if (app.db.version !== dbVersion) {
        var setVersion = app.db.setVersion(dbVersion);
        setVersion.onsuccess = function () {
          createObjectStore(app.db);
        };
      }
    }
  };
  
  request.onupgradeneeded = function (event) {
    createObjectStore(event.target.result);
  };

  function createObjectStore(dataBase) {
    console.log("Creating objectStore");
    dataBase.createObjectStore("albumInfo");
  }
  
  app.getDbItem = function (id, callback) {
    var transaction = app.db.transaction(["albumInfo"], "readwrite"),
      request = transaction.objectStore("albumInfo").get(id);
    request.onsuccess = callback;
    request.onerror = app.dbErrorHandler;
  };

  app.storeInDb = function (data, id) {
    return new Promise(function (resolve, reject) {
      var transaction = app.db.transaction(["albumInfo"], "readwrite");
      transaction.objectStore("albumInfo").put(data, id);
      transaction.objectStore("albumInfo").get(id).onsuccess = function (e) {
        resolve(e.target.result);
      };
    });
  };

  app.text = {
    appName: chrome.i18n.getMessage('appName'),
    appDesc: chrome.i18n.getMessage('appDesc'),
    folderSelector: chrome.i18n.getMessage('folderSelector'),
    folderSelectorLabel: chrome.i18n.getMessage('folderSelectorLabel'),
    shuffleButton: chrome.i18n.getMessage('shuffleButton'),
    artistButton: chrome.i18n.getMessage('artistButton'),
    NewButton: chrome.i18n.getMessage('NewButton'),
    frequentButton: chrome.i18n.getMessage('frequentButton'),
    titleButton: chrome.i18n.getMessage('titleButton'),
    byArtistButton: chrome.i18n.getMessage('byArtistButton'),
    recentButton: chrome.i18n.getMessage('recentButton'),
    podcastButton: chrome.i18n.getMessage('podcastButton'),
    favoritesButton: chrome.i18n.getMessage('favoritesButton'),
    playlistsButton: chrome.i18n.getMessage('playlistsButton'),
    searchButton: chrome.i18n.getMessage('searchButton'),
    settingsButton: chrome.i18n.getMessage('settingsButton'),
    urlError: chrome.i18n.getMessage('urlError'),
    urlLabel: chrome.i18n.getMessage('urlLabel'),
    usernameError: chrome.i18n.getMessage('usernameError'),
    usernameLabel: chrome.i18n.getMessage('usernameLabel'),
    passwordLabel: chrome.i18n.getMessage('passwordLabel'),
    showPass: chrome.i18n.getMessage('showPass'),
    hidePass: chrome.i18n.getMessage('hidePass'),
    submitButton: chrome.i18n.getMessage('submitButton'),
    bitrateLabel: chrome.i18n.getMessage('bitrateLabel'),
    cacheDetails: chrome.i18n.getMessage('cacheDetails'),
    clearCacheLabel: chrome.i18n.getMessage('clearCacheLabel'),
    clearSettingsLabel: chrome.i18n.getMessage('clearSettingsLabel'),
    add2PlayQueue: chrome.i18n.getMessage('add2PlayQueue'),
    favoriteAlbum: chrome.i18n.getMessage('favoriteAlbum'),
    downloadButton: chrome.i18n.getMessage('downloadButton'),
    albumTracklist: chrome.i18n.getMessage('albumTracklist'),
    nowPlayingTitle: chrome.i18n.getMessage('nowPlayingTitle'),
    connectionError: chrome.i18n.getMessage('connectionError'),
    noSearch: chrome.i18n.getMessage('noSearch'),
    noMatch: chrome.i18n.getMessage('noMatch'),
    podcastCheck: chrome.i18n.getMessage('podcastCheck'),
    channelAdded: chrome.i18n.getMessage('channelAdded'),
    podcastError: chrome.i18n.getMessage('podcastError'),
    invalidEntry: chrome.i18n.getMessage('invalidEntry'),
    added2Queue: chrome.i18n.getMessage('added2Queue'),
    podcastDownload: chrome.i18n.getMessage('podcastDownload'),
    clearQueue: chrome.i18n.getMessage('clearQueue'),
    analistics: chrome.i18n.getMessage('analistics'),
    accept: chrome.i18n.getMessage('accept'),
    decline: chrome.i18n.getMessage('decline'),
    shuffleOptionsLabel: chrome.i18n.getMessage('shuffleOptionsLabel'),
    optional: chrome.i18n.getMessage('optional'),
    artistLabel: chrome.i18n.getMessage('artistLabel'),
    albumLabel: chrome.i18n.getMessage('albumLabel'),
    genreLabel: chrome.i18n.getMessage('genreLabel'),
    songReturn: chrome.i18n.getMessage('songReturn'),
    playButton: chrome.i18n.getMessage('playButton'),
    playPodcast: chrome.i18n.getMessage('playPodcast'),
    yearError: chrome.i18n.getMessage('yearError'),
    releasedAfter: chrome.i18n.getMessage('releasedAfter'),
    releasedBefore: chrome.i18n.getMessage('releasedBefore'),
    deleteConfirm: chrome.i18n.getMessage('deleteConfirm'),
    deleteError: chrome.i18n.getMessage('deleteError'),
    backButton: chrome.i18n.getMessage('backButton'),
    noResults: chrome.i18n.getMessage('noResults'),
    noFavoriteHeader: chrome.i18n.getMessage('noFavoriteHeader'),
    noFavoriteMessage: chrome.i18n.getMessage('noFavoriteMessage'),
    addContent: chrome.i18n.getMessage('addContent'),
    addAlbums: chrome.i18n.getMessage('addAlbums'),
    addPodcast: chrome.i18n.getMessage('addPodcast'),
    podcastSubmissionLabel: chrome.i18n.getMessage('podcastSubmissionLabel'),
    foundHere: chrome.i18n.getMessage('foundHere'),
    deleteLabel: chrome.i18n.getMessage('deleteLabel'),
    volumeLabel: chrome.i18n.getMessage('volumeLabel'),
    adjustVolumeLabel: chrome.i18n.getMessage('adjustVolumeLabel'),
    diskUsed: chrome.i18n.getMessage('diskUsed'),
    diskRemaining: chrome.i18n.getMessage('diskRemaining'),
    playlistCreated: chrome.i18n.getMessage('playlistCreated'),
    playlistError: chrome.i18n.getMessage('playlistError'),
    playTrack: chrome.i18n.getMessage('playTrack'),
    createPlaylistLabel: chrome.i18n.getMessage('createPlaylistLabel')
  };

  app.shuffleSizes = [
    20,
    40,
    50,
    75,
    100,
    200
  ];

  app.sortTypes = [
    {
      sort: 'newest',
      name: chrome.i18n.getMessage("newButton")
    }, {
      sort: 'alphabeticalByArtist',
      name: chrome.i18n.getMessage("byArtistButton")
    }, {
      sort: 'alphabeticalByName',
      name: chrome.i18n.getMessage("titleButton")
    }, {
      sort: 'frequent',
      name: chrome.i18n.getMessage("frequentButton")
    }, {
      sort: 'recent',
      name: chrome.i18n.getMessage("recentButton")
    }
  ];
  
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
  
  function createRoute(route, callback) {
    if (location.hash === route) {
      callback();
    }
  }
  
  function setRoute(route) {
    location.hash = route;
  }
  
  function routing() {
    createRoute('', function () {
      app.page = 0;
      app.tracker.sendAppView('Album Wall');
    });
    createRoute('#Player', function () {
      app.tracker.sendAppView('Player');
    });
  }

  function formatBytes(bytes) {
    if (bytes < 1024) return bytes + ' Bytes';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(2) + ' KB';
    else if (bytes < 1073741824) return (bytes / 1048576).toFixed(2) + ' MB';
    else return (bytes / 1073741824).toFixed(2) + ' GB';
  }

  function appResize() {
    document.querySelector('album-wall').resizeElement();
    var albums = document.querySelectorAll('album-art');
    var aLength = albums.length;
    for (var i = 0; i < aLength; i++) {
      if (albums[i].$.details.opened) {
        albums[i].size();
      }
    }
  }

  function firstRun() {
    if (!app.$.firstRun.opened) {
      app.$.firstRun.open();
    }
  }
  
  function makeFirstConnection() {
    return new Promise(function (resolve, reject) {
      app.getApiVersion().then(function (json) {
        var thing = document.querySelector('album-wall');
        if (json.status === 'ok') {
          // first data call
          thing.post = {
            type: 'newest',
            size: app.querySize,
            offset: 0
          };
          app.userDetails(function () {
            app.fetchJSON(app.buildUrl('getAlbumList', thing.post)).then(function (json) {
              if (json.status === 'ok') {
                thing.albumWall = json.albumList.album;
                resolve();
              }
            });
          });
        } else {
          if (!app.$.firstRun.opened) {
            app.$.firstRun.open();
          }
        }
      });
    });
  }
  
  function makeSalt(length) {
    var text = "";
    var possible = "ABCD/EFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for( var i=0; i < length; i++ )
      text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
  }

  function toQueryString(params) {
    var r = [];
    for (var n in params) {
      n = encodeURIComponent(n);
      r.push(params[n] === null ? n : (n + '=' + encodeURIComponent(params[n])));
    }
    return r.join('&');
  }

  app.getApiVersion = function () {
    return new Promise(function (resolve, reject) {
      app.fetchJSON(app.url + '/rest/ping.view?f=json').then(function versionPingCallback(json) {
        app.version = json.version;
        app.fetchJSON(app.buildUrl('ping', '')).then(function authCallback(json) {
          if (json.status === 'ok') {
            resolve(json);
          } else {
            reject(json);
          }
        });
      }).catch(function () {
        reject({error: 'Error connecting to server'});
      });
    });
  };

  app.reloadApp = function () {
    chrome.runtime.reload();
  };

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
    if (versionCompare(app.version, '1.13.0') >= 0) {
      if (app.params.p) {
        delete app.params.p;
      }
      app.params.s = makeSalt(16);
      app.params.t = md5(app.pass + app.params.s);
      return app.url + '/rest/' + method + '.view?' + toQueryString(app.params) + options;
    } else {
      if (app.params.t) {
        delete app.params.t;
        delete app.params.s;
      }
      app.params.p = app.pass.hexEncode();
      return app.url + '/rest/' + method + '.view?' + toQueryString(app.params) + options;
    }
  };
  
  app.openDrawer = function () {
    if (!app.$.drawer.opened) {
      app.$.drawer.openDrawer();
    }
  };
  
  app.closeDrawer = function () {
    if (app.$.drawer.opened) {
      app.$.drawer.closeDrawer();
    }
  };
  
  app.showApp = function () {
    var loader = document.getElementById("loader"),
      box = document.getElementById("box");

    if (!loader.classList.contains("hide")) {
      loader.classList.add('hide');
      box.classList.add('hide');
      box.classList.add('hide');
      //app.askAnalistics();
    }
  };

  app.fetchJSON = function (url) {
    return new Promise(function (resolve, reject) {
      app.fetching = fetch(url).then(function fetchCallback(response) {
        if (response.status === 200) {
          response.json().then(function jsonCallback(json) {
            resolve(json['subsonic-response']);
          });
        } else {
          reject();
        }
      });
    });
  };

  app.fetchImage = function (url) {
    return new Promise(function (resolve, reject) {
      fetch(url).then(function fetchCallback(response) {
        if (response.status === 200) {
          response.blob().then(function blobCallback(blob) {
            resolve(new Blob([blob], {type: 'image/jpeg'}));
          });
        } else {
          reject();
        }
      });
    });
  };
  
  app.localStorageSet = function (obj) {
    for (var key in odj) {
      localStorage[key] = obj[key];
    }
  };
  
  app.localStorageGet = function () {
    return new Promise(function (resolve, reject) {
      resolve(localStorage);
    });
  };
  
  app.makeToast = function (text) {
    app.$.toast.text = text;
    app.$.toast.show();
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

  app.colorThief = function (imgURL, artId) {
    return new Promise(function(resolve, reject) {
      var imgElement = new Image();
      imgElement.src = imgURL;
      imgElement.onload = function () {
        var color = app.getColor(imgElement),
          colorArray = [],
          r = color[1][0],
          g = color[1][1],
          b = color[1][2],
          hex = app.rgbToHex(r, g, b);
        colorArray[0] = 'rgb(' + r + ',' + g + ',' + b + ')';
        colorArray[1] = app.getContrast50(hex);
        colorArray[2] = 'rgba(' + r + ',' + g + ',' + b + ',0.4)';
        if (colorArray[1] !== 'white') {
          colorArray[3] = '#444444';
        } else {
          colorArray[3] = '#c8c8c8';
        }
        app.storeInDb(colorArray, artId + '-palette').then(function (colorArray) {
          resolve(colorArray);
        });
      };
    });
  };

  app.secondsToMins = function (sec) {
    var mins = Math.floor(sec / 60);
    return mins + ':' + ('0' + Math.floor(sec - (mins * 60))).slice(-2);
  };

  app.userDetails = function (callback) {
    app.fetchJSON(app.buildUrl('getUser', {
      username: app.user
    })).then(function (response) {
      if (response.status === 'ok') {
        app.activeUser = response.user;
        callback();
      } else {
        console.error('Error getting User details');
      }
    });
  };

  app.addEventListener('dom-change', function domChanged() {
    var service = analytics.getService('PolySonic');
    app.tracker = service.getTracker('UA-50154238-6');
    app.playlist = [];
    routing();
    if (!localStorage) {
      chrome.storage.local.get(function localLoaded(local) {
        app.bitRate = local.bitRate || 320;
      });
      chrome.storage.sync.get(function syncLoaded(sync) {
        if (!sync.url) {
          firstRun();
        }
        // loggin things
        app.url = sync.url;
        app.user = sync.user;
        app.pass = sync.pass;
        // assorted settings
        app.autoBookmark = Boolean(sync.autoBookmark);
        app.shuffleSettings = {};
        app.shuffleSettings.size = app.shuffleSettings.size || '50';
        app.version = '1.11.0';
        app.querySize = 60;
        app.volume = sync.volume || 100;
        app.repeatPlaylist = false;
        app.dataLoading = false;
        // base url params
        app.params = {
          u: app.user,
          v: app.version,
          c: 'PolySonic',
          f: 'json'
        };
        if (app.url !== undefined && app.user !== undefined && app.pass !== undefined) {
          makeFirstConnection().then(function () {
            app.showApp();
          }).catch(function () {
            app.makeToast('Error connecting');
          });
        }
      });
    } else {
      app.localStorageGet().then(function (local) {
        if (!local.url) {
          firstRun();
        }
        // loggin things
        app.url = local.url;
        app.user = local.user;
        app.pass = local.pass;
        // assorted settings
        app.bitRate = local.bitRate || 320;
        app.autoBookmark = Boolean(local.autoBookmark);
        app.shuffleSettings = {};
        app.shuffleSettings.size = app.shuffleSettings.size || '50';
        app.version = '1.11.0';
        app.querySize = 60;
        app.volume = local.volume || 100;
        app.repeatPlaylist = false;
        app.dataLoading = false;
        // base url params
        app.params = {
          u: app.user,
          v: app.version,
          c: 'PolySonic',
          f: 'json'
        };
        if (app.url !== undefined && app.user !== undefined && app.pass !== undefined) {
          makeFirstConnection().then(function () {
            app.showApp();
          }).catch(function () {
            app.makeToast('Error connecting');
          });
        }
      });
    }
  });
  
  app.makeNoise = function () {
    var audio = document.createElement('audio');
    audio.src = 'http://dough10.me:4040/rest/stream.view?u=admin&v=1.12.0&c=PolySonic&f=json&p=enc%3A6f6963753831326269746368&format=raw&estimateContentLength=true&id=6631';
    document.querySelector('#audioContainer').appendChild(audio);
    audio.play();
  };
  
  app.moreAlbums = function () {
    var wall = document.querySelector('album-wall');
    if (wall.$.header.scroller.scrollTop !== 0) {
      wall.$.header.scroller.scrollTop =  0;
    }
    app.dataLoading = true;
    wall.post.offset = 0;
    app.fetchJSON(app.buildUrl(
      'getAlbumList', 
      wall.post
    )).then(function (json) {
      var newAlbums = json.albumList.album;
      wall.albumWall = newAlbums;
      app.dataLoading = false;
    });
  };

  window.onresize = appResize;
  
  window.onhashchange = routing;
})();


