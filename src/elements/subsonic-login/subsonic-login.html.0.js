/*global chrome, CryptoJS, console, window, document, XMLHttpRequest, setInterval, screen, analytics, Blob, navigator, Image, CoreAnimation, ColorThief, setTimeout, Polymer, atob, Promise, versionCompare, simpleStorage, md5 */
(function () {
  'use strict';
  var app = document.getElementById("tmpl");
  Polymer('subsonic-login', {
    timer: 0,

    ready: function () {
      this.app = app;
      this.testingURL = false;
      this.post = {
        version: '1.11.0',
        name: 'Config1',
        md5Auth: true
      };
    },

    _updateConfig: function () {
      this.newConfig = !Boolean(app.configs[app.currentConfig]);
      if (!this.newConfig) {
        this.post = app.configs[app.currentConfig];
        this.post.config = app.currentConfig;
      } else {
        this.post.config = 0;
      }
    },

    configChanged: function () {
      this.async(this._updateConfig);
    },

    _newConfig: function () {
      this.post = {};
      var configLength = app.configs.length;
      this.post.config = configLength;
      this.post.version = '1.11.0';
      this.post.name = 'Config' + Math.abs(configLength + 1);
      this.$.auth.hidden = true;
      this.async(this.validateInputs);
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
      }, function (theEntry) {
        if (theEntry) {
          this.$.globals.loadFileEntry(theEntry).then(function (encodedText) {
            var decodedText = atob(encodedText);
            var imported = JSON.parse(decodedText);
            if (imported.user && imported.url && imported.pass
                 && imported.name && imported.md5Auth && imported.version) {
              for (var key in imported) {
                this.post[key] = imported[key];
              }
              if (versionCompare(imported.version, '1.13.0') >= 0) {
                this.$.auth.hidden = false;
              }
              this.async(this.validateInputs);
            } else {
              this.$.globals.makeToast('Error Importing Config');
            }
          }.bind(this));
        }
      }.bind(this));
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

    _cancelAttempt: function () {
      this.isLoading = false;
      app.dataLoading = false;
      app.lastRequest.abort();
    },

    testURL: function (e) {
      var input = e.target;
      if (!this.invalid1) {
        this.testingURL = true;
        this.isLoading = true;
        var lastChar = input.value.substr(-1); // Selects the last character
        if (lastChar === '/') {         // If the last character is a slash
          input.value = input.value.substring(0, input.value.length - 1);  // remove the slash from end of string
        }
        var xhr = new XMLHttpRequest();
        xhr.open("GET", input.value + '/rest/ping.view?f=json', true);
        xhr.responseType = 'json';
        xhr.onload = function (e) {
          var json = e.target.response['subsonic-response'];
          this.post.version = json.version;
          // greater then 1.13.0 api verion give option to disable md5Auth
          if (versionCompare(json.version, '1.13.0') >= 0) {
            this.$.auth.hidden = false;
          }

          console.log('API Version: ' + json.version);
          this.testingURL = false;
          this.isLoading = false;
          this.attempt = false;
        }.bind(this);

        xhr.onerror = function (e) {
          this.testingURL = false;
          this.isLoading = false;
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

    _completeConnection: function () {
      app.userDetails();
      var settings = document.querySelector('settings-menu');
      settings.post = app.configs[app.currentConfig];
      settings.post.config = app.currentConfig;
      simpleStorage.setSync({
        configs: app.configs
      });
      simpleStorage.setLocal({
        currentConfig: app.currentConfig
      });
      this.$.globals.makeToast("Loading Data");
      var url = this.$.globals.buildUrl('getMusicFolders');
      this.$.globals.doXhr(url, 'json').then(function (e) {
        var res = e.target.response['subsonic-response'];
        app.mediaFolders = res.musicFolders.musicFolder;
        app.folder = 'none';
        if (res.musicFolders.musicFolder && !res.musicFolders.musicFolder[1]) {
          app.$.sortBox.style.display = 'none';
        } else {
          app.$.sortBox.style.display = 'block';
        }
      }.bind(this));
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


    submit: function () {
      if (this.invalid1 && this.invalid2) {
        this.$.globals.makeToast("URL & Username Required");
      } else if (this.invalid1) {
        this.$.globals.makeToast("URL Required");
      } else if (this.invalid2) {
        this.$.globals.makeToast("Username Required");
      } else if (!this.invalid1 && !this.invalid2 && !this.invalid3) {
        /* trim off trailing forward slash */
        var lastChar = this.post.url.substr(-1); // Selects the last character
        if (lastChar === '/') {         // If the last character is a slash
          this.post.url = this.post.url.substring(0, this.post.url.length - 1);  // remove the slash from end of string
        }
        this.isLoading = true;
        this._testPostSettings().then(function (json) {
          this.isLoading = false;
          if (json.status === 'ok') {
            app.$.firstRun.close();
            this._clearImages()
            .then(this._setConfig.bind(this))
            .then(this.$.globals.openIndexedDB)
            .then(this.$.globals.initFS)
            .then(function () {
              app.currentConfig = this.post.config;
              // creating a new config when no prevoius configs are stored
              var currentConfig = app.configs[app.currentConfig];
              console.log('length: ', app.configs.length);
              console.log('config: ', currentConfig);
              if (currentConfig === undefined && !app.configs.length) {
                app.configs = [
                  this.post
                ];
                this._completeConnection();
              // add a new config to a existing config list
              } else if (currentConfig === undefined && app.configs.length) {
                app.configs.push(this.post);
                this._completeConnection();
              // picked another config
              } else {
                this._completeConnection();
              }
            }.bind(this), function (err) {
              this.isLoading = false;
              throw new Error(err);
            }.bind(this));
          } else {
            this.isLoading = false;
            this.$.globals.makeToast(this.response['subsonic-response'].error.message);
          }
        }.bind(this), function () {
          this.isLoading = false;
          this.$.globals.makeToast('Error Connecting');
        }.bind(this));
      }
    },


    validateInputs: function () {
      this.parentNode.notifyResize();
      var $d = this.$.validate.querySelectorAll('paper-input-decorator');
      Array.prototype.forEach.call($d, function(d) {
        d.isInvalid = !d.querySelector('input').validity.valid;
      });
    },

    _checkKeyup: function (e) {
      this.validateInputs();
      if (e.keyIdentifier === "Enter") {
        e.target.blur();
        this.submit();
      }
    },


    hidePass: function (event, detail, sender) {
      var type = this.$.password.type,
        button = this.$.showPass,
        timer = this.timer;

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


    _select: function () {
      var clicked = this.post.config;
      var config = app.configs[this.post.config];
      if (config) {
        this.post = config;
        this.post.config = clicked;
      }
    },

    _selectAction: function () {
      this.async(this._select);
    },


    postChanged: function () {
      if ('post' in this) {
        this.async(this.validateInputs, null, 200);
        if ('post' in this && 'version' in this.post && this._53orGreater(this.post.version)) {
          this.$.auth.hidden = false;
        }
        if ('config' in this.post) {
          this.newConfig = !Boolean(app.configs[this.post.config]);
        }
      }
    },


    _53orGreater: function (version) {
      if (versionCompare(version, '1.13.0') >= 0) {
        return true;
      } else {
        return false;
      }
    },

    _clearImages: function () {
      return new Promise(function (resolve, reject) {
        if (app.fs) {
          app.fs.root.getDirectory(encodeURIComponent(app.url), {}, function (dir) {
            dir.removeRecursively(function (e) {
              app.db.close();
              var req = indexedDB.deleteDatabase(app.dbname);
              req.onsuccess = resolve;
              req.onerror = reject;
              req.onblocked = reject;
            }, reject);
          });
        } else {
          resolve();
        }
      });
    },
  });
})();
