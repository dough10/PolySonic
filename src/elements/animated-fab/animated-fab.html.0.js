Polymer('animated-fab',{
  created: function () {
    this.state = this.state || "off";
    this.page = this.page || 0;
    this.timer = 0;
  },
  ready: function () {
    this.setPos();
  },
  setPos: function () {
    this.$.mid.style.top = Math.floor((window.innerHeight / 2) + 23) + 'px';
    this.$.mid.style.right = Math.floor((window.innerWidth / 2) - 250) + 'px';
  },
  domReady: function () {
    this.app = document.getElementById('tmpl');
    this.bottomPos = 16;
    this.ready = true;
  },
  resize: function () {
    if (this.app.page === 1) {
      if (!this.app.$.player.small) {
        this.state = 'large';
        this.$.large.style.top = Math.floor((window.innerHeight / 2) - 261) + 'px';
        this.$.large.style.right = Math.floor((window.innerWidth / 2) - 266) + 'px';
      } else {
        this.state = 'top';
      }
    }
  },
  pageChanged: function () {
    var pName;
    if (this.page === 1) {
      pName = 'Player';
      this.resize();
    } else if (this.page === 0) {
      pName = 'Album Wall';
      this.state = 'off';
    } else if (this.page === 2)  {
      pName = 'Settings';
      this.state = 'off';
    } else if (this.page === 3) {
      pName = 'Artist Details';
      this.state = 'off';
    } else {
      this.state = 'off';
    }
    if (this.page === 0 && this.showing === 'podcast') {
      this.state = 'podcast';
    }
    document.getElementById("tmpl").tracker.sendAppView(pName);
  },
  isNowPlayingChanged: function (newVal, oldVal) {
    if (newVal) {
      this.bottomPos = 105;
      clearTimeout(this.timer);
      this.timer = 0;
    } else {
      if (this.ready && this.app) {
        if (!this.app.playlist[0]) {
          this.bottomPos = 16;
        } else {
          this.timer = setTimeout(function () {
            this.bottomPos = 16;
          }.bind(this), 120000);
        }
      }
    }
  }
});

