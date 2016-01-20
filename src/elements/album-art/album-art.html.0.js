/*global Polymer, console, document, Blob, window, Image, CoreAnimation */
(function () {
  'use strict';
  Polymer('album-art', {

    imgURL: '',
    defaultImgURL: '../../../images/default-cover-art.png',
    albumSize: 0,
    showingDetails: false,
    isLoading: false,

    mouseIn: function (event, detail, sender) {
      sender.setZ(2);
    },

    mouseOut: function (event, detail, sender) {
      sender.setZ(1);
    },

    ready: function () {
      this.artist = this.artist || "Artist Name";
      this.album = this.album || "Album Title";
      this.app = document.getElementById("tmpl");
      this.app.colorThiefAlbum = this.app.colorThiefAlbum  || '#db4437';
      this.app.colorThiefAlbumOff = this.app.colorThiefAlbumOff  || 'white';
    },

    setImage: function (imgURL) {
      this.$.card.style.backgroundImage = "url('" + imgURL + "')";
      this.$.smallCover.style.backgroundImage = "url('" + imgURL + "')";
      this.isLoading = false;
      this.imgURL = imgURL;
    },

    showDialog: function () {
      this.async(function () {
        this.app.dataLoading = false;
        this.app.tracker.sendAppView('Album Details');
        if (this.playlist[0].palette) {
          this.app.colorThiefAlbum = this.playlist[0].palette[0];
          this.app.colorThiefAlbumOff = this.playlist[0].palette[1];
        }
        var details = {
          album: this.album,
          artist: this.artist,
          cover: this.imgURL,
          palette: this.palette,
          id: this.item,
          isFavorite: this.isFavorite,
          size: this.albumSize,
          tracks: this.playlist,
          artistId: this.artistId
        };
        var dialog = this.app.$.albumDialog;
        dialog.details = details;
        dialog.opened = true;
        this.app.$.fab.state = 'mid';
        this.app.$.fab.ident = this.id;
      });
    },

    chooseOption: function () {
      if (this.bookmarkIndex !== undefined) {
        this.app.dataLoading = false;
        this.bookmarkTime = this.$.globals.secondsToMins(this.playlist[this.bookmarkIndex].bookmarkPosition / 1000);
        this.$.albumPlaybackConfirm.open();
        if (this.app.$.albumDialog.opened) {
          this.app.$.albumDialog.opened = false;
        }
      } else {
        this.playAlbum();
      }
    },

    playFromBookmark: function () {
      this.shortPlaylist = this.playlist.splice(this.bookmarkIndex);
      this.app.dataLoading = false;
      this.app.$.albumDialog.opened = false;
      this.app.playlist = this.shortPlaylist;
      this.$.globals.playListIndex(0);
    },

    playAlbum: function () {
      var pLength = this.playlist.length;
      for (var i = 0; i < pLength; i++) {
        if (this.playlist[i].bookmarkPosition) {
          delete this.playlist[i].bookmarkPosition;
        }
      }
      this.app.dataLoading = false;
      this.app.$.albumDialog.opened = false;
      this.app.playlist = this.playlist;
      this.$.globals.playListIndex(0);
    },


    doPlayback: function () {
      this.app.dataLoading = true;
      this.doQuery().then(this.chooseOption.bind(this));
    },

    showDetails: function () {
      this.app.dataLoading = true;
      this.doQuery().then(this.showDialog.bind(this));
    },


    processJSON: function (e) {
      return new Promise(function (resolve, reject) {
        this.playlist.length = 0;
        this.artistId = e.target.response['subsonic-response'].album.artistId;
        this.albumID = e.target.response['subsonic-response'].album.song[0].parent;
        var tracks = e.target.response['subsonic-response'].album.song;
        var length = tracks.length;
        for (var i = 0; i < length; i++) {
          this.albumSize = this.albumSize + tracks[i].size;
          this.playlist.push({
            id: tracks[i].id,
            artist: tracks[i].artist,
            title: tracks[i].title,
            duration: this.$.globals.secondsToMins(tracks[i].duration),
            cover: this.imgURL,
            bookmarkPosition: tracks[i].bookmarkPosition,
            palette: this.palette,
            disk: tracks[i].diskNumber,
            track: tracks[i].track
          });
          if (tracks[i].bookmarkPosition && this.bookmarkIndex === undefined) {
            this.bookmarkIndex = i;
          }
        }
        /* sort tracks by diskNumber thanks Joe Shelby */
        this.playlist.sort(function sorting(a, b) {
          var da = a.discNumber || 0, db = b.discNumber || 0,
            ta = a.track || 0, tb = b.track || 0;
          if (da === db) {
            return ta - tb;
          } else {
            return da - db;
          }
        });
        this.async(resolve);
      }.bind(this));
    },

    doQuery: function () {
      return new Promise(function (resolve, reject) {
        this.$.globals.getDbItem("al-" + this.item + '-palette').then(function (e) {
          this.palette = e.target.result;
          var url = this.$.globals.buildUrl('getAlbum', {
            id: this.item
          });
          this.$.globals.doXhr(url, 'json').then(this.processJSON.bind(this)).then(resolve);
        }.bind(this));
      }.bind(this));
    },

    _updateItem: function () {
      this.bookmarkIndex = undefined;
      if (this.item && !this.app.scrolling) {
        this.playlist = [];
        this.albumSize = 0;
        this.isLoading = true;
        this.$.globals.fetchImage("al-" + this.item).then(this.setImage.bind(this));
      } else {
        this.async(this.itemChanged, null, 50);
      }
    },

    itemChanged: function () {
      this.async(this._updateItem);
    }
  });
})();
