
    Polymer('subsonic-login',{
      timer: 0,
      ready: function () {
        'use strict';
        this.app = document.getElementById("tmpl");
        this.urlError = chrome.i18n.getMessage("urlError");
        this.urlLabel = chrome.i18n.getMessage("urlLabel");
        this.usernameError = chrome.i18n.getMessage("usernameError");
        this.usernameLabel = chrome.i18n.getMessage("usernameLabel");
        this.passwordLabel = chrome.i18n.getMessage("passwordLabel");
        this.showPass = chrome.i18n.getMessage("showPass");
        this.hideThePass = chrome.i18n.getMessage("hidePass");
        this.submitButton = chrome.i18n.getMessage("submitButton");
        this.testingURL = false;
      },
      testURL: function (e) {
        var element = e.target;
        if (!this.invalid1) {
          this.testingURL = true;
          this.$.submit.disabled = true;
          var xhr = new XMLHttpRequest();
          xhr.open("GET", element.value + '/rest/ping.view?f=json', true);
          xhr.responseType = 'json';
          xhr.onload = function (e) {
            var json = e.target.response['subsonic-response'];
            this.app.version = json.version;
            if (versionCompare(this.app.version, '1.13.0') >= 0) {
              this.$.auth.hidden = false;
              document.querySelector('settings-menu').$.auth.hidden = false;
            }
            console.log('API Version: ' + json.version);
            this.testingURL = false;
            this.$.submit.disabled = false;
            this.attempt = false;
          }.bind(this);
          xhr.onerror = function (e) {
            this.testingURL = false;
            this.$.submit.disabled = false;
            this.attempt = false;
          }.bind(this);
          if (this.attempt) {
            this.attempt.abort();
          }
          xhr.send();
          this.attempt = xhr;
        }
      },
      checkKeyup: function (e) {
        if (e.keyIdentifier === "Enter" && !this.$.submit.disabled) {
          e.target.blur();
          this.submit();
        }
      },
      submit: function () {
        'use strict';
        if (this.invalid1 && this.invalid2) {
          this.app.doToast("URL & Username Required");
        } else if (this.invalid1) {
          this.app.doToast("URL Required");
        } else if (this.invalid2) {
          this.app.doToast("Username Required");
        } else if (!this.invalid1 && !this.invalid2 && !this.invalid3) {
          /* trim off trailing forward slash */
          var lastChar = this.app.url.substr(-1); // Selects the last character
          if (lastChar === '/') {         // If the last character is a slash
            this.app.url = this.app.url.substring(0, this.app.url.length - 1);  // remove the slash from end of string
          }
          this.$.ajax.url = this.app.buildUrl('ping', '');
          this.$.ajax.go();
        }
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
      responseChanged: function () {
        'use strict';
        var wall = document.getElementById('wall');
        if (this.response) {
          if (this.response['subsonic-response'].status === 'ok') {
            simpleStorage.setSync({
              'url': this.app.url,
              'user': this.app.user,
              'pass': this.app.pass,
            });
            this.app.userDetails();
            this.app.version = this.response['subsonic-response'].version;
            this.app.doToast("Loading Data");
            this.app.tracker.sendEvent('API Version', this.response['subsonic-response'].version);
            this.app.$.firstRun.close();
            this.app.doXhr(this.app.buildUrl('getMusicFolders', ''), 'json', function (e) {
              this.app.mediaFolders = e.target.response['subsonic-response'].musicFolders.musicFolder;
              if (e.target.response['subsonic-response'].musicFolders.musicFolder && !e.target.response['subsonic-response'].musicFolders.musicFolder[1]) {
                this.app.$.sortBox.style.display = 'none';
              }
            }.bind(this));
            this.async(function () {
              wall.doAjax();
            }, null, 100);
          } else {
            console.log(this.response);
            this.app.doToast(this.response['subsonic-response'].error.message);
          }
        }
      },
      authChanged: function (e) {
        var element = e.target;
        simpleStorage.setSync({
          md5Auth: element.checked
        });
      },
      errorChanged: function () {
        'use strict';
        /*
          will display any ajax error in a toast
        */
        if (this.error) {
          this.app.$.firstRun.open();
          this.app.doToast(chrome.i18n.getMessage('connectionError'));
        }
      }
    });
