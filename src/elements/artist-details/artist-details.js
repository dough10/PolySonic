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
      this.async(function () {
        if (this.headerIndex) delete this.headerIndex;
        this.headerImgURL = '';
        this.artistId = artistId;
        var url = this.$.globals.buildUrl((function () {
          if (app.queryMethod === 'ID3') {
            return 'getArtistInfo2';
          } else {
            return 'getArtistInfo';
          }
        })(), {
          id: artistId
        });

        this.$.bg.style.backgroundImage = 'none';
        this.$.bioImage.style.backgroundImage = 'none';

        this.$.globals.doXhr(url, 'json').then(function (e) {
          var res = e.target.response['subsonic-response'];
          this.artistBio = (function () {
            if (app.queryMethod === 'ID3') {
              return res.artistInfo2;
            } else {
              return res.artistInfo;
            }
          })();
          if (this.artistBio && this.artistBio.hasOwnProperty('biography')) {
            this.$.bio.innerHTML = this.artistBio.biography;
          }
          if (this.artistBio && this.artistBio.hasOwnProperty('largeImageUrl')) {
            this.loadingBio = true;
            this.$.globals._fetchArtistHeaderImage(
              this.artistBio.largeImageUrl,
              artistId
            ).then(function (image) {
              this.fabBgColor = image.fabBgColor;
              this.fabColor = image.fabColor;
              this.$.bg.style.backgroundImage = "url('" + image.url + "')";
              this.headerImgURL = image.url;
              this.$.globals.getDbItem('artist-' + artistId + '-headerIndex').then(function (e) {
                this.headerIndex = e.target.result;
                if (!app._animating) this._cropIt();
              }.bind(this));
            }.bind(this));
          } else {
            this.loadingBio = false;
          }
          var url = this.$.globals.buildUrl((function () {
            if (app.queryMethod === 'ID3') {
              return 'getArtist';
            } else {
              return 'getMusicDirectory';
            }
          })(), {
            id: artistId
          });
          this.$.globals.doXhr(url, 'json').then(function (event) {
            var res = event.target.response['subsonic-response'];
            var resObj = (function () {
              if (app.queryMethod === 'ID3') {
                return {
                  response: res.artist.album,
                  artistName: res.artist.album[0].artist
                };
              } else {
                return {
                  response: res.directory.child,
                  artistName: res.directory.name
                };
              }
            })();
            this.data = resObj.response;
            this.artistName = resObj.artistName;
            for (var i = 0; i < this.data.length; i++) {
              this.data[i].listMode = this.listMode;
            }
            this.async(function () {
              app.dataLoading = false;
              this.sortByChanged();
              app.page = 3;
            });
          }.bind(this));
        }.bind(this));
      });
    },

    _nextIndex: function () {
      this.loadingBio = true;
      if (this.headerIndex) {
        this.headerIndex = this.headerIndex + 1;
      } else {
        this.headerIndex = 1;
      }
      this.$.globals._putInDb(
        this.headerIndex,
        'artist-' + this.artistId + '-headerIndex'
      ).then(this._cropIt.bind(this));
    },

    _lastIndex: function () {
      this.loadingBio = true;
      if (this.headerIndex) {
        this.headerIndex = this.headerIndex - 1;
      } else {
        this.headerIndex = 1;
      }
      this.$.globals._putInDb(
        this.headerIndex,
        'artist-' + this.artistId + '-headerIndex'
      ).then(this._cropIt.bind(this));
    },

    _cropIt: function () {
      if (this.headerImgURL) {
        this.$.globals._cropImage(
          this.headerImgURL,
          this.headerIndex || 0
        ).then(function (croppedURL) {
          this.$.bioImage.style.backgroundImage = "url('" + croppedURL + "')";
          this.loadingBio = false;
        }.bind(this));
      } else {
        this.loadingBio = false;
      }
    },

    _animationEnd: function () {
      this._cropIt();
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
      return new Promise(function (resolve, reject) {
        var containerWidth = this.$.artistCard.offsetWidth;
        var parts = Math.abs(containerWidth / 21);
        var height = Math.abs(parts * 9);
        this.$.bioImage.style.height = height + 'px';
        this.$.fab.style.top = Math.abs(height - 29) + 'px';
        resolve();
      }.bind(this));
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
      var playing = false;
      app.playlist = [];
      if ('audio' in app.$.player && !app.$.player.audio.paused) {
        app.$.player.audio.pause();
      }
      for (var i = 0; i < albums.length; i++) {
        (function (i) {
          albums[i].doQuery().then(function () {
            app.playlist = app.playlist.concat(albums[i].playlist);
            app.shufflePlaylist();
            if (!playing) {
              playing = true;
              // idk where this undefined item is coming from be it need to be removed
              if (app.playlist[0] === undefined) {
                app.playlist.splice(0, 1);
              }
              this.$.globals.playListIndex(0);
              this.app.dataLoading = false;
            }
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
