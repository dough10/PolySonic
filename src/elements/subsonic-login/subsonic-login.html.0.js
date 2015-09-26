Polymer({
  is: 'subsonic-login',
  properties: {
    
    /**
     * a Array with the login data we are checking with the server
     */
    post: {
      type: Array,
      value: []
    },
    
    /**
     * a Boolean designating of the request is processing
     */
    isLoading: {
      type: Boolean,
      value: false
    }
  },
  
  /**
   * the element is ready
   */
  ready: function () {
    'use strict';
    this.app = document.querySelector('#app');
  },
  
  /**
   * submit the info to the server
   */
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
        var wall = docume;nt.querySelector('album-wall');
        wall.post = {
          type: 'newest',
          size: app.querySize,
          offset: 0
        };
        this.app.userDetails(function () {
          this.app.fetchJSON(this.app.buildUrl('getAlbumList', wall.post)).then(function (json) {
            if (json.status === 'ok') {
              this.app.showApp();
              this.app.userDetails();
              wall = json.albumList.album;
            }
          }.bind(this));
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
  
  /**
   * change the password input field from text to password hiding the password from view
   */
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
  
  /**
   * update the elements url arrtibute
   */
  _updateURL: function () {
    this.app.url = this.url;
  },
  
  /**
   * update the elements user attribute
   */
  _updateUser: function () {
    this.app.user = this.user;
  },
  
  /**
   * update the elements pass attribute
   */
  _updatePass: function () {
    this.app.pass = this.pass;
  }
});
