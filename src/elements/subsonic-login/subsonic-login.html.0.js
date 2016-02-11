
    Polymer('subsonic-login',{
      timer: 0,



      ready: function () {
        'use strict';
        this.app = document.getElementById("tmpl");
        this.testingURL = false;
      },



      testURL: function (e) {
        var input = e.target;
        if (!this.invalid1) {
          this.testingURL = true;
          this.$.submit.disabled = true;
          var xhr = new XMLHttpRequest();
          xhr.open("GET", input.value + '/rest/ping.view?f=json', true);
          xhr.responseType = 'json';
          xhr.onload = function (e) {
            var json = e.target.response['subsonic-response'];
            this.app.version = json.version;
            // greater then 1.13.0 api verion give option to disable md5Auth
            if (versionCompare(this.app.version, '1.13.0') >= 0) {
              this.$.auth.hidden = false;
              //document.querySelector('settings-menu').$.auth.hidden = false;
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
          // cancel previous attempts
          if (this.attempt) {
            this.attempt.abort();
          }
          // send result and tag the attempt
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
          this.$.globals.makeToast("URL & Username Required");
        } else if (this.invalid1) {
          this.$.globals.makeToast("URL Required");
        } else if (this.invalid2) {
          this.$.globals.makeToast("Username Required");
        } else if (!this.invalid1 && !this.invalid2 && !this.invalid3) {
          /* trim off trailing forward slash */
          var lastChar = this.app.url.substr(-1); // Selects the last character
          if (lastChar === '/') {         // If the last character is a slash
            this.app.url = this.app.url.substring(0, this.app.url.length - 1);  // remove the slash from end of string
          }
          this.$.ajax.url = this.$.globals.buildUrl('ping');
          this.$.ajax.go();
        }
      },




      responseChanged: function () {
        'use strict';
        if (this.response) {

          if (this.response['subsonic-response'].status === 'ok') {
            // this is a first time login
            if (this.app.configs[this.app.currentConfig] === undefined) {
              this.app.$.globals.initFS();
              this.app.$.firstRun.close();
              this.app.configs = [
                {
                  name: 'Config1',
                  url: this.app.url,
                  user: this.app.user,
                  pass: this.app.pass,
                  version: this.app.version,
                  md5Auth: this.app.md5Auth
                }
              ];
              this.app.currentConfig = 0;
              simpleStorage.setSync({
                configs: this.app.configs
              });
              simpleStorage.setLocal({
                currentConfig: this.app.currentConfig
              });
            } else {

              // not a first time connection
            }
            this.app.userDetails();
            this.app.version = this.response['subsonic-response'].version;
            this.$.globals.makeToast("Loading Data");
            this.app.tracker.sendEvent('API Version', this.response['subsonic-response'].version);
            var url = this.$.globals.buildUrl('getMusicFolders');
            this.$.globals.doXhr(url, 'json').then(function (e) {
              this.app.mediaFolders = e.target.response['subsonic-response'].musicFolders.musicFolder;
              this.app.folder = 'none';
              if (e.target.response['subsonic-response'].musicFolders.musicFolder && !e.target.response['subsonic-response'].musicFolders.musicFolder[1]) {
                this.app.$.sortBox.style.display = 'none';
              }
            }.bind(this));
          } else {
            this.$.globals.makeToast(this.response['subsonic-response'].error.message);
          }
        }
      },


      authChanged: function (e) {
        var element = e.target;
        simpleStorage.setSync({
          md5Auth: element.checked
        });
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


      errorChanged: function () {
        'use strict';
        /*
          will display any ajax error in a toast
        */
        if (this.error) {
          this.app.$.firstRun.open();
          this.$.globals.makeToast(chrome.i18n.getMessage('connectionError'));
        }
      }



    });
