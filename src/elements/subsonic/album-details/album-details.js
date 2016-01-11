(function () {
  'use strict';
  var app = document.querySelector('#tmpl');
  Polymer('album-details', {
    ready: function () {
      this.app = app;
    },
    
    add2Playlist: function () {
      this.app.playlist = this.app.playlist.concat(this.playlist);
      this.$.detailsDialog.close();
      this.app.$.fab.state = 'off';
      this.$.globals.makeToast(this.$.globals.texts.added2Queue);
      this.app.dataLoading = false;
      if ('audio' in this.app.$.player && this.app.$.player.audio.paused) {
        if (this.app.playing === 0) {
          this.app.setFabColor(this.app.playlist[0]);
          this.app.$.player.playAudio(this.app.playlist[0]);
        } else {
          this.app.playing = 0;
        }
      } else {
        this.app.setFabColor(this.app.playlist[0]);
        this.app.$.player.playAudio(this.app.playlist[0]);
      }
    },
    
    downloadAlbum: function (event, detail, sender) {
      var manager = new DownloadManager();
      this.app.$.downloads.appendChild(manager);
      this.app.isDownloading = true;
      manager.downloadAlbum({
        id: this.albumID,
        artist: this.artist,
        album: this.album,
        size: this.albumSize
      }, function () {
        console.log('Download Finished: ' + this.artist + ' - ' + this.album);
      }.bind(this));
    },
    
    downloadTrack: function (event, detail, sender) {
      var manager = new DownloadManager();
      this.app.$.downloads.appendChild(manager);
      this.app.isDownloading = true;
      manager.downloadTrack(sender.attributes.ident.value, function () {
        console.log('Track Download Finished');
      }.bind(this));
    },
    
    playSingle: function (event, detail, sender) {
      this.app.$.albumDialog.opened = false;
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
      this.app.setFabColor(this.app.playlist[0]);
      if (this.app.playing === 0) {
        this.app.$.player.playAudio(this.app.playlist[0]);
      } else {
        this.app.playing = 0;
      }
      this.app.$.fab.state = 'off';
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
      if (this.app.$.player.audio.paused) {
        this.app.setFabColor(this.app.playlist[0]);
        if (this.app.playing === 0) {
          this.app.$.player.playAudio(this.playlist[0]);
        } else {
          this.app.playing = 0;
        }
      }
      this.$.globals.makeToast(this.$.globals.texts.added2Queue);
    },
    
    addFavorite: function (event, detail, sender) {
      var url = this.$.globals.buildUrl('star', {
        albumId: sender.attributes.ident.value
      });
      var animation = this.$.globals.attachAnimation(sender);
      animation.target = sender;
      animation.play();
      this.$.globals.doXhr(url, 'json').then(function (e) {
        if (e.target.response['subsonic-response'].status === 'ok') {
          this.isFavorite = true;
          animation.cancel();
        }
      }.bind(this));
    },
    
    removeFavorite: function (event, detail, sender) {
      var url = this.$.globals.buildUrl('unstar', {
        albumId: sender.attributes.ident.value
      });
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
      this.$.bookmarkConfirm.open();
    },

    deleteBookmark: function (event) {
      var url = this.$.globals.buildUrl('deleteBookmark', {
        id: this.delID
      });
      this.$.globals.doXhr(url, 'json').then(function (e) {
        if (e.target.response['subsonic-response'].status === 'ok') {
          this.doQuery();
        } else {
          this.$.globals.makeToast(e.target.response['subsonic-response'].error.message);
        }
      });
    },

    /**
     * choose to playback from bookmark or start of track
     */
    playChoice: function (event, detail, sender) {
      if (this.app.$.albumDialog.opened) {
        this.app.$.albumDialog.opened = false;
      }
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
    
    moreLikeCallback: function () {
      if (this.app.$.player.audio.paused) {
        this.app.$.player.getImageForPlayer(this.app.playlist[0].cover, function () {
          this.app.playing = 0;
          this.app.setFabColor(this.app.playlist[0]);
          this.app.$.player.playAudio(this.app.playlist[0]);
          this.app.dataLoading = false;
        }.bind(this));
      }
    },

    moreLike: function (event, detail, sender) {
      var id = sender.attributes.ident.value;
      this.app.$.albumDialog.opened = false;
      this.app.$.fab.state = 'off';
      this.app.dataLoading = true;
      var url = this.$.globals.buildUrl('getSimilarSongs', {
        count: 50,
        id: id
      });
      this.$.globals.doXhr(url, 'json').then(function (e) {
        var response = e.target.response['subsonic-response'].similarSongs.song;
        if (response) {
          if ('audio' in this.app.$.player && !this.app.$.player.audio.pause) {
            this.app.$.player.audio.pause();
          }
          this.app.playlist.length = 0;
          var rlength = response.length;
          for (var i = 0; i < rlength; i++) {
            var obj = {
              id: response[i].id,
              artist: response[i].artist,
              title: response[i].title,
              duration: this.$.globals.secondsToMins(response[i].duration)
            },
            artId = 'al-' + response[i].albumId;
            this.$.globals.getDbItem(artId, function (ev) {
              this.moreCallback(ev,obj,artId);
            }.bind(this));
          }
        } else {
          this.app.dataLoading = false;
          this.$.globals.makeToast(this.$.globals.texts.noResults);
        }
      }.bind(this));
    },

    moreCallback: function (artEvent, obj, artId) {
      if (artEvent.target.result) {
        obj.cover = window.URL.createObjectURL(artEvent.target.result);
        this.$.globals.getDbItem(artId + '-palette', function (paletteEvent) {
          obj.palette = paletteEvent.target.result;
          this.app.playlist.push(obj);
          this.moreLikeCallback();
        }.bind(this));
      } else {
        this.$.globals.getImageFile(
          this.$.globals.buildUrl('getCoverArt', {
            size: 550,
            id: artId
          }), artId, function (xhrEvent) {
          obj.cover = window.URL.createObjectURL(xhrEvent.target.result);
          this.$.globals.stealColor(imgURL, artId, function (colorArray) {
            obj.palette = colorArray;
            this.app.playlist.push(obj);
            this.moreLikeCallback();
          }.bind(this));
        }.bind(this));
      }
    },

    closeDialog: function () {
      this.app.tracker.sendAppView('Album Wall');
      this.$.detailsDialog.close();
      this.app.$.fab.state = 'off';
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
      this.$.topper.style.backgroundImage = "url('" + this.details.cover + "')";
    }
  });
})();