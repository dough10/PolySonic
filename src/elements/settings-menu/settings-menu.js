(function () {
  var app = app = document.getElementById("tmpl");

  var wall = document.getElementById("wall");

  Polymer('settings-menu',{

    post: {},

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
      setTimeout(function () {
        if (versionCompare(app.version, '1.13.0') >= 0) {
          this.$.auth.hidden = false;
        }
      }.bind(this), 500);
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

//    validate: function (callback) {
//      'use strict';
//      var $d = this.$.validate.querySelectorAll('paper-input-decorator');
//      Array.prototype.forEach.call($d, function(d) {
//        d.isInvalid = !d.querySelector('input').validity.valid;
//      });
//      callback();
//    },

//    _isInvalid: function (id) {
//      return this.$[id].classList.contains("invalid");
//    },
//
//    submit: function () {
//      'use strict';
//      /*
//        preforms the validation
//      */
//      this.validate(function () {
//        var invalid1 = this._isInvalid('input1');
//        var invalid2 = this._isInvalid('input2');;
//        var invalid3 = this._isInvalid('input3');;
//        if (invalid1 && invalid2 && this.post.version === undefined) {
//          this.$.globals.makeToast("URL, Username & Version Required");
//        } else if (invalid1) {
//          this.$.globals.makeToast("URL Required");
//        } else if (invalid2) {
//          this.$.globals.makeToast("Username Required");
//        } else if (this.version === undefined) {
//          this.$.globals.makeToast("Version Required");
//        }
//        if (!invalid1 && !invalid2 && !invalid3 && this.post.version !== undefined && this.post.bitRate !== undefined) {
//          var lastChar = this.post.url.substr(-1); // Selects the last character
//          if (lastChar === '/') {         // If the last character is a slash
//            this.post.url = this.post.url.substring(0, this.post.url.length - 1);  // remove the slash from end of string
//          }
//          this.$.ajax.go();
//          wall.clearData(function () {
//            wall.doAjax();
//          }.bind(this));
//        }
//      }.bind(this));
//    },

//    _hidePass: function (event, detail, sender) {
//      'use strict';
//      var type = this.$.password.type,
//        button = this.$.showPass,
//        timer = this._timer;
//
//      if (type === "text") {
//        this.$.password.type = "password";
//        button.innerHTML = this.showPass;
//        if (timer) {
//          clearTimeout(timer);
//          timer = 0;
//        }
//      } else {
//        this.$.password.type = "text";
//        button.innerHTML = this.hideThePass;
//        timer = setTimeout(function () {
//          this.$.password.type = "password";
//          button.innerHTML = this.showPass;
//          timer = 0;
//        }.bind(this), 15000);
//      }
//    },

//    _methodSelect: function () {
//      this.async(function () {
//        simpleStorage.setSync({
//          'queryMethod': this.post.queryMethod
//        });
//        app.queryMethod = this.post.queryMethod;
//        console.log('Query Method: ' + this.post.queryMethod);
//      });
//    },

//    _responseChanged: function () {
//      'use strict';
//      /*
//        will display server response in a toast
//      */
//      if (this._response) {
//        if (this._response['subsonic-response'].status === 'ok') {
//          if (this.post.url !== app.url) {
//            this._clearCache()
//          }
//
//          simpleStorage.setSync({
//            'url': this.post.url,
//            'user': this.post.user,
//            'pass': this.post.pass,
//            'version': this._response['subsonic-response'].version,
//            'querySize': this.post.querySize,
//            'queryMethod': this.post.queryMethod
//          });
//          simpleStorage.setLocal({
//            'bitRate': this.post.bitRate
//          });
//
//          app.url = this.post.url;
//
//          app.user = this.post.user;
//
//          app.pass = this.post.pass;
//
//          app.version = this._response['subsonic-response'].version;
//
//          app.bitRate = this.post.bitRate;
//
//          app.querySize = this.post.querySize;
//
//          app.queryMethod = this.post.queryMethod;
//
//          this.$.globals.makeToast("Settings Saved");
//        } else if (this._response['subsonic-response'].status === 'failed') {
//          this.$.globals.makeToast(this._response['subsonic-response'].error.message);
//        } else  {
//          this.$.globals.makeToast("Error Connecting to Server. Check Settings");
//        }
//      }
//    },


//    _querySelect: function () {
//      simpleStorage.setSync({
//        'querySize': this.post.querySize
//      });
//      app.querySize = this.post.querySize;
//      console.log('Query Size: ' + this.post.querySize);
//    },

    _clearCache: function () {
      app.fs.root.getDirectory(encodeURIComponent(app.url), {}, function (dir) {
        dir.removeRecursively(function (e) {
          app.$.globals.makeToast('image cache cleared');
        }, function (e) {
          console.error(e)
        });
      });
      var req = indexedDB.deleteDatabase(app.dbname);
      req.onsuccess = function () {
        console.log("Deleted database successfully");
        app.createObjectStore();
        app.calculateStorageSize();
      }.bind(this);
      req.onerror = function () {
        console.log("Error deleting database");
        app.calculateStorageSize();
      }.bind(this);
      req.onblocked = function () {
        console.log("Couldn't delete database due to the operation being blocked");
        app.calculateStorageSize();
      }.bind(this);
      app.$.recommendReloadDialog.open();
    },

    _clearSettings: function () {
      app.fs.root.getDirectory(encodeURIComponent(app.url), {}, function (dir) {
        dir.removeRecursively(function (e) {
          app.$.globals.makeToast('image cache cleared');
        }, function (e) {
          console.error(e)
        });
      });
      var req = indexedDB.deleteDatabase(app.dbname);
      req.onsuccess = function () {
        console.log("Deleted database successfully");
        app.createObjectStore();
        app.calculateStorageSize();
      }.bind(this);
      req.onerror = function () {
        console.log("Error deleting database");
        app.calculateStorageSize();
      }.bind(this);
      req.onblocked = function () {
        console.log("Couldn't delete database due to the operation being blocked");
        app.calculateStorageSize();
      }.bind(this);
      chrome.storage.sync.clear();
      app.url = '';
      app.user = '';
      app.pass = '';
      app.version = '';
      app.bitRate = '';
      app.querySize = '';
      app.$.reloadAppDialog.open();
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
      if (this.error.statusCode === 0) {
        this.$.globals.makeToast(chrome.i18n.getMessage('connectionError'));
      }
    },

    urlChanged: function () {
      this.post.url = this.url;
    },

    userChanged: function () {
      this.post.user = this.user;
    },

    passChanged: function () {
      this.post.pass = this.pass;
    },

    versionChanged: function () {
      this.post.version = this.version;
    },

    bitRateChanged: function () {
      this.post.bitRate = this.bitRate;
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
