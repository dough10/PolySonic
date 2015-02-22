
    Polymer('animated-fab',{
      created: function () {
        this.state = this.state || "off";
        this.page = this.page || 0;
      },
      pageChanged: function () {
        if (this.page === 1) {
          this.state = 'top';
        } else if (this.page === 3) {
          this.state = 'mid';
        } else {
          this.state = 'off';
        }
      }
    });
