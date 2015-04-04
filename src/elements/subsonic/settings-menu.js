
    Polymer('settings-menu',{
      speeds: [
        96,
        128,
        192,
        256,
        320
      ],
      sizes: [
        18
      ],
      timer: 0,
      ready: function () {
        'use strict';
        this.post = [];
        this.urlError = chrome.i18n.getMessage("urlError");
        this.urlLabel = chrome.i18n.getMessage("urlLabel");
        this.usernameError = chrome.i18n.getMessage("usernameError");
        this.usernameLabel = chrome.i18n.getMessage("usernameLabel");
        this.passwordLabel = chrome.i18n.getMessage("passwordLabel");
        this.showPass = chrome.i18n.getMessage("showPass");
        this.hideThePass = chrome.i18n.getMessage("hidePass");
        this.submitButton = chrome.i18n.getMessage("submitButton");
        this.bitrateLabel = chrome.i18n.getMessage("bitrateLabel");
        this.cacheDetails = chrome.i18n.getMessage("cacheDetails");
        this.clearCacheLabel = chrome.i18n.getMessage("clearCacheLabel");
        this.clearSettingsLabel = chrome.i18n.getMessage("clearSettingsLabel");
      },
      domReady: function () {
        this.tmpl = document.getElementById("tmpl");
        this.wall = document.getElementById("wall");
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
            this.tmpl.doToast("URL, Username & Version Required");
          } else if (invalid1) {
            this.tmpl.doToast("URL Required");
          } else if (invalid2) {
            this.tmpl.doToast("Username Required");
          } else if (this.version === undefined) {
            this.tmpl.doToast("Version Required");
          }
          if (!invalid1 && !invalid2 && !invalid3 && this.post.version !== undefined && this.post.bitRate !== undefined) {
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
      clearCache: function () {
        var req = indexedDB.deleteDatabase('albumInfo');
        req.onsuccess = function () {
          console.log("Deleted database successfully");
          this.tmpl.createObjectStore();
          this.tmpl.calculateStorageSize();
        }.bind(this);
        req.onerror = function () {
          console.log("Error deleting database");
          this.tmpl.calculateStorageSize();
        }.bind(this);
        req.onblocked = function () {
          console.log("Couldn't delete database due to the operation being blocked");
          this.tmpl.calculateStorageSize();
        }.bind(this);
      },
      clearSettings: function () {
        chrome.storage.sync.clear();
        this.tmpl.url = '';
        this.tmpl.user = '';
        this.tmpl.pass = '';
        this.tmpl.version = '';
        this.tmpl.bitRate = '';
        this.tmpl.querySize = '';
        this.post = [];
        this.tmpl.doToast("Settings Cleared");
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
                this.tmpl.createObjectStore();
              };
              req.onerror = function () {
                console.log("Error deleting database");
              };
              req.onblocked = function () {
                console.log("Couldn't delete database due to the operation being blocked");
              };
            }

            chrome.storage.sync.set({
              'url': this.post.url,
              'user': this.post.user,
              'pass': this.post.pass,
              'version': this.response['subsonic-response'].version,
              'bitRate': this.post.bitRate,
              'querySize': this.post.querySize,
              'queryMethod': this.post.queryMethod
            });

            this.tmpl.url = this.post.url;

            this.tmpl.user = this.post.user;

            this.tmpl.pass = this.post.pass;

            this.tmpl.version = this.response['subsonic-response'].version;

            this.tmpl.bitRate = this.post.bitRate;

            this.tmpl.querySize = this.post.querySize;

            this.tmpl.queryMethod = this.post.queryMethod;

            this.tmpl.doToast("Settings Saved");
          } else if (this.response['subsonic-response'].status === 'failed') {
            this.tmpl.doToast(this.response['subsonic-response'].error.message);
          } else  {
            this.tmpl.doToast("Error Connecting to Server. Check Settings");
          }
        }
      },
      colorThiefToggle: function () {
        chrome.storage.sync.set({
          'colorThiefEnabled': this.colorThiefEnabled
        });
        if (!this.colorThiefEnabled) {
          this.tmpl.colorThiefFab = undefined;
          this.tmpl.colorThiefFabOff = undefined;
          this.tmpl.colorThiefAlbum = undefined;
          this.tmpl.colorThiefAlbumOff = undefined;
          this.tmpl.colorThiefBuffered = undefined;
          this.tmpl.colorThiefProgBg = undefined;
        }
      },
      thiefDetailsToggle: function () {
        this.$.thiefCollapse.toggle();
      },
      bitRateSelect: function () {
        chrome.storage.sync.set({
          'bitRate': this.post.bitRate
        });
        this.tmpl.bitRate = this.post.bitRate;
        console.log('Bitrate: ' + this.post.bitRate);
      },
      querySelect: function () {
        chrome.storage.sync.set({
          'querySize': this.post.querySize
        });
        this.tmpl.querySize = this.post.querySize;
        console.log('Query Size: ' + this.post.querySize);
      },
      methodSelect: function () {
        chrome.storage.sync.set({
          'queryMethod': this.post.queryMethod
        });
        this.tmpl.queryMethod = this.post.queryMethod;
        console.log('Query Method: ' + this.post.queryMethod);
      },
      errorChanged: function () {
        'use strict';
        /*
          will display any ajax error in a toast
        */
        if (this.error) {
          this.tmpl.doToast(this.error);
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
        this.tmpl.calculateStorageSize();
        this.$.quota.toggle();
      },

      linkGo: function (event, detail, sender) {
        var url = sender.attributes.link.value;
        window.open(url, '_blank');
      }
    });
