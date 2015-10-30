
    Polymer('volume-slider',{
      created: function () {
        this.volume = this.volume || 100;
      },
      volumeChanged: function() {
        var audio = document.getElementById("tmpl").$.player.audio;
        if (audio) {
          audio.volume = this.volume / 100;
        }
        simpleStorage.setSync({
          'volume': this.volume
        });
      }
    });
