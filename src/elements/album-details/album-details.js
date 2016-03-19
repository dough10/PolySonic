(function () {
  'use strict';
  var app = document.querySelector('#tmpl');
  Polymer('album-details', {
    ready: function () {
      this.app = app;
    },

    add2Playlist: function () {
      this.app.playlist = this.app.playlist.concat(this.playlist);
      this.$.globals.makeToast(this.$.globals.texts.added2Queue);
      this.app.dataLoading = false;
      if ('audio' in this.app.$.player && this.app.$.player.audio.paused) {
        this.$.globals.playListIndex(0);
      } else if (!this.app.$.player.audio) {
        this.$.globals.playListIndex(0);
      }
    },

    downloadAlbum: function (event, detail, sender) {
      this.app.isDownloading = true;
      var manager = new DownloadManager();
      manager.downloadAlbum({
        id: this.albumID,
        artist: this.artist,
        album: this.album,
        size: this.albumSize
      });
      this.app.$.downloads.appendChild(manager);
    },

    downloadTrack: function (event, detail, sender) {
      var manager = new DownloadManager();
      this.app.isDownloading = true;
      var id = sender.attributes.ident.value;
      manager.downloadTrack(id);
      this.app.$.downloads.appendChild(manager);
    },

    close: function () {
      this.app.tracker.sendAppView('Album Wall');
      this.opened = false;
      this.app.$.fab.state = 'off';
    },

    playSingle: function (event, detail, sender) {
      this.app.playlist = [
        {
          id: sender.attributes.ident.value,
          artist: sender.attributes.artist.value,
          title: sender.attributes.trackTitle.value,
          duration: sender.attributes.duration.value,
          cover: this.imgURL,
          palette: this.palette,
          disk: 0,
          track: 0
        }
      ];
      if (sender.attributes.bookmark) {
        this.app.playlist[0].bookmarkPosition = sender.attributes.bookmark.value;
      }
      this.$.globals.playListIndex(0);
    },

    addSingle2Playlist: function (event, detail, sender) {
      this.app.playlist.push({
        id: sender.attributes.ident.value,
        artist: sender.attributes.artist.value,
        title: sender.attributes.trackTitle.value,
        duration: sender.attributes.duration.value,
        cover: this.imgURL,
        palette: this.palette,
        disk: 0,
        track: 0
      });
      if ('audio' in this.app.$.player && this.app.$.player.audio.paused) {
        this.$.globals.playListIndex(0);
      } else if (!this.app.$.player.audio) {
        this.$.globals.playListIndex(0);
      }
      this.$.globals.makeToast(this.$.globals.texts.added2Queue);
    },

    addFavorite: function (event, detail, sender) {
      var url = this.$.globals.buildUrl('star', (function () {
        if (this.app.queryMethod === 'ID3') {
          return {
            albumId: this.albumID
          };
        } else {
          return {
            id: this.albumID
          };
        }
      }.bind(this))());
      var animation = this.$.globals.attachAnimation(sender);
      animation.play();
      this.$.globals.doXhr(url, 'json').then(function (e) {
        if (e.target.response['subsonic-response'].status === 'ok') {
          this.isFavorite = true;
          animation.cancel();
        }
      }.bind(this));
    },

    removeFavorite: function (event, detail, sender) {
      var url = this.$.globals.buildUrl('unstar', (function () {
        if (this.app.queryMethod === 'ID3') {
          return {
            albumId: this.albumID
          };
        } else {
          return {
            id: this.albumID
          };
        }
      }.bind(this))());
      var animation = this.$.globals.attachAnimation(sender);
      animation.play();
      this.$.globals.doXhr(url, 'json').then(function (e) {
        if (e.target.response['subsonic-response'].status === 'ok') {
          this.isFavorite = false;
          animation.cancel();
        }
      }.bind(this));
    },

    conBookDel: function (event, detail, sender) {
      this.delID = sender.attributes.ident.value;
      this.close();
      this.$.bookmarkConfirm.open();
    },

    _artist: function () {
      var artist = document.getElementById("aDetails");
      this.app.dataLoading = true;
      artist.queryData(this.details.artistId);
      this.close();
    },

    deleteBookmark: function (event) {
      var url = this.$.globals.buildUrl('deleteBookmark', {
        id: this.delID
      });
      this.$.globals.doXhr(url, 'json').then(function (e) {
        if (e.target.response['subsonic-response'].status !== 'ok') {
          this.$.globals.makeToast(e.target.response['subsonic-response'].error.message);
        } else {
          var item = this.app.$.wall.$.all.querySelector('#ac' + this.details.id);
          item.doQuery();
        }
      }.bind(this));
    },

    /**
     * choose to playback from bookmark or start of track
     */
    playChoice: function (event, detail, sender) {
      this.close();
      this.$.playbackConfirm.open();
      this.bookMark = {
        id: sender.attributes.ident.value,
        artist: sender.attributes.artist.value,
        title: sender.attributes.trackTitle.value,
        duration: sender.attributes.duration.value,
        bookmarkPosition: sender.attributes.bookmark.value,
        cover: sender.attributes.cover.value
      };
      this.bookmarkTime = this.$.globals.secondsToMins(sender.attributes.bookmark.value / 1000);
    },

    _dialogOpened: function () {
      this.app.$.fab.state = 'mid';
    },

    moreLike: function () {
      var id = this.details.artistId;
      this.close();
      var playing = false;
      this.app.dataLoading = true;
      var url = this.$.globals.buildUrl('getSimilarSongs2', {
        count: 50,
        id: id
      });
      this.$.globals.doXhr(url, 'json').then(function (e) {
        var response = e.target.response['subsonic-response'].similarSongs2.song;
        if (response.length) {
          if ('audio' in this.app.$.player && !this.app.$.player.audio.pause) {
            this.app.$.player.audio.pause();
          }
          this.app.playlist = [];
          response.forEach(function (item, index) {
            var obj = {
              id: item.id,
              artist: item.artist,
              title: item.title,
              duration: this.$.globals.secondsToMins(item.duration)
            };
            var artId = 'al-' + item.albumId;
            this.$.globals.fetchImage(artId).then(function (imgURL) {
              obj.cover = imgURL;
              this.$.globals.getDbItem(artId + '-palette').then(function (e) {
                obj.palette = e.target.result;
                this.app.playlist.push(obj);
                if (!playing) {
                  playing = true;
                  this.app.dataLoading = false;
                  this.$.globals.playListIndex(0);
                }
              }.bind(this));
            }.bind(this));
          }.bind(this));
        } else {
          this.app.dataLoading = false;
          this.$.globals.makeToast(this.$.globals.texts.noResults);
        }
      }.bind(this));
    },

    detailsChanged: function () {
      this.artist = this.details.artist;
      this.album = this.details.album;
      this.item = this.details.id;
      this.playlist = this.details.tracks;
      this.albumSize = this.details.size;
      this.imgURL = this.details.cover;
      this.palette = this.details.palette;
      this.albumID = this.details.id;
      this.isFavorite = this.details.isFavorite || false;
      this.$.topper.style.backgroundImage = "url('" + this.details.cover + "')";
      var nameTitle = this.artist + ' / ' + this.album;
      switch (true) {
        case (nameTitle.length > 120):
          this.$.nameTitle.style.fontSize = '12pt';
          break;
        case (nameTitle.length > 100 && nameTitle.length < 120):
          this.$.nameTitle.style.fontSize = '13pt';
          break;
        default:
          this.$.nameTitle.style.fontSize = '14pt';
          break;
      }
      this.$.nameTitle.textContent = nameTitle;
    },

    _resized: function (e) {
      if (this.$.detailsDialog.opened) {
        this.$.detailsDialog.resizeHandler();
      }
    }
  });
})();
