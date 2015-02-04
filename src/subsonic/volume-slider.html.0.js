
    Polymer('volume-slider',{
      ready: function () {
        this.volume = this.volume || 100;
      },
      volumeChanged: function() {
        var audio = document.querySelector("#audio");
        audio.volume = this.volume / 100;
      }
    });
