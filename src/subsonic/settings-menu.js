
    Polymer('settings-menu',{
      versions: [
        {sub:'5.1', api:'1.11.0'},
        {sub:'4.9', api:'1.10.2'},
        {sub:'4.8', api:'1.9.0'},
        {sub:'4.7', api:'1.8.0'}
      ],
      speeds: [
        96,
        128,
        192,
        256,
        320
      ],
      sizes: [
        10,
        20,
        30,
        40,
        50,
        60
      ],
      timer: 0,
      ready: function () {
        'use strict';
        this.post = [];
      },
      validate: function () {
        'use strict';

        /*
          here i use polymer built in selector to select all the inputs that are inside the div with the id of validate
        */
        var $d = this.$.validate.querySelectorAll('paper-input-decorator');
        Array.prototype.forEach.call($d, function(d) {
          d.isInvalid = !d.querySelector('input').validity.valid;
        });
      },
      submit: function () {
        'use strict';
        /*
          preforms the validation
        */
        this.validate();

        setTimeout(function () {
          var invalid1 = this.$.input1.classList.contains("invalid"),
            invalid2 = this.$.input2.classList.contains("invalid"),
            invalid3 = this.$.input3.classList.contains("invalid"),
            wall = document.querySelector("#wall"),
            toast = this.$.toast;


          if (invalid1 && invalid2 && this.post.version === undefined) {
            toast.text = "URL, Username & Version Required";
            toast.show();
          } else if (invalid1) {
            toast.text = "URL Required";
            toast.show();
          } else if (invalid2) {
            toast.text = "Username Required";
            toast.show();
          } else if (this.version === undefined) {
            toast.text = "Version Required";
            toast.show();
          }
          if (!invalid1 && !invalid2 && !invalid3 && this.post.version !== undefined && this.post.bitRate !== undefined) {
            this.$.ajax.go();
            wall.wall = [];
            wall.doAjax();
          }
        }.bind(this), 100);
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
        var tmpl = document.querySelector("#tmpl"),
          wall = document.querySelector('#wall');
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
                tmpl.createObjectStore();
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
              'version': this.post.version,
              'bitRate': this.post.bitRate,
              'querySize': this.post.querySize
            });

            tmpl.url = this.post.url;

            tmpl.user = this.post.user;

            tmpl.pass = this.post.pass;

            tmpl.version = this.post.version;

            tmpl.bitRate = this.post.bitRate;

            tmpl.querySize = this.post.querySize;

            this.$.toast.text = "Settings Saved";
            this.$.toast.show();
          } else if (this.response['subsonic-response'].status === 'failed') {
            this.$.toast.text = this.response['subsonic-response'].error.message;
            this.$.toast.show();
          } else  {
            this.$.toast.text = "Error Connecting to Server. Check Settings";
            this.$.toast.show();
          }
        }
      },
      errorChanged: function () {
        'use strict';
        /*
          will display any ajax error in a toast
        */
        if (this.error) {
          this.$.toast.text = this.error;
          this.$.toast.show();
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
      }
    });
