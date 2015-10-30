
    Polymer('settings-menu',{
      /* tempary object for user configurable values */
      post: {},
      /* app manifest object */
      manifest: chrome.runtime.getManifest(),
       /* locale settings */
      urlError: chrome.i18n.getMessage("urlError"),
      urlLabel: chrome.i18n.getMessage("urlLabel"),
      usernameError: chrome.i18n.getMessage("usernameError"),
      usernameLabel: chrome.i18n.getMessage("usernameLabel"),
      passwordLabel: chrome.i18n.getMessage("passwordLabel"),
      showPass: chrome.i18n.getMessage("showPass"),
      hideThePass: chrome.i18n.getMessage("hidePass"),
      submitButton: chrome.i18n.getMessage("submitButton"),
      bitrateLabel: chrome.i18n.getMessage("bitrateLabel"),
      cacheDetails: chrome.i18n.getMessage("cacheDetails"),
      clearCacheLabel: chrome.i18n.getMessage("clearCacheLabel"),
      clearSettingsLabel: chrome.i18n.getMessage("clearSettingsLabel"),
      appName: chrome.i18n.getMessage("appName"),
      licenseInfoLink: chrome.i18n.getMessage("licenseInfoLink"),
      showLicenseLabel: chrome.i18n.getMessage("showLicenseLabel"),
      /* avaliable bitrates */
      speeds: [
        96,
        128,
        192,
        256,
        320
      ],
      timer: 0,

      created: function () {
        this.elementReady = false;
      },

      domReady: function () {
        this.app = document.getElementById("tmpl");
        this.wall = document.getElementById("wall");
        this.outputVersion(this.manifest);
        setTimeout(function () {
          this.elementReady = true;
        }.bind(this), 500);
      },

      outputVersion: function (manifest) {
        this.polysonicVersion = manifest.version;
        console.log('App version: ' + this.polysonicVersion);
      },

      validate: function (callback) {
        'use strict';

        /*
          here i use polymer built in selector to select all the inputs that are inside the div with the id of validate
        */
        var $d = this.$.validate.querySelectorAll('paper-input-decorator');
        Array.prototype.forEach.call($d, function(d) {
          d.isInvalid = !d.querySelector('input').validity.valid;
        });
        callback();
      },

      submit: function () {
        'use strict';
        /*
          preforms the validation
        */
        this.validate(function () {
          var invalid1 = this.$.input1.classList.contains("invalid"),
            invalid2 = this.$.input2.classList.contains("invalid"),
            invalid3 = this.$.input3.classList.contains("invalid");
          if (invalid1 && invalid2 && this.post.version === undefined) {
            this.app.doToast("URL, Username & Version Required");
          } else if (invalid1) {
            this.app.doToast("URL Required");
          } else if (invalid2) {
            this.app.doToast("Username Required");
          } else if (this.version === undefined) {
            this.app.doToast("Version Required");
          }
          if (!invalid1 && !invalid2 && !invalid3 && this.post.version !== undefined && this.post.bitRate !== undefined) {
            var lastChar = this.post.url.substr(-1); // Selects the last character
            if (lastChar === '/') {         // If the last character is a slash
              this.post.url = this.post.url.substring(0, this.post.url.length - 1);  // remove the slash from end of string
            }
            this.$.ajax.go();
            this.wall.clearData(function () {
              this.wall.doAjax();
            }.bind(this));
          }
        }.bind(this));
      },

      hidePass: function (event, detail, sender) {
        'use strict';
        var type = this.$.password.type,
          button = this.$.showPass,
          timer = this.timer;

        if (type === "text") {
          this.$.password.type = "password";
          button.innerHTML = this.showPass;
          if (timer) {
            clearTimeout(timer);
            timer = 0;
          }
        } else {
          this.$.password.type = "text";
          button.innerHTML = this.hideThePass;
          timer = setTimeout(function () {
            this.$.password.type = "password";
            button.innerHTML = this.showPass;
            timer = 0;
          }.bind(this), 15000);
        }
      },

      methodSelect: function () {
        this.async(function () {
          simpleStorage.setSync({
            'queryMethod': this.post.queryMethod
          });
          this.app.queryMethod = this.post.queryMethod;
          console.log('Query Method: ' + this.post.queryMethod);
        });
      },

      doClearCache: function () {
        this.clearCache(function () {
          this.app.$.recommendReloadDialog.open();
        }.bind(this));
      },

      clearCache: function (callback) {
        var req = indexedDB.deleteDatabase('albumInfo');
        req.onsuccess = function () {
          console.log("Deleted database successfully");
          this.app.createObjectStore();
          this.app.calculateStorageSize();
        }.bind(this);
        req.onerror = function () {
          console.log("Error deleting database");
          this.app.calculateStorageSize();
        }.bind(this);
        req.onblocked = function () {
          console.log("Couldn't delete database due to the operation being blocked");
          this.app.calculateStorageSize();
        }.bind(this);
        callback();
      },

      clearSettings: function () {
        chrome.storage.sync.clear();
        this.app.url = '';
        this.app.user = '';
        this.app.pass = '';
        this.app.version = '';
        this.app.bitRate = '';
        this.app.querySize = '';
        this.post = [];
        this.clearCache(function () {
          this.app.$.reloadAppDialog.open();
        }.bind(this));
      },

      responseChanged: function () {
        'use strict';
        /*
          will display server response in a toast
        */
        if (this.response) {
          if (this.response['subsonic-response'].status === 'ok') {
            if (this.post.url !== this.url) {
              var req = indexedDB.deleteDatabase('albumInfo');
              req.onsuccess = function () {
                console.log("Deleted database successfully");
                this.app.createObjectStore();
              };
              req.onerror = function () {
                console.log("Error deleting database");
              };
              req.onblocked = function () {
                console.log("Couldn't delete database due to the operation being blocked");
              };
            }

            simpleStorage.setSync({
              'url': this.post.url,
              'user': this.post.user,
              'pass': this.post.pass,
              'version': this.response['subsonic-response'].version,
              'querySize': this.post.querySize,
              'queryMethod': this.post.queryMethod
            });
            simpleStorage.setLocal({
              'bitRate': this.post.bitRate
            });

            this.app.url = this.post.url;

            this.app.user = this.post.user;

            this.app.pass = this.post.pass;

            this.app.version = this.response['subsonic-response'].version;

            this.app.bitRate = this.post.bitRate;

            this.app.querySize = this.post.querySize;

            this.app.queryMethod = this.post.queryMethod;

            this.app.doToast("Settings Saved");
          } else if (this.response['subsonic-response'].status === 'failed') {
            this.app.doToast(this.response['subsonic-response'].error.message);
          } else  {
            this.app.doToast("Error Connecting to Server. Check Settings");
          }
        }
      },

      bitRateSelect: function () {
        this.async(function () {
          simpleStorage.setSync({
            'bitRate': this.post.bitRate
          });
          this.app.bitRate = this.post.bitRate;
          console.log('Bitrate: ' + this.post.bitRate);
        });
      },

      querySelect: function () {
        simpleStorage.setSync({
          'querySize': this.post.querySize
        });
        this.app.querySize = this.post.querySize;
        console.log('Query Size: ' + this.post.querySize);
      },

      errorChanged: function () {
        'use strict';
        /*
          will display any ajax error in a toast
        */
        if (this.error.statusCode === 0) {
          this.app.doToast(chrome.i18n.getMessage('connectionError'));
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

      showQuota: function () {
        this.app.calculateStorageSize();
        this.$.quota.toggle();
      },

      linkGo: function (event, detail, sender) {
        var url = sender.attributes.link.value;
        window.open(url, '_blank');
      },

      analisticsToggle: function () {
        simpleStorage.setSync({
          'analistics': this.app.analisticsEnabled
        });
      },

      getLicense: function (event, detail, sender) {
        var animation = new CoreAnimation();
        animation.duration = 1000;
        animation.iterations = 'Infinity';
        animation.keyframes = [
          {opacity: 1},
          {opacity: 0}
        ];
        animation.target = sender;
        animation.play();
        this.app.getLicense(function () {
          animation.cancel();
        });
      },

      toggleAutobookmark: function () {
        simpleStorage.setSync({
          autoBookmark: this.app.autoBookmark
        });
      },
      
      toggleGapless: function () {
        simpleStorage.setSync({
          gapless: this.app.gapless
        });
      }
    });
