
    Polymer('volume-slider',{
      created: function () {
        this.volume = this.volume || 100;
      },
      volumeChanged: function() {
        var audio = document.getElementById("tmpl").$.player.$.audio;
        audio.volume = this.volume / 100;
        chrome.storage.sync.set({
          'volume': this.volume
        });
      }
    });
