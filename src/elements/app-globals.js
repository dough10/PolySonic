(function () {
  'use strict';

  var app = document.querySelector('#tmpl');

  window.requestFileSystem  = window.requestFileSystem || window.webkitRequestFileSystem;

  var indexedDB = window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB || window.OIndexedDB || window.msIndexedDB;

  var dbVersion = 1.0;

  var dbName = 'metaData';
  app.dbname = dbName;

  var request = indexedDB.open(dbName, dbVersion);

  function createObjectStore(dataBase) {
    console.log("Creating objectStore");
    dataBase.createObjectStore(dbName);
  }
  app.createObjectStore = createObjectStore;

  var db;

  request.onerror = function () {
    console.log("Error creating/accessing IndexedDB database");
  };

  request.onsuccess = function () {
    console.log("Success creating/accessing IndexedDB database");
    db = this.result;

    // Interim solution for Google Chrome to create an objectStore. Will be deprecated
    if (db.setVersion) {
      if (db.version !== dbVersion) {
        var setVersion = db.setVersion(dbVersion);
        setVersion.onsuccess = function () {
          createObjectStore(db);
        };
      }
    }
  };

  request.onupgradeneeded = function (event) {
    createObjectStore(event.target.result);
  };

  function onInitFs(fs) {
    app.fs = fs;
    console.log('Opened file system: ' + fs.name);
  }

  function fsErrorHandler(e) {
    var msg = '';

    switch (e.code) {
      case FileError.QUOTA_EXCEEDED_ERR:
        msg = 'QUOTA_EXCEEDED_ERR';
        break;
      case FileError.NOT_FOUND_ERR:
        msg = 'NOT_FOUND_ERR';
        break;
      case FileError.SECURITY_ERR:
        msg = 'SECURITY_ERR';
        break;
      case FileError.INVALID_MODIFICATION_ERR:
        msg = 'INVALID_MODIFICATION_ERR';
        break;
      case FileError.INVALID_STATE_ERR:
        msg = 'INVALID_STATE_ERR';
        break;
      default:
        msg = 'Unknown Error';
        break;
    }
    console.log('Error: ' + msg);
  }

  navigator.webkitPersistentStorage.requestQuota(1024*1024*512, function(grantedBytes) {
    window.requestFileSystem(PERSISTENT, grantedBytes, onInitFs, fsErrorHandler);
  }, function(e) {
    console.log('Error', e);
  });

  /**
   * return chrome localization string
   */
  function getMessage(id) {
    return chrome.i18n.getMessage(id);
  }

  /**
   * default xhr error
   * @param {Error} e
   */
  function xhrError(e) {
    app.dataLoading = false;
    app.doToast(getMessage("connectionError"));
    console.error(e);
    if (!document.querySelector('#loader').classList.contains("hide")) {
      app.$.firstRun.open();
    }
  }

  /**
   * convert object a query string
   * @param {Object} params
   */
  function toQueryString(params) {
    var r = [];
    for (var n in params) {
      n = encodeURIComponent(n);
      r.push(params[n] === null ? n : (n + '=' + encodeURIComponent(params[n])));
    }
    return r.join('&');
  }

  /**
   * create a random string of a given length
   * @param {number} length
   */
  function makeSalt(length) {
    var text = "";
    var possible = "ABCD/EFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for( var i=0; i < length; i++ )
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    return text;
  }

  /**
   * use colorthief to get palette from cover art
   * @param {image element} image
   */
  function getColor(imageEl) {
    var colorThief = new ColorThief();
    return colorThief.getPalette(imageEl, 4);
  }

  /**
   * get contrasting color
   * @param {String} hexcolor
   */
  function getContrast50(hexcolor) {
    return (parseInt(hexcolor, 16) > 0xffffff / 2) ? 'black' : 'white';
  }

  /**
   * convert component to hex value
   */
  function componentToHex(c) {
    var hex = c.toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  }

  /**
   * convert rgb values to hex color
   * @param {Number} r
   * @param {Number} g
   * @param {Number} b
   */
  function rgbToHex(r, g, b) {
    return componentToHex(r) + componentToHex(g) + componentToHex(b);
  }

  /**
   * method to create folder structure
   */
  function createDir(rootDirEntry, folders) {
    // Throw out './' or '/' and move on to prevent something like '/foo/.//bar'.
    if (folders[0] === '.' || folders[0] === '') {
      folders = folders.slice(1);
    }
    rootDirEntry.getDirectory(folders[0], {create: true}, function(dirEntry) {
      // Recursively add the new subfolder (if we still have another to create).
      if (folders.length) {
        createDir(dirEntry, folders.slice(1));
      }
    }, errorHandler);
  }

  /**
   * localization texts
   */
  var texts = {
    fromStart: getMessage('fromStart'),
    playFrom: getMessage('playFrom'),
    hasBookmark: getMessage('hasBookmark'),
    moreLikeThis: getMessage("moreLikeThis"),
    backButton: getMessage("backButton"),
    playTrackLabel: getMessage("playTrack"),
    moreOptionsLabel: getMessage("moreOptionsLabel"),
    closeLabel: getMessage("closeLabel"),
    add2PlayQueue: getMessage("add2PlayQueue"),
    favoriteAlbum: getMessage("favoriteAlbum"),
    downloadButton: getMessage("downloadButton"),
    albumTracklist: getMessage("albumTracklist"),
    deletebookMarkConfirm: getMessage('deletebookMarkConfirm'),
    accept: getMessage("accept"),
    decline: getMessage("decline"),
    added2Queue: getMessage("added2Queue"),
    noResults: getMessage("noResults"),
    noFavoriteHeader: getMessage("noFavoriteHeader"),
    noFavoriteMessage: getMessage("noFavoriteMessage"),
    addContent: getMessage("addContent"),
    addPodcasts: getMessage("addPodcasts"),
    addAlbums: getMessage("addAlbums"),
    addPodcast: getMessage("addPodcast"),
    foundHere: getMessage("foundHere"),
    deleteLabel: getMessage("deleteLabel"),
    playPodcastLabel: getMessage("playPodcast"),
    removeDownloadLabel: getMessage('removeDownloadLabel'),
    saveFileLabel: getMessage('saveFileLabel'),
    pauseDownload: getMessage('abortDownload'),
    label: getMessage('nowPlayingTitle')
  };

  /**
   *  polymer things
   */
  Polymer('app-globals', {
    ready: function () {
      this.texts = texts;
    },

    /**
     * convert seconds to readable form
     * @param {Number} sec
     */
    secondsToMins: function (sec) {
      var mins = Math.floor(sec / 60);
      return mins + ':' + ('0' + Math.floor(sec - (mins * 60))).slice(-2);
    },


    /**
     * attach opacity animation to give element
     * @param {Element} el - dom element to attach animation to
     */
    attachAnimation: function (el) {
      var animation = new CoreAnimation();
      animation.duration = 1000;
      animation.iterations = 'Infinity';
      animation.keyframes = [
        {
          opacity: 1
        }, {
          opacity: 0
        }
      ];
      animation.target = el;
      return animation;
    },

    /**
     * display toast message to user
     * @param {String} text
     */
    makeToast: function (text) {
      var toast = app.$.toast;
      toast.text = text;
      toast.show();
    },

    /**
     * closes menu if in narrow mode
     */
    closeDrawer: function () {
      return new Promise(function (resolve, reject) {
        app.dataLoading = true;
        app.$.panel.closeDrawer();
        app.async(resolve);
      });
    },

    /**
     * xhr
     * @param {String} url
     * @param {String} dataType
     * @param {Function} callback
     */
    doXhr: function (url, dataType) {
      return new Promise(function (resolve, reject) {
        var xhr = new XMLHttpRequest();
        xhr.open("GET", url, true);
        xhr.responseType = dataType;
        xhr.onload = resolve;
        xhr.onerror = xhrError;
        xhr.send();
      });
    },


    /**
     * store object in indexeddb
     * @param {Object} data
     * @param {String} id
     * @param {Function} callback
     */
    putInDb: function (data, id) {
      return new Promise(function (resolve, reject) {
        var transaction = db.transaction([dbName], "readwrite");
        if (id) {
          transaction.objectStore(dbName).put(data, id);
          transaction.objectStore(dbName).get(id).onsuccess = function (e) {
            resolve(e.target.result);
          };
        }
      });
    },


    /**
     * fetch a item from indexeddb
     * @param {String} id
     * @param {Function} callback
     */
    getDbItem: function (id) {
      return new Promise(function (resolve, reject) {
        if (id) {
          var transaction = db.transaction([dbName], "readwrite");
          var request = transaction.objectStore(dbName).get(id);
          request.onsuccess = resolve;
          request.onerror = reject;
        }
      });
    },


    /**
     * Fetch image from subsonic server and store it in indexeddb
     * @param {String} url
     * @param {String} id
     * @param {Function} callback
     */
    getImageFile: function (url, id) {
      return new Promise(function (resolve, reject) {
        var fileName = id + '.jpg';
        this.doXhr(url, 'blob').then(function (e) {
          app.fs.root.getFile(fileName, {create: true}, function(fileEntry) {
            fileEntry.createWriter(function(fileWriter) {

              fileWriter.onwriteend = function(e) {
                app.fs.root.getFile(fileName, {create: false}, function(fileEntry) {
                  resolve(fileEntry.toURL());
                });
              };

              fileWriter.onerror = function(e) {
                console.log('Write failed: ' + e.toString());
              };
              var blob = new Blob([ e.target.response ], { type: 'image/jpeg' });

              fileWriter.write(blob);
            }.bind(this), fsErrorHandler);
          }.bind(this), fsErrorHandler);
        }.bind(this));
      }.bind(this));
    },

    /**
     * returns image url will get from either local image or will get from server and save as local then give url
     * @param {String} artId
     */
    fetchImage: function (artId) {
      return new Promise(function (resolve, reject) {
        app.fs.root.getFile(artId + '.jpg', {
          create: false,
          exclusive: true
        }, function(fileEntry) {
          resolve(fileEntry.toURL());
        }.bind(this), function () {
          var url = this.buildUrl('getCoverArt', {
            size: 550,
            id: artId
          });
          this.getImageFile(url, artId).then(function (imgURL) {
            this.stealColor(imgURL, artId);
            resolve(imgURL);
          }.bind(this));
        }.bind(this));
      }.bind(this));
    },


    /**
     * capture color palette from image and store in indexeddb
     * @param {String} imgURL
     * @param {String} artId
     * @param {Function} callback - returns an array of colors
     */
    stealColor: function (imgURL, artId) {
      return new Promise(function (resolve, reject) {
        var imgElement = new Image();
        imgElement.src = imgURL;
        imgElement.onload = function () {
          var color = getColor(imgElement);
          var colorArray = [];
          var r = color[1][0];
          var g = color[1][1];
          var b = color[1][2];
          colorArray[0] = 'rgb(' + r + ',' + g + ',' + b + ');';
          colorArray[1] = getContrast50(rgbToHex(r, g, b));
          colorArray[2] = 'rgba(' + r + ',' + g + ',' + b + ',0.4);';
          if (colorArray[1] !== 'white') {
            colorArray[3] = '#444444';
          } else {
            colorArray[3] = '#c8c8c8';
          }
          this.putInDb(colorArray, artId + '-palette').then(resolve);
        }.bind(this);
      }.bind(this));
    },
    
    notify: function (string, icon) {
      console.log(string, icon);
    },

    /**
     * generate a subsonic url string
     * @param {String} method
     * @param {Object} options
     */
    buildUrl: function(method, options) {
      if (options !== null && typeof options === 'object') {
        options = '&' + toQueryString(options);
      }
      if (app.user !== app.params.u) {
        app.params.u = app.user;
      }
      if (app.version !== app.params.v) {
        app.params.v = app.version;
      }
      if (!options) {
        options = '';
      }
      if (versionCompare(app.version, '1.13.0') >= 0 && app.md5Auth) {
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
    }
  });

})();
