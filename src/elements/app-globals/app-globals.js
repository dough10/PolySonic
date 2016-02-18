(function () {
  'use strict';

  var app = document.querySelector('#tmpl');

  window.requestFileSystem  = window.requestFileSystem || window.webkitRequestFileSystem;

  var indexedDB = window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB || window.OIndexedDB || window.msIndexedDB;

  var dbVersion = 1.0;

  var dbName = 'metaData';
  app.dbname = dbName;

  function createObjectStore(dataBase) {
    console.log("Creating objectStore");
    dataBase.createObjectStore(dbName);
  }
  app.createObjectStore = createObjectStore;

  var db;

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
    }, fsErrorHandler);
  }

  /**
   * fileSystem error callback
   */
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

  /**
   * initalize filesystem
   */
  function onInitFs(fs) {
    app.filePath = encodeURIComponent(app.url) + '/' + encodeURIComponent(app.user);
    app.fs = fs;
    fs.root.getDirectory(app.filePath, {create: true}, function(dirEntry) {
      console.log('Opened file system: ' + fs.name + '/' + app.filePath);
    }, function () {
      console.log('Creating file system: ' + fs.name + '/' + app.filePath);
      createDir(fs.root, app.filePath.split('/'));
    });
  }

  /**
   * return chrome localization string
   */
  function getMessage(id) {
    return chrome.i18n.getMessage(id);
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

  /**
   *  polymer things
   */
  Polymer('app-globals', {
    /**
     * localization texts
     */
    texts: {
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
      label: getMessage('nowPlayingTitle'),
      appName: getMessage("appName"),
      appDesc: getMessage("appDesc"),
      folderSelector: getMessage("folderSelector"),
      shuffleButton: getMessage("shuffleButton"),
      artistButton: getMessage("artistButton"),
      podcastButton: getMessage("podcastButton"),
      favoritesButton: getMessage("favoritesButton"),
      searchButton: getMessage("searchButton"),
      settingsButton: getMessage("settingsButton"),
      nowPlayingLabel: getMessage("nowPlayingLabel"),
      folderSelectorLabel: getMessage("folderSelectorLabel"),
      clearQueue: getMessage("clearQueue"),
      volumeLabel: getMessage("volumeLabel"),
      analistics: getMessage("analistics"),
      shuffleOptionsLabel: getMessage("shuffleOptionsLabel"),
      optional: getMessage("optional"),
      artistLabel: getMessage("artistLabel"),
      albumLabel: getMessage("albumLabel"),
      genreLabel: getMessage("genreLabel"),
      songReturn: getMessage("songReturn"),
      playButton: getMessage("playButton"),
      yearError: getMessage("yearError"),
      releasedAfter: getMessage("releasedAfter"),
      releasedBefore: getMessage("releasedBefore"),
      submitButton: getMessage("submitButton"),
      deleteConfirm: getMessage("deleteConfirm"),
      urlError: getMessage("urlError"),
      podcastSubmissionLabel: getMessage("podcastSubmissionLabel"),
      diskUsed: getMessage("diskUsed"),
      diskRemaining: getMessage("diskRemaining"),
      playlistsButton: getMessage("playlistsButton"),
      createPlaylistLabel: getMessage("createPlaylistLabel"),
      playlistLabel: getMessage("playlistLabel"),
      reloadAppLabel: getMessage("reloadApp"),
      settingsDeleted: getMessage("settingsDeleted"),
      recommendReload: getMessage("recommendReload"),
      jumpToLabel: getMessage("jumpToLabel"),
      refreshPodcastLabel: getMessage("refreshPodcast"),
      registeredEmail: getMessage("registeredEmail"),
      licenseKey: getMessage("licenseKey"),
      keyDate: getMessage("keyDate"),
      validLicense: getMessage("validLicense"),
      invalidLicense: getMessage("invalidLicense"),
      adjustVolumeLabel: getMessage("adjustVolumeLabel"),
      showDownloads: getMessage('showDownloads'),
      shuffleList: getMessage('shuffleList'),
      randomized: getMessage('randomized'),
      markCreated: getMessage('markCreated'),
      bookmarks: getMessage('bookmarks'),
      createBookmarkText: getMessage('createBookmark'),
      toggleList: getMessage('toggleList'),
      playlists: getMessage('playlists'),
      downloads: getMessage('downloads'),
      repeatText: getMessage('repeatText'),
      md5: getMessage('md5'),
      precache: getMessage('precache'),
      urlLabel: getMessage("urlLabel"),
      usernameError: getMessage("usernameError"),
      usernameLabel: getMessage("usernameLabel"),
      passwordLabel: getMessage("passwordLabel"),
      showPass: getMessage("showPass"),
      hideThePass: getMessage("hidePass"),
      bitrateLabel: getMessage('bitrateLabel'),
      anonStats: getMessage('anonStats'),
      autoBookmark: getMessage('autoBookmark'),
      cacheDetails: getMessage("cacheDetails"),
      clearCacheLabel: getMessage("clearCacheLabel"),
      clearSettingsLabel: getMessage("clearSettingsLabel"),
      licenseInfoLink: getMessage("licenseInfoLink"),
      showLicenseLabel: getMessage("showLicenseLabel"),
      configLabel: getMessage('configLabel'),
      useThis: getMessage('useThis'),
      testButton: getMessage('testButton'),
      moreByArtist: getMessage('moreByArtist')
    },

    openIndexedDB: function () {
      return new Promise(function (resolve, reject) {
        var request = indexedDB.open(dbName, dbVersion);

        request.onerror = function () {
          reject();
          console.log("Error creating/accessing IndexedDB database");
        };

        request.onsuccess = function () {
          console.log("Success creating/accessing IndexedDB database");
          db = this.result;
          app.db = db;

          // Interim solution for Google Chrome to create an objectStore. Will be deprecated
          if (db.setVersion) {
            if (db.version !== dbVersion) {
              var setVersion = db.setVersion(dbVersion);
              setVersion.onsuccess = function () {
                resolve();
                createObjectStore(db);
              };
            }
          }
        };

        request.onupgradeneeded = function (event) {
          resolve();
          createObjectStore(event.target.result);
        };
      });
    },

    initFS: function () {
      navigator.webkitPersistentStorage.requestQuota(1024*1024*512, function(grantedBytes) {
        window.requestFileSystem(PERSISTENT, grantedBytes, onInitFs, fsErrorHandler);
      }, function(e) {
        console.log('Error', e);
      });
    },
    
    formatBytes: function (bytes) {
      if (bytes < 1024) return bytes + ' Bytes';
      else if (bytes < 1048576) return (bytes / 1024).toFixed(2) + ' KB';
      else if (bytes < 1073741824) return (bytes / 1048576).toFixed(2) + ' MB';
      else return (bytes / 1073741824).toFixed(2) + ' GB';
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
     */
    doXhr: function (url, dataType) {
      return new Promise(function (resolve, reject) {
        var xhr = new XMLHttpRequest();
        xhr.open("GET", url, true);
        xhr.responseType = dataType;
        xhr.onload = resolve;
        xhr.onerror = function xhrError(e) {
          reject(e);
          app.$.globals.makeToast(getMessage("connectionError"));
          if (!document.querySelector('#loader').classList.contains("hide")) {
            app.$.firstRun.open();
          }
          app.dataLoading = false;
          console.error(e);
        };
        xhr.send();
      });
    },


    /**
     * store object in indexeddb
     * @param {Object} data
     * @param {String} id
     * @param {Function} callback
     */
    _putInDb: function (data, id) {
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
          console.time('get ' + id);
          var transaction = db.transaction([dbName], "readwrite");
          var request = transaction.objectStore(dbName).get(id);
          request.onsuccess = function (e) {
            console.timeEnd('get ' + id);
            resolve(e);
          };
          request.onerror = reject;
        }
      });
    },


    /**
     * Fetch image from subsonic server and store it in HTML5 filesystem
     * @param {String} url
     * @param {String} id
     */
    _getImageFile: function (url, id) {
      return new Promise(function (resolve, reject) {
        var fileName = id + '.jpg';
        this.doXhr(url, 'blob').then(function (e) {
          app.fs.root.getFile(app.filePath + '/' + fileName, {create: true}, function(fileEntry) {
            fileEntry.createWriter(function(fileWriter) {

              fileWriter.onwriteend = function(e) {
                app.fs.root.getFile(app.filePath + '/' + fileName, {create: false}, function(retrived) {
                  resolve(retrived.toURL());
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
     * fetch header image. either from HTML filesystem or from internet
     * @param {String} url - url to the image we want to use for the header
     * @param {Number} artistId - artist id from subsonic server
     */
    _fetchArtistHeaderImage: function (url, artistId) {
      return new Promise(function (resolve, reject) {
        app.fs.root.getFile(app.filePath + '/artist-' + artistId + '.jpg', {
          create: false,
          exclusive: true
        }, function (fileEntry) {
          this.getDbItem('artist-' + artistId + '-palette').then(function (e) {
            var colors = e.target.result;
            resolve({
              url: fileEntry.toURL(),
              fabBgColor: colors[0],
              fabColor: colors[1]
            });
          }.bind(this));
        }.bind(this), function () {
          this.doXhr(url, 'blob').then(function (xhrEvent) {
            var blob = xhrEvent.target.response;
            var image = window.URL.createObjectURL(blob);
            this._saveArtistImage(blob, artistId);
            this._stealColor(image, 'artist-' + artistId).then(function (colors) {
              resolve({
                url: image,
                fabBgColor: colors[0],
                fabColor: colors[1]
              });
            });
          }.bind(this));
        }.bind(this));
      }.bind(this));
    },

    /**
     * use smartCrop to attempt to get a well centered header image
     * @param {String} image - url to the image we are attempting to crop
     */
    _cropImage: function (image) {
      return new Promise(function (resolve, reject) {
        var containerWidth = 808;
        var parts = Math.abs(containerWidth / 21);
        var height = Math.abs(parts * 9);
        var imgEl = new Image();
        imgEl.src = image;
        imgEl.onload = function imgLoaded() {
          SmartCrop.crop(imgEl, {
            width: containerWidth,
            height: height
          }, function imgCropped(crops) {
            var canvas = document.createElement('canvas');
            canvas.width = containerWidth;
            canvas.height = height;
            var ctx = canvas.getContext('2d');
            var crop = crops.crops[1];
            ctx.drawImage(imgEl, crop.x, crop.y, crop.width, crop.height, 0, 0, containerWidth, height);
            resolve(canvas.toDataURL('image/jpg'));
          });
        };
      });
    },


    /**
     *
     */
    _saveArtistImage: function (file, artistId) {
      return new Promise(function (resolve, reject) {
        var fileName = app.filePath + '/artist-' + artistId + '.jpg';
        app.fs.root.getFile(fileName, {
          create: true
        }, function(fileEntry) {
          fileEntry.createWriter(function(fileWriter) {
            fileWriter.onwriteend = function(e) {
              app.fs.root.getFile(fileName, {
                create: false
              }, function(retrived) {
                resolve(retrived.toURL());
              });
            };
            fileWriter.onerror = function(e) {
              console.log('Write failed: ' + e.toString());
            };
            var blob = new Blob([ file ], { type: 'image/jpeg' });
            fileWriter.write(blob);
          }, fsErrorHandler);
        }, fsErrorHandler);
      });
    },

    /**
     * returns image url will get from either local image or will get from server and save as local then give url
     * @param {String} artId
     */
    fetchImage: function (artId) {
      return new Promise(function (resolve, reject) {
        app.fs.root.getFile(app.filePath + '/' + artId + '.jpg', {
          create: false,
          exclusive: true
        }, function(fileEntry) {
          resolve(fileEntry.toURL());
        }.bind(this), function () {
          var url = this.buildUrl('getCoverArt', {
            size: 550,
            id: artId
          });
          this._getImageFile(url, artId).then(function (imgURL) {
            this._stealColor(imgURL, artId).then(function () {
              resolve(imgURL);
            });
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
    _stealColor: function (imgURL, artId) {
      return new Promise(function (resolve, reject) {
        if (artId) {
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
            this._putInDb(colorArray, artId + '-palette').then(resolve);
          }.bind(this);
        }
      }.bind(this));
    },
    
    /**
     * will play a playlist item with the given index
     * @param {Number} index
     */
    playListIndex: function (index) {
      if (app.playing === index) {
        app.$.player.playAudio(app.playlist[index]);
      } else {
        app.playing = index;
      }
    },


    changeConfig: function (index) {
      if (app.configs[index]) {
        var url = app.configs[index].url;
        var pass = app.configs[index].pass;
        var md5Auth = app.configs[index].md5Auth;
        var params = {
          u: app.configs[index].user,
          v: app.configs[index].version,
          f: 'json',
          c: 'PolySonic'
        };


        if (versionCompare(params.v, '1.13.0') >= 0 && md5Auth) {
          params.s = makeSalt(16);
          params.t = md5(pass + params.s);
        } else {
          params.p = pass.hexEncode();
        }

        var ping = url + '/rest/ping.view?' +  toQueryString(params);

        this.doXhr(ping, 'json').then(function (json) {
          json = json.target.response['subsonic-response'];
          if (json.status === 'ok') {

            app.url = app.configs[index].url;
            app.user = app.configs[index].user;
            app.pass = app.configs[index].pass;
            app.md5Auth = app.configs[index].md5Auth;
            app.version = json.version;
            this.makeToast('Config Changed');

          }
        }.bind(this), function (e) {
          this.makeToast('Error connecting this that config');
        }.bind(this)).catch(function () {
          this.makeToast('Error connecting this that config');
        }.bind(this));
      }
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
