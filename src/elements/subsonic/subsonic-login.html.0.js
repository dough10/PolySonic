
    Polymer('subsonic-login',{
      timer: 0,
      ready: function () {
        'use strict';
        this.post = [];
        this.tmpl = document.getElementById("tmpl");
        this.urlError = chrome.i18n.getMessage("urlError");
        this.urlLabel = chrome.i18n.getMessage("urlLabel");
        this.usernameError = chrome.i18n.getMessage("usernameError");
        this.usernameLabel = chrome.i18n.getMessage("usernameLabel");
        this.passwordLabel = chrome.i18n.getMessage("passwordLabel");
        this.showPass = chrome.i18n.getMessage("showPass");
        this.hideThePass = chrome.i18n.getMessage("hidePass");
        this.submitButton = chrome.i18n.getMessage("submitButton");
      },
      submit: function () {
        'use strict';
        if (this.invalid1 && this.invalid2 && this.post.version === undefined) {
          this.tmpl.doToast("URL, Username & Version Required");
        } else if (this.invalid1) {
          this.tmpl.doToast("URL Required");
        } else if (this.invalid2) {
          this.tmpl.doToast("Username Required");
        } else if (!this.invalid1 && !this.invalid2 && !this.invalid3) {
          /* trim off trailing forward slash */
          var lastChar = this.post.url.substr(-1); // Selects the last character
          if (lastChar === '/') {         // If the last character is a slash
            this.post.url = this.post.url.substring(0, this.post.url.length - 1);  // remove the slash from end of string
          }
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
            chrome.storage.sync.set({
              'url': this.post.url,
              'user': this.post.user,
              'pass': this.post.pass,
            });
            this.tmpl.url = this.post.url;
            this.tmpl.user = this.post.user;
            this.tmpl.pass = this.post.pass;
            this.tmpl.userDetails();
            this.tmpl.version = this.response['subsonic-response'].version;
            this.tmpl.doToast("Loading Data");
            this.tmpl.tracker.sendEvent('API Version', this.response['subsonic-response'].version);
            this.tmpl.$.firstRun.close();
            this.tmpl.doXhr(this.url + "/rest/getMusicFolders.view?u=" + this.user + "&p=" + this.pass + "&f=json&v=" + this.version + "&c=PolySonic", 'json', function (e) {
              this.tmpl.mediaFolders = e.target.response['subsonic-response'].musicFolders.musicFolder;
              if (!e.target.response['subsonic-response'].musicFolders.musicFolder[1]) {
                this.tmpl.$.sortBox.style.display = 'none';
              }
            }.bind(this));
            setTimeout(function () {
              wall.doAjax();
            }, 100);
          } else {
            console.log(this.response);
            this.tmpl.doToast(this.response['subsonic-response'].error.message);
          }
        }
      },
      errorChanged: function () {
        'use strict';
        /*
          will display any ajax error in a toast
        */
        if (this.error.statusCode === 0) {
          this.tmpl.doToast(chrome.i18n.getMessage('connectionError'));
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
      }
    });
