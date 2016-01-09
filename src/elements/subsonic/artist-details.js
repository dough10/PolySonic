Polymer('artist-details', {
  domReady: function () {
    this.app = document.getElementById("tmpl");
    this.scrollTarget = this.app.appScroller();
    this.sortBy = 0;
    this.loadingBio = false;
  },
  queryData: function () {
    this.async(function () {
      this.app.doXhr(
        this.app.buildUrl('getArtistInfo2', {
          id: this.artistId
        }), 'json', function (e) {
        this.artistBio = e.target.response['subsonic-response'].artistInfo2;
        this.$.bio.innerHTML = this.artistBio.biography;
        this.loadingBio = true;
        this.app.doXhr(this.artistBio.largeImageUrl, 'blob', function (xhrEvent) {
          var image = window.URL.createObjectURL(xhrEvent.target.response);
          this.$.bioImage.style.backgroundImage = "url('" + image + "')";
          this.loadingBio = false;
        }.bind(this));
        this.app.doXhr(
          this.app.buildUrl('getArtist', {
            id: this.artistId
          }), 'json', function (event) {
          this.data = event.target.response['subsonic-response'].artist.album;
          this.artist = this.data[0].artist;
          for (var i = 0; i < this.data.length; i++) {
            this.data[i].listMode = this.listMode;
          }
          this.app.dataLoading = false;
          this.async(function () {
            if (this.app.page !== 3) {
              this.app.page = 3;
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
    element.$.detailsDialog.close();
    element.doPlayback();
    this.async(callback);
  },
  changeArtist: function (event, detail, sender) {
    this.artistId = sender.dataset.id;
    this.app.dataLoading = true;
    this.otherLike = undefined;
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
            this.app.playlist = playlist;
            if ('audio' in this.app.$.player && !this.app.$.player.audio.paused) {
              this.app.$.player.audio.pause();
            }
            if (this.app.playing === 0) {
              this.app.setFabColor(this.app.playlist[0]);
              this.app.$.player.playAudio(this.app.playlist[0]);
            } else {
              this.app.playing = 0;
            }
            this.app.shufflePlaylist();
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
