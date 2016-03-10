(function () {
  var app = app = document.getElementById("tmpl");

  var wall = document.getElementById("wall");

  Polymer('settings-menu',{

    post: {
      bitRate: this.bitRate || 320
    },

    _manifest: chrome.runtime.getManifest(),

    _speeds: [
      96,
      128,
      192,
      256,
      320
    ],

    _querySizes: [
      20,
      30,
      40,
      50,
      60,
      120
    ],

    _setQuerySize: function () {
      this.async(function () {
        simpleStorage.setSync({
          querySize: app.querySize
        });
      });
    },

    _queryMethods: [
      'ID3',
      'Folder'
    ],

    _timer: 0,

    elementReady: false,

    domReady: function () {
      this.app = app;
      this._outputVersion(this._manifest);
      this.elementReady = true;
      this.$.editorMD5.hidden = false;
    },

    _outputVersion: function (manifest) {
      this.polysonicVersion = manifest.version;
      console.log('App version: ' + this.polysonicVersion);
    },

    _authChanged: function (e) {
      var element = e.target;
      simpleStorage.setSync({
        md5Auth: element.checked
      });
    },

    validateInputs: function () {
      var $d = this.$.validate.querySelectorAll('paper-input-decorator');
      Array.prototype.forEach.call($d, function(d) {
        d.isInvalid = !d.querySelector('input').validity.valid;
      });
    },

    _submit: function () {
      this.validateInputs();
      if (this.invalidAddress && this.inValidName && this.invalidPassword) {
        this.$.globals.makeToast("URL, Username & Password Required");
      } else if (this.invalidAddress) {
        this.$.globals.makeToast("URL Required");
      } else if (this.inValidName) {
        this.$.globals.makeToast("Username Required");
      } else if (this.inValidPassword) {
        this.$.globals.makeToast("Password Required");
      }
      if (!this.invalidAddress && !this.inValidName && !this.inValidPassword) {
        var lastChar = this.post.url.substr(-1); // Selects the last character
        if (lastChar === '/') {         // If the last character is a slash
          this.post.url = this.post.url.substring(0, this.post.url.length - 1);  // remove the slash from end of string
        }
        this.isLoading = true;
        this._testPostSettings().then(function (response) {
          if (response.status === 'ok') {
            simpleStorage.getSync('configs').then(function (configs) {
              configs.push({
                name: this.post.name,
                url: this.post.url,
                user: this.post.user,
                pass: this.post.pass,
                md5Auth: this.post.md5Auth,
                version: this.post.version
              });
              simpleStorage.setSync({
                configs:configs
              });
              this.app.configs = configs;
              this.$.globals.makeToast("Config Saved");
              this.newConfig = !Boolean(this.app.configs[this.post.config]);
              this._setFormDisabledState(!this.newConfig);
              this.isLoading = false;
            }.bind(this));
          } else if (response.status === 'failed') {
            this.$.globals.makeToast(this._response['subsonic-response'].error.message);
            this.isLoading = false;
          } else  {
            this.$.connectionError.open();
            this.$.globals.makeToast("Error Connecting to Server. Check Settings");
            this.isLoading = false;
          }
        }.bind(this), function () {
          this.$.connectionError.open();
          this.$.globals.makeToast("Error Connecting to Server. Check Settings");
          this.isLoading = false;
        }.bind(this));
      }
    },

    _saveAnyway: function () {
      this.$.connectionError.close();
      this.isLoading = true;
      simpleStorage.getSync('configs').then(function (configs) {
        configs.push({
          name: this.post.name,
          url: this.post.url,
          user: this.post.user,
          pass: this.post.pass,
          md5Auth: this.post.md5Auth,
          version: this.post.version
        });
        simpleStorage.setSync({
          configs:configs
        });
        this.app.configs = configs;
        this.$.globals.makeToast("Config Saved");
        this.newConfig = !Boolean(this.app.configs[this.post.config]);
        this._setFormDisabledState(!this.newConfig);
        this.isLoading = false;
      }.bind(this));
    },

    _hidePass: function (event, detail, sender) {
      var type = this.$.password.type,
        button = this.$.showPass,
        timer = this._timer;

      if (type === "text") {
        this.$.password.type = "password";
        button.innerHTML = this.$.globals.texts.showPass;
        if (timer) {
          clearTimeout(timer);
          timer = 0;
        }
      } else {
        this.$.password.type = "text";
        button.innerHTML = this.$.globals.texts.hideThePass;
        timer = setTimeout(function () {
          this.$.password.type = "password";
          button.innerHTML = this.$.globals.texts.showPass;
          timer = 0;
        }.bind(this), 15000);
      }
    },

    _clearImages: function () {
      return new Promise(function (resolve, reject) {
        app.fs.root.getDirectory(encodeURIComponent(app.url), {}, function (dir) {
          dir.removeRecursively(function (e) {
            app.db.close();
            var req = indexedDB.deleteDatabase(app.dbname);
            req.onsuccess = resolve;
            req.onerror = reject;
            req.onblocked = reject;
          }, reject);
        }, reject);
      });
    },

    _confirmDelete: function () {
      this.$.confirmDelete.open();
    },


    _clearCache: function () {
      app.dataLoading = true;
      this._clearImages()
      .then(app.$.globals.openIndexedDB)
      .then(app.$.globals.initFS)
      .then(app.calculateStorageSize)
      .then(function () {
        this.$.globals.makeToast('Cache cleared');
        app.dataLoading = false;
      }.bind(this));
    },

    _clearSettings: function () {
      this._clearImages().then(function () {
        chrome.storage.sync.clear();
        chrome.storage.local.clear();
        app.$.reloadAppDialog.open();
      }, function () {
        this.$.globals.makeToast('Error deleteing Database');
      }.bind(this));
    },

    _bitRateSelect: function () {
      this.async(function () {
        simpleStorage.setLocal({
          'bitRate': this.app.bitRate
        });
        console.log('Bitrate: ' + this.app.bitRate);
      });
    },

    _queryMethodSelect: function () {
      app.dataLoading = true;
      this.async(function () {
        this._clearImages().then(function () {
          app.$.globals.openIndexedDB().then(function () {
            app.$.globals.initFS();
            app.dataLoading = false;
            switch (app.$.wall.request) {
              case ('getIndexes'):
                app.$.wall.getArtist();
                break;
              case ('getArtists'):
                app.$.wall.getArtist();
                break;
              case ('getAlbumList'):
                app.$.wall.sortChanged();
                break;
              case ('getAlbumList2'):
                app.$.wall.sortChanged();
                break;
              case ('getStarred'):
                app.$.wall.getStarred();
                break;
              case ('getStarred2'):
                app.$.wall.getStarred();
                break;
            }
            simpleStorage.setSync({
              queryMethod: app.queryMethod
            });
          });
        });
      });
    },

    _errorChanged: function () {
      if (this._error.statusCode === 0) {
        this.$.globals.makeToast(chrome.i18n.getMessage('connectionError'));
      }
    },

    _defaultConfigs: function () {
      if ("config" in this) {
        simpleStorage.getSync('configs').then(function (configs) {
          if (configs) {
            var index = 0;
            if ('post' in this && 'config' in this.post) {
              index = this.post.config;
            } else {
              index = this.config;
            }
            var config = configs[index];
            this.post = config;
            this.post.config = index;
          } else {
            this.post = {};
            this.post.config = 0;
          }
        }.bind(this));
      }
    },

    _setConfig: function () {
      return new Promise(function (resolve, reject) {
        var post = this.post;
        for (var key in post) {
          app[key] = post[key];
        }
        resolve();
      }.bind(this));
    },

    _cancelAttempt: function () {
      this.isLoading = false;
      app.dataLoading = false;
      app.lastRequest.abort();
      this.async(function () {
        this._setFormDisabledState(true);
      }, null, 500);
    },

    _testPostSettings: function () {
      return new Promise(function (resolve, reject) {
        var params = {
          u: this.post.user,
          v: this.post.version || '1.11.0',
          f: 'json',
          c: 'PolySonic'
        };
        if (versionCompare(this.post.version, '1.13.0') >= 0 && this.post.md5Auth) {
          params.s = this.$.globals.makeSalt(16);
          params.t = md5(this.post.pass + params.s);
        } else {
          params.p = this.post.pass.hexEncode();
        }
        var url = this.post.url + '/rest/ping.view?' + this.$.globals.toQueryString(params);
        app.$.globals.doXhr(url, 'json').then(function (e) {
          resolve(e.target.response['subsonic-response']);
        }, reject);
      }.bind(this));
    },

    _useThis: function () {
      this.isLoading = true;
      app.folder = 'none';
      this._testPostSettings().then(function (response) {
        if (response.status === 'ok') {
          if (app.$.player.audio && !app.$.player.audio.paused) {
            app.$.player.audio.pause();
          }
          app.playlist = [];
          app.currentConfig = this.post.config;
          simpleStorage.setLocal({
            currentConfig: app.currentConfig
          });
          this.isLoading = false;
          app.dataLoading = true;
          this._clearImages()
          .then(this._setConfig.bind(this))
          .then(this.$.globals.openIndexedDB)
          .then(this.$.globals.initFS)
          .then(app.userDetails)
          .then(function () {
            console.log('Connected with config ' + app.configs[app.currentConfig].name);
            var folders = app.$.globals.buildUrl('getMusicFolders');
            app.$.globals.doXhr(folders, 'json').then(function (e) {
              app.mediaFolders = e.target.response['subsonic-response'].musicFolders.musicFolder;
              if (app.mediaFolders === undefined || !app.mediaFolders[1]) {
                app.$.sortBox.style.display = 'none';
              } else {
                app.$.sortBox.style.display = 'block';
              }
              app.$.wall.refreshContent();
              app.dataLoading = false;
              this.async(function () {
                this._setFormDisabledState(true);
              }, null, 500);
            }.bind(this));
          }.bind(this));
        } else {
          this.isLoading = false;
          console.log(response);
          this.$.globals.makeToast('Error connecting with config ' + app.configs[this.post.config].name);
        }
      }.bind(this), function () {
        this.isLoading = false;
        this.$.globals.makeToast('Error connecting with config ' + app.configs[this.post.config].name);
      }.bind(this));
    },

    _53orGreater: function (version) {
      if (versionCompare(version, '1.13.0') >= 0) {
        return true;
      } else {
        return false;
      }
    },

    postChanged: function () {
      if ('post' in this) {
        this.async(this.validateInputs, null, 200);
        if ('post' in this && 'version' in this.post && this._53orGreater(this.post.version)) {
          this.$.editorMD5.hidden = false;
        }
        if ('config' in this.post) {
          this.newConfig = !Boolean(this.app.configs[this.post.config]);
          this._setFormDisabledState(!this.newConfig);
        }
      }
    },

    _setFormDisabledState: function (state) {
      this.validateInputs();
      this.$.md5.disabled = state;
      var inputs = this.$.validate.querySelectorAll('paper-input-decorator');
      for (var i = 0; i < inputs.length; i++) {
        inputs[i].disabled = state;
        inputs[i].querySelector('input').disabled = state;
      }
    },

    _editConfig: function () {
      this.isLoading = true;
      this._setFormDisabledState(false);
      this.isLoading = false;
      this.editing = true;
    },

    _exportConfig: function () {
      simpleStorage.getSync('configs').then(function (configs) {
        var toSave = configs[this.post.config];
        if ('config' in toSave) {
          delete toSave.config;
        }
        chrome.fileSystem.chooseEntry({
          type: 'saveFile',
          suggestedName: toSave.name + ' config.cfg'
        }, function (writableEntry) {
          if (writableEntry) {
            var blob = new Blob([
              btoa(
                JSON.stringify(toSave)
              )
            ], {
              type: 'text/js'
            });
            this.$.globals._writeFileEntry(
              writableEntry,
              blob
            ).then(function () {
              this.$.globals.makeToast("Export Complete");
              this.async(function () {
                this._setFormDisabledState(true);
              }, null, 500);
            }.bind(this));
          } else {
            this.$.globals.makeToast('Error Saving Config');
            this.async(function () {
              this._setFormDisabledState(true);
            }, null, 500);
            console.error('Error Saving Config', e);
          }
        }.bind(this));
      }.bind(this));
    },

    _selectConfigFile: function () {
      chrome.fileSystem.chooseEntry({
        type: 'openFile',
        accepts: [
          {
            mimeTypes: [
              'text/js'
            ],
            extensions: [
              'cfg'
            ]
          }
        ]
      }, function(theEntry) {
        if (theEntry) {
          this.$.globals.loadFileEntry(theEntry).then(function (encodedText) {
            var decodedText = atob(encodedText);
            var imported = JSON.parse(decodedText);
            if  (imported.user && imported.url && imported.pass
                 && imported.name && imported.md5Auth && imported.version) {
              for (var key in imported) {
                this.post[key] = imported[key];
              }
              this.async(this.validateInputs);
            } else {
              this.$.globals.makeToast('Error Importing Config');
            }
          }.bind(this));
        }
      }.bind(this));
    },

    _saveEdits: function () {
      this.isLoading = true;
      this.validateInputs();
      this.async(function () {
        this._setFormDisabledState(true);
      }, null, 200);
      if  (this._isValidData()) {
        simpleStorage.getSync().then(function (storage) {
          var configUpdating = storage.configs[this.post.config]
          for (var key in configUpdating) {
            configUpdating[key] = this.post[key];
          }
          simpleStorage.setSync({
            configs: storage.configs
          });
          this.app.configs = storage.configs;
          this.isLoading = false;
          this.editing = false;
          //  updating the config currently  in use
          if (this.post.config === this.app.currentConfig) {
            // if md5 authrntication setting has changed it must be updated
            if (this.app.md5Auth !== this.post.md5Auth) {
              this.app.md5Auth = this.post.md5Auth;
            }
            // if the URL has changed it must be tested and caches cleard
            if (this.app.url !== this.post.url) {
              this._testPostSettings().then(function (response) {
                if (response.status === 'ok') {
                  this._clearImages()
                  .then(this._setConfig.bind(this))
                  .then(this.$.globals.openIndexedDB)
                  .then(this.$.globals.initFS)
                  .then(app.userDetails)
                  .then(function () {
                    console.log('config ' + this.app.configs[this.app.currentConfig].name + ' Refreshed');
                    var folders = app.$.globals.buildUrl('getMusicFolders');
                    this.$.globals.doXhr(folders, 'json').then(function (e) {
                      app.folder = 'none';
                      app.mediaFolders = e.target.response['subsonic-response'].musicFolders.musicFolder;
                      if (app.mediaFolders === undefined || !app.mediaFolders[1]) {
                        app.$.sortBox.style.display = 'none';
                      } else {
                        app.$.sortBox.style.display = 'block';
                      }
                      app.tracker.sendAppView('Album Wall');
                      this.isLoading = false;
                    }.bind(this));
                  }.bind(this)).catch(function (err) {
                    throw new Error(err);
                    this.isLoading = false;
                  });
                } else {
                  this.isLoading = false;
                  this.$.globals.makeToast('Error connecting to Subsonic. Check Settings');
                }
              }.bind(this));
            }
          }
        }.bind(this));
      } else {
        this.isLoading = false;
        this.$.globals.makeToast("Valid URL, Username & Password Required");
      }
    },

    _isValidData: function () {
      if (!this.inValidAddress && !this.inValidName && !this.inValidPassword) {
        return true;
      } else {
        return false;
      }
    },

    _cancelEdit: function () {
      this.isLoading = true;
      this._setFormDisabledState(true);
      this.isLoading = false;
      this.editing = false;
      this.validateInputs();
      this._defaultConfigs();
    },

    _checkKeyup: function (e) {
      this.validateInputs();
      if (e.keyIdentifier === "Enter") {
        if (this.editing && !this.newConfig) {
          this._saveEdits();
        } else if (!this.editing && this.newConfig) {
          this._submit();
        }
      }
    },

    _select: function () {
      var clicked = this.post.config;
      var config = this.app.configs[this.post.config];
      if (config) {
        this.post = config;
        this.post.config = clicked;
      }
    },

    _selectAction: function () {
      this.async(this._select);
    },

    _deleteConfig: function () {
      simpleStorage.getSync('configs').then(function (configs) {
        var beforeChange = configs[this.app.currentConfig].name;
        configs.splice(this.post.config, 1);
        // find the config currently being used
        for (var i = 0; i < configs.length; i++) {
          if (configs[i].name === beforeChange) {
            this.app.currentConfig = i;
            this.post.config = i;
          }
        }
        // save changes
        simpleStorage.setSync({
          configs: configs
        });
        simpleStorage.setLocal({
          currentConfig: this.app.currentConfig
        });
        this.app.configs = configs;
        this.async(this._select);
      }.bind(this));
    },

    _testUrl: function (event) {
      var input = event.target;
      this.$.url.isInvalid = !this.$.url.querySelector('input').validity.valid;
      if (!this.$.url.isInvalid) {
        this.testingURL = true;
        var xhr = new XMLHttpRequest();
        var lastChar = input.value.substr(-1); // Selects the last character
        if (lastChar === '/') {         // If the last character is a slash
          input.value = input.value.substring(0, input.value.length - 1);  // remove the slash from end of string
        }
        xhr.open("GET", input.value + '/rest/ping.view?f=json', true);
        xhr.responseType = 'json';
        xhr.onload = function (e) {
          var json = e.target.response['subsonic-response'];
          this.post.version = json.version;
          if (this._53orGreater(json.version)) {
            this.$.editorMD5.hidden = false;
            this.post.md5Auth = true;
          }
          this.testingURL = false;
          this.attempt = false;
        }.bind(this);

        xhr.onerror = function (e) {
          this.testingURL = false;
          this.attempt = false;
        }.bind(this);
        // cancel previous attempts
        if (this.attempt) {
          this.attempt.abort();
        }
        // send result and tag the attempt
        xhr.send();
        this.attempt = xhr;
      }
    },

    _newConfig: function () {
      this.post = {};
      var configLength = app.configs.length
      this.post.config = configLength;
      this.post.version = '1.11.0';
      this.post.name = 'Config' + Math.abs(configLength + 1);
      this.$.editorMD5.hidden = true;
    },

    configChanged: function () {
      this.async(this._defaultConfigs);
    },

    querySizeChanged: function () {
      this.post.querySize = this.querySize;
    },

    queryMethodChanged: function () {
      this.post.queryMethod = this.queryMethod;
    },

    _showQuota: function () {
      app.calculateStorageSize();
      this.$.quota.toggle();
    },

    linkGo: function (event, detail, sender) {
      var url = sender.attributes.link.value;
      window.open(url, '_blank');
    },

    _analisticsToggle: function () {
      simpleStorage.setSync({
        'analistics': app.analisticsEnabled
      });
    },

    _getLicense: function (event, detail, sender) {
      var animation = this.$.globals.attachAnimation(sender);
      animation.play();
      app.getLicense(function () {
        animation.cancel();
      });
    },

    _toggleAutobookmark: function () {
      simpleStorage.setSync({
        autoBookmark: app.autoBookmark
      });
    },

    _toggleGapless: function () {
      simpleStorage.setSync({
        gapless: app.gapless
      });
    }
  });
})();
