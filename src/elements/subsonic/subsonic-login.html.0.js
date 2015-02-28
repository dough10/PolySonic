
    Polymer('subsonic-login',{
      versions: [
        {sub:'5.2', api:'1.12.0'},
        {sub:'5.1', api:'1.11.0'}
        
        /* versions not supported due to access-control-allow-origin header*/
      /*{sub:'4.9', api:'1.10.2'},
        {sub:'4.8', api:'1.9.0'},
        {sub:'4.7', api:'1.8.0'}*/
      ],
      timer: 0,
      ready: function () {
        'use strict';
        this.post = [];
        this.tmpl = document.querySelector("#tmpl");
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
          } else if (this.post.version === undefined) {
            this.tmpl.doToast("Version Required");
          } else if (!invalid1 && !invalid2 && !invalid3 && this.post.version !== undefined) {
            /* ping server to check user given data */
            this.$.ajax.go();
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
          button.innerHTML = "Show Password";
          if (timer) {
            clearTimeout(timer);
            timer = 0;
          }
        } else {
          this.$.password.type = "text";
          button.innerHTML = "Hide Password";
          timer = setTimeout(function () {
            this.$.password.type = "password";
            button.innerHTML = "Show Password";
            timer = 0;
          }.bind(this), 15000);
        }
      },
      responseChanged: function () {
        'use strict';
        var tmpl = document.querySelector("#tmpl"),
          wall = document.querySelector('#wall');
        
        if (this.response) {
          if (this.response['subsonic-response'].status === 'ok') {
            chrome.storage.sync.set({
              'url': this.post.url,
              'user': this.post.user,
              'pass': this.post.pass,
              'version': this.post.version
            });
            tmpl.url = this.post.url;
            tmpl.user = this.post.user;
            tmpl.pass = this.post.pass;
            tmpl.version = this.post.version;
            tmpl.doToast("Loading Data");
            tmpl.tracker.sendEvent('API Version', 'Loaded', this.post.version);
            tmpl.$.firstRun.close();
            console.log(tmpl.version);
            setTimeout(function () {
              wall.doAjax();
            }, 100);
          } else {
            this.tmpl.doToast(this.response['subsonic-response'].error.message);
          }
        }
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
      }
    });
