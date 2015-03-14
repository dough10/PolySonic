
    Polymer('volume-slider',{
      created: function () {
        this.volume = this.volume || 100;
      },
      volumeChanged: function() {
        var audio = document.getElementById("audio");
        audio.volume = this.volume / 100;
        chrome.storage.sync.set({
          'volume': this.volume
        });
      }
    });
