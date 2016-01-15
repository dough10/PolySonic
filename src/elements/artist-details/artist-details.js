(function () {
  var app = document.getElementById("tmpl");
  Polymer('artist-details', {


    domReady: function () {
      this.app = app;
      this.scrollTarget = app.appScroller();
      this.sortBy = 0;
      this.loadingBio = false;
    },


    queryData: function () {
      this.async(function () {
        var url = this.$.globals.buildUrl('getArtistInfo2', {
          id: this.artistId
        });
        this.$.globals.doXhr(url, 'json').then(function (e) {
          var artistBio = e.target.response['subsonic-response'].artistInfo2;
          this.artistBio = artistBio;
          this.$.bio.innerHTML = artistBio.biography;
          this.loadingBio = true;
          this.$.globals.doXhr(artistBio.largeImageUrl, 'blob').then(function (xhrEvent) {
            var image = window.URL.createObjectURL(xhrEvent.target.response);
            this.$.bioImage.style.backgroundImage = "url('" + image + "')";
            this.$.bg.style.backgroundImage = "url('" + image + "')";
            this.loadingBio = false;
          }.bind(this));
          var url = this.$.globals.buildUrl('getArtist', {
            id: this.artistId
          });
          this.$.globals.doXhr(url, 'json').then(function (event) {
            this.data = event.target.response['subsonic-response'].artist.album;
            this.artist = this.data[0].artist;
            for (var i = 0; i < this.data.length; i++) {
              this.data[i].listMode = this.listMode;
            }
            app.dataLoading = false;
            this.async(function () {
              if (app.page !== 3) {
                app.page = 3;
              }
              this.sortByChanged();
            });
          }.bind(this));
        }.bind(this));
      });
    },


    sortByChanged: function () {
      this.async(function () {
        if (this.data !== undefined) {
          switch (this.sortBy) {
            case 0:
              this.data.sort(function(a, b){
                if(a.name < b.name) return -1;
                if(a.name > b.name) return 1;
                return 0;
              });
              break;
            case 1:
              this.data.sort(function (a,b) {
                return a.year - b.year;
              });
              break;
            case 2:
              this.data.sort(function (a,b) {
                return a.year - b.year;
              });
              this.data.reverse();
              break;
          }
        }
      });
    },


    playSomething: function (id, callback) {
      var element = this.$.all.querySelector('#' + id);
      element.doPlayback();
      this.async(callback);
    },


    changeArtist: function (event, detail, sender) {
      this.artistId = sender.dataset.id;
      app.dataLoading = true;
      this.async(this.queryData);
    },


    playAllAlbums: function () {
      var albums = this.$.all.querySelectorAll('album-art');
      var albumsLength = albums.length;
      var playlist = [];
      for (var i = 0; i < albums.length; i++) {
        (function (i) {
          albums[i].doQuery().then(function () {
            playlist = playlist.concat(albums[i].playlist);
            this.job('return', function () {
              app.playlist = playlist;
              if ('audio' in app.$.player && !app.$.player.audio.paused) {
                app.$.player.audio.pause();
              }
              this.$.globals.playListIndex(0);
              app.shufflePlaylist();
            }, 300);
          }.bind(this));
        }.bind(this))(i);
      }
    },


    mouseIn: function (event, detail, sender) {
      sender.setZ(2);
    },


    mouseOut: function (event, detail, sender) {
      sender.setZ(1);
    }
  });

})();
