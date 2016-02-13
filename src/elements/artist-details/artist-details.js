(function () {
  var app = document.getElementById("tmpl");
  Polymer('artist-details', {


    domReady: function () {
      this.app = app;
      this.scrollTarget = app.appScroller();
      this.sortBy = 0;
      this.loadingBio = false;
    },


    _cropImage: function (image) {
      var containerWidth = this.$.artistCard.offsetWidth;
      var oneThird = Math.abs(containerWidth / 21);
      var height = Math.abs(oneThird * 9);
      var imgEl = new Image();
      imgEl.src = image;
      imgEl.onload = function () {
        SmartCrop.crop(imgEl, {
          width: containerWidth,
          height: height
        }, function (crops) {
          var canvas = this.$.bioImage;
          var ctx = canvas.getContext('2d');
          var crop = crops.topCrop;
          ctx.drawImage(imgEl, crop.x, crop.y, crop.width, crop.height, 0, 0, containerWidth, height);
        }.bind(this));
      }.bind(this);
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
            this.$.globals._stealColor(image, 'artistImage-' + this.artistId)
            .then(function (colors) {
              this.fabBgColor = colors[0];
              this.fabColor = colors[1];
            }.bind(this));
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

    resize: function () {
      var containerWidth = this.$.artistCard.offsetWidth;
      var oneThird = Math.abs(containerWidth / 21);
      var height = Math.abs(oneThird * 9);
      this.$.bioImage.style.height = height + 'px';
      this.$.fab.style.top = Math.abs(height - 29) + 'px';
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
