(function () {
  var app = document.getElementById("tmpl");

  Polymer('artist-details', {


    domReady: function () {
      this.app = app;
      this.scrollTarget = app.appScroller();
      this.sortBy = 0;
      this.loadingBio = false;
    },

    /**
     * get the info about this artist from subsonic
     */
    queryData: function (artistId) {
      app.page = 3;
      this.async(function () {
        var url;
        if (app.queryMethod === 'ID3') {
          url= this.$.globals.buildUrl('getArtistInfo2', {
            id: artistId
          });
        } else {
          url= this.$.globals.buildUrl('getArtistInfo', {
            id: artistId
          });
        }
        this.$.globals.doXhr(url, 'json').then(function (e) {
          var res = e.target.response['subsonic-response'];
          var artistBio;
          if (app.queryMethod === 'ID3') {
            artistBio = res.artistInfo2;
          } else {
            artistBio = res.artistInfo;
          }
          this.artistBio = artistBio;
          this.$.bio.innerHTML = artistBio.biography;
          this.loadingBio = true;
          this.$.globals._fetchArtistHeaderImage(
            artistBio.largeImageUrl,
            artistId
          ).then(function (image) {
            this.$.globals._cropImage(image.url).then(function (croppedURL) {
              this.$.bioImage.style.backgroundImage = "url('" + croppedURL + "')";
              this.loadingBio = false;
            }.bind(this));
            this.fabBgColor = image.fabBgColor;
            this.fabColor = image.fabColor;
            this.$.bg.style.backgroundImage = "url('" + image.url + "')";
          }.bind(this));
          var url;
          if (app.queryMethod === 'ID3') {
            url = this.$.globals.buildUrl('getArtist', {
              id: artistId
            });
          } else {
            url = this.$.globals.buildUrl('getMusicDirectory', {
              id: artistId
            });
          }
          this.$.globals.doXhr(url, 'json').then(function (event) {
            var res = event.target.response['subsonic-response'];
            if (app.queryMethod === 'ID3') {
              this.data = res.artist.album;
            } else {
              this.data = res.directory.child;
            }
            this.artistName = this.data[0].artist;
            for (var i = 0; i < this.data.length; i++) {
              this.data[i].listMode = this.listMode;
            }
            this.async(function () {
              app.dataLoading = false;
              this.sortByChanged();
            });
          }.bind(this));
        }.bind(this));
      });
    },

    /**
     * sort the albums for this artist
     */
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

    /**
     * size the header image
     */
    resize: function () {
      var containerWidth = this.$.artistCard.offsetWidth;
      var oneThird = Math.abs(containerWidth / 21);
      var height = Math.abs(oneThird * 9);
      this.$.bioImage.style.height = height + 'px';
      this.$.fab.style.top = Math.abs(height - 29) + 'px';
    },

    /**
     * play the album with the givin id
     * @param {String} id
     */
    playSomething: function (id, callback) {
      var element = this.$.all.querySelector('#' + id);
      element.doPlayback();
      this.async(callback);
    },

    /**
     * call a update of artist info
     */
    changeArtist: function (event, detail, sender) {
      app.dataLoading = true;
      this.queryData(sender.dataset.id);
    },

    /**
     * create a play queue of all tracks by this artist
     */
    playAllAlbums: function () {
      this.app.dataLoading = true;
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
              this.app.dataLoading = false;
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
