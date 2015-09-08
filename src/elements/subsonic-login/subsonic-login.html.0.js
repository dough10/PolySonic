Polymer({
  is: 'subsonic-login',
  properties: {
    post: {
      type: Array,
      value: []
    },
    isLoading: {
      type: Boolean,
      value: false
    }
  },
  ready: function () {
    'use strict';
    this.app = document.querySelector('#app');
  },
  submit: function () {
    this.isLoading = true;
    this.$.load.hidden = false;
    this.app.getApiVersion().then(function (json) {
      if (json.status === 'ok') {
        var data = {
          'url': this.url,
          'user': this.user,
          'pass': this.pass,
          'version': this.app.version
        };
        // save to local storage 
        if (!localStorage) {
          chrome.storage.sync.set(data);
        } else {
          this.app.localStorageSet(data);
        }
        this.app.$.firstRun.close();
        this.app.fetchJSON(this.app.buildUrl('getAlbumList', {
          type: 'newest',
          size: this.app.querySize,
          offset: 0
        }).bind(this)).then(function (json) {
          if (json.status === 'ok') {
            document.querySelector('album-wall').albumWall = json.albumList.album;
          }
        });
      } else {
        this.app.makeToast(json.error);
      }
    }.bind(this)).catch(function (e) {
      this.app.makeToast(e.error);
      this.isLoading = false;
      if (!this.app.$.firstRun.opened) {
        this.app.$.firstRun.open();
      }
    });
  },
  hidePass: function () {
    'use strict';
    var type = this.$.password.type, button = this.$.showPass, timer = this.timer;
    if (type === 'text') {
      this.$.password.type = 'password';
      button.innerHTML = this.app.text.showPass;
      if (timer) {
        clearTimeout(timer);
        timer = 0;
      }
    } else {
      this.$.password.type = 'text';
      button.innerHTML = this.app.text.hidePass;
      timer = setTimeout(function () {
        this.$.password.type = 'password';
        button.innerHTML = this.app.text.showPass;
        timer = 0;
      }.bind(this), 15000);
    }
  },
  _updateURL: function () {
    this.app.url = this.url;
  },
  _updateUser: function () {
    this.app.user = this.user;
  },
  _updatePass: function () {
    this.app.pass = this.pass;
  }
});
