
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
        } else if (this.page === 3) {
          pName = 'Album Details';
          this.state = 'mid';
        } else if (this.page === 0) {
          pName = 'Album Wall';
          this.state = 'off';
        } else if (this.page === 2)  {
          pName = 'Settings';
          this.state = 'off';
        } else if (this.page === 4) {
          pName = 'Artist Details';
          this.state = 'off';
        } else {
          this.state = 'off';
        }
        document.querySelector("#tmpl").tracker.sendAppView(pName);
      }
    });
