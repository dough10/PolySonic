
    Polymer('animated-fab',{
      created: function () {
        this.state = this.state || "off";
        this.page = this.page || 0;
      },
      pageChanged: function () {
        var pName;
        if (this.page === 1) {
          pName = 'Player';
          this.state = 'top';
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

      /* listens to changes in this.playing and updates the player */
      playingChanged: function () {
        if (this.playing) {
          document.getElementById('tmpl').playThis();
        }
      }
    });
