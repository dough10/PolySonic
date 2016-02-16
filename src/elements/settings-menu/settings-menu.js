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
      'use strict';
      var $d = this.$.validate.querySelectorAll('paper-input-decorator');
      Array.prototype.forEach.call($d, function(d) {
        d.isInvalid = !d.querySelector('input').validity.valid;
      });
    },

    _submit: function () {
      'use strict';
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
        this.$.ajax.go();
      }
    },

    _hidePass: function (event, detail, sender) {
      'use strict';
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


    _responseChanged: function () {
      'use strict';
      console.log(this._response['subsonic-response']);
      if (this._response) {
        if (this._response['subsonic-response'].status === 'ok') {
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
          }.bind(this));
        } else if (this._response['subsonic-response'].status === 'failed') {
          this.$.globals.makeToast(this._response['subsonic-response'].error.message);
        } else  {
          this.$.globals.makeToast("Error Connecting to Server. Check Settings");
        }
      }
    },

    _clearImages: function () {
      return new Promise(function (resolve, reject) {
        app.fs.root.getDirectory(encodeURIComponent(app.url), {}, function (dir) {
          dir.removeRecursively(function (e) {
            app.$.globals.makeToast('image cache cleared');
            app.db.close();
            var req = indexedDB.deleteDatabase(app.dbname);
            req.onsuccess = resolve;
            req.onerror = reject;
            req.onblocked = reject;
          }, function (e) {
            reject(e)
          });
        });
      });
    },


    _clearCache: function () {
      app.dataLoading = true;
      this._clearImages().then(app.$.globals.openIndexedDB).then(function () {
        app.$.globals.initFS();
        app.calculateStorageSize();
        this.$.globals.makeToast('Cache cleared');
        app.dataLoading = false;
      }.bind(this));
    },

    _clearSettings: function () {
      this._clearImages().then(function () {
        chrome.storage.sync.clear();
        app.url = '';
        app.user = '';
        app.pass = '';
        app.version = '';
        app.bitRate = '';
        app.querySize = '';
        app.$.reloadAppDialog.open();
      }, function () {
        this.$.globals.makeToast('Error deleteing Database');
      }.bind(this));
    },

    _bitRateSelect: function () {
      this.async(function () {
        simpleStorage.setLocal({
          'bitRate': this.post.bitRate
        });
        app.bitRate = this.post.bitRate;
        console.log('Bitrate: ' + this.post.bitRate);
      });
    },

    _errorChanged: function () {
      if (this._error.statusCode === 0) {
        this.$.globals.makeToast(chrome.i18n.getMessage('connectionError'));
      }
    },

    _defaultConfigs: function () {
      if ("config" in this) {
        simpleStorage.getSync().then(function (storage) {
          var index = 0;
          if ('post' in this && 'config' in this.post) {
            index = this.post.config;
          } else {
            index = this.config;
          }
          var config = storage.configs[index];
          this.post = config;
          this.post.config = index;
          this.post.bitRate = this.bitRate;
        }.bind(this));
      }
    },

    _useThis: function () {
      var last = app.currentConfig;
      this.isLoading = true;
      app.dataLoading = true;
      app.user = this.post.user;
      app.url = this.post.url;
      app.pass = this.post.pass;
      app.version = this.post.version;
      app.md5Auth = this.post.md5Auth;
      if (app.$.player.audio && !app.$.player.audio.paused) {
        app.$.player.audio.pause();
      }
      app.playlist = [];
      app.currentConfig = this.post.config;
      simpleStorage.setLocal({
        currentConfig: app.currentConfig
      });
      //
      this._clearImages().then(function () {
        console.log('caches cleared');
        app.$.globals.openIndexedDB().then(function () {
          app.$.globals.initFS();
          var firstPing = app.$.globals.buildUrl('ping');
          app.$.globals.doXhr(firstPing, 'json').then(function (e) {
            if (e.target.response['subsonic-response'].status === 'ok') {
              app.userDetails();
              console.log('Connected with config ' + app.configs[app.currentConfig].name);
              var folders = app.$.globals.buildUrl('getMusicFolders');
              app.$.globals.doXhr(folders, 'json').then(function (e) {
                app.mediaFolders = e.target.response['subsonic-response'].musicFolders.musicFolder;
                app.folder = 'none';
                if (app.mediaFolders === undefined || !app.mediaFolders[1]) {
                  app.$.sortBox.style.display = 'none';
                }
                this.isLoading = false;
                app.$.wall.refreshContent();
              }.bind(this));
            } else {
              this.isLoading = false;
              this.$.globals.makeToast(e.target.response['subsonic-response'].error.message);
            }
          }.bind(this));
        }.bind(this));
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
        if ('version' in this.post && this._53orGreater(this.post.version)) {
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
          if (this.post.config === this.app.currentConfig) {
            var editedURL = this.app.url !== this.post.url;
            if (editedURL) {
              this._clearImages();
            }
            this.app.url = this.post.url;
            this.app.user = this.post.user;
            this.app.pass = this.post.pass;
            this.app.version = this.post.version;
            this.app.md5Auth = this.post.md5Auth;
            if (editedURL) {
              this.async(function () {
                this.app.$.globals.initFS();
                var firstPing = this.app.$.globals.buildUrl('ping');
                this.app.$.globals.doXhr(firstPing, 'json').then(function (e) {
                  if (e.target.response['subsonic-response'].status === 'ok') {
                    this.app.userDetails();
                    console.log('config ' + this.app.configs[this.app.currentConfig].name + ' Refreshed');
                    var folders = this.app.$.globals.buildUrl('getMusicFolders');
                    this.app.$.globals.doXhr(folders, 'json').then(function (e) {
                      this.app.mediaFolders = e.target.response['subsonic-response'].musicFolders.musicFolder;
                      this.app.folder = 'none';
                      if (this.app.mediaFolders === undefined || !this.app.mediaFolders[1]) {
                        this.app.$.sortBox.style.display = 'none';
                      }
                      this.app.tracker.sendAppView('Album Wall');
                      this.isLoading = false;
                    }.bind(this));
                  }
                });
              });
            }
          }
        }.bind(this));
      } else {
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

        }
      }
    },

    _select: function () {
      var clicked = this.post.config;
      var config = this.app.configs[this.post.config];
      if (config) {
        this.post = config;
        this.post.bitRate = this.bitRate;
        this.post.config = clicked;
      }
    },

    _selectAction: function () {
      this.async(this._select);
    },

    _deleteConfig: function () {
      simpleStorage.getSync('configs').then(function (configs) {
        configs.splice(this.post.config, 1);
        this.post.config = this.post.config - 1;
        simpleStorage.setSync({
          configs: configs
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
      this.post.config = app.configs.length;
      this.post.bitRate = this.bitRate;
      this.post.name = 'Config' + Math.abs(this.app.configs.length + 1);
      this.$.editorMD5.hidden = true;
    },

    configChanged: function () {
      this.async(this._defaultConfigs);
    },

    bitRateChanged: function () {
      this.async(function () {
        if ("bitRate" in this) {
          this.post.bitRate = this.bitRate;
        }
      });
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
