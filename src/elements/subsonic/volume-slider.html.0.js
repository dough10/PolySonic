
    Polymer('volume-slider',{
      created: function () {
        this.volume = this.volume || 100;
      },
      volumeChanged: function() {
        var audio = document.getElementById("tmpl").$.player.$.audio;
        var audio2 = document.getElementById("tmpl").$.player.$.audio2;
        audio.volume = this.volume / 100;
        audio2.volume = audio.volume;
        chrome.storage.sync.set({
          'volume': this.volume
        });
      }
    });
