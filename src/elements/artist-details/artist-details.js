(function () {
  var app = document.getElementById("tmpl");

  function eHandler(e) {
    throw new Error(e);
  }

  Polymer('artist-details', {


    domReady: function () {
      this.app = app;
      this.scrollTarget = app.appScroller();
      this.sortBy = 0;
      this.loadingBio = false;
    },

    _saveFile: function (blob) {
      return new Promise(function (resolve, reject) {
        var fileName = app.filePath + '/artist-' + this.artistId + '.jpg';
        app.fs.root.getFile(fileName, {
          create: true
        }, function(fileEntry) {
          fileEntry.createWriter(function(fileWriter) {
            fileWriter.onwriteend = function(e) {
              app.fs.root.getFile(fileName, {
                create: false
              }, function(retrived) {
                resolve(retrived.toURL());
              });
            };
            fileWriter.onerror = function(e) {
              console.log('Write failed: ' + e.toString());
            };
            var blob = new Blob([ blob ], { type: 'image/jpeg' });
            fileWriter.write(blob);
          }.bind(this), eHandler);
        }.bind(this), eHandler);
      }.bind(this));
    },


    /**
     * use smartCrop to attempt to get a well centered header image
     * @param {String} image - url to the image we are attempting to crop
     */
    _cropImage: function (image) {
      return new Promise(function (resolve, reject) {
        var container = this.$.bioImage;
        var containerWidth = 808;
        var oneThird = Math.abs(containerWidth / 21);
        var height = Math.abs(oneThird * 9);
        var imgEl = new Image();
        imgEl.src = image;
        imgEl.onload = function imgLoaded() {
          SmartCrop.crop(imgEl, {
            width: containerWidth,
            height: height
          }, function imgCropped(crops) {
            var canvas = document.createElement('canvas');
            canvas.width = containerWidth;
            canvas.height = height;
            var ctx = canvas.getContext('2d');
            var crop = crops.crops[1];
            ctx.drawImage(imgEl, crop.x, crop.y, crop.width, crop.height, 0, 0, containerWidth, height);
            resolve(canvas.toDataURL('image/jpg'));
          }.bind(this));
        }.bind(this);
      }.bind(this));
    },

    /**
     * fetch header image. either from HTML filesystem or from internet
     * @param {String} url - url to the image we want to use for the header
     */
    _fetchImage: function (url) {
      return new Promise(function (resolve, reject) {
        this.app.fs.root.getFile(this.app.filePath + '/artist-' + this.artistId + '.jpg', {
          create: false,
          exclusive: true
        }, function(fileEntry) {
          this.$.globals.getDbItem('artist-' + this.artistId + '-palette').then(function (colors) {
            colors = colors.target.result;
            resolve({
              url: fileEntry.toURL(),
              fabBgColor: colors[0],
              fabColor: colors[1]
            });
          }.bind(this));
        }.bind(this), function () {
          this.$.globals.doXhr(url, 'blob').then(function (xhrEvent) {
            var blob = xhrEvent.target.response;
            var image = window.URL.createObjectURL(blob);
            this._saveFile(blob).then(function (location) {
              console.log('file saved to ' + location);
            });
            this.$.globals._stealColor(image, 'artist-' + this.artistId).then(function (colors) {
              resolve({
                url: image,
                fabBgColor: colors[0],
                fabColor: colors[1]
              });
            }.bind(this));
          }.bind(this));
        }.bind(this));
      }.bind(this));
    },

    /**
     * get the info about this artist from subsonic
     */
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
          this._fetchImage(artistBio.largeImageUrl).then(function (image) {
            this.imgURL = image.url;
            this.fabBgColor = image.fabBgColor;
            this.fabColor = image.fabColor;
            this.$.bg.style.backgroundImage = "url('" + image.url + "')";
            this._cropImage(image.url).then(function (croppedURL) {
              this.$.bioImage.style.backgroundImage = "url('" + croppedURL + "')";
              this.loadingBio = false;
            }.bind(this));
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
      this.artistId = sender.dataset.id;
      app.dataLoading = true;
      this.async(this.queryData);
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
