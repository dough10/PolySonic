/*global Polymer, console, chrome, document, Blob, window, Image, CoreAnimation, DownloadManager */
Polymer('album-art', {
  fromStart: chrome.i18n.getMessage('fromStart'),
  playFrom: chrome.i18n.getMessage('playFrom'),
  hasBookmark: chrome.i18n.getMessage('hasBookmark'),
  moreLikeThis: chrome.i18n.getMessage("moreLikeThis"),
  backButton: chrome.i18n.getMessage("backButton"),
  playTrackLabel: chrome.i18n.getMessage("playTrack"),
  moreOptionsLabel: chrome.i18n.getMessage("moreOptionsLabel"),
  closeLabel: chrome.i18n.getMessage("closeLabel"),
  add2PlayQueue: chrome.i18n.getMessage("add2PlayQueue"),
  favoriteAlbum: chrome.i18n.getMessage("favoriteAlbum"),
  downloadButton: chrome.i18n.getMessage("downloadButton"),
  albumTracklist: chrome.i18n.getMessage("albumTracklist"),
  imgURL: '',
  defaultImgURL: '../../../images/default-cover-art.png',
  albumSize: 0,
  size: '250px',

  ready: function () {
    'use strict';

    this.artist = this.artist || "Artist Name";

    this.album = this.album || "Album Title";

    this.app = document.getElementById("tmpl");

    this.playerArt = document.getElementById("coverArt");

    this.app.colorThiefAlbum = this.app.colorThiefAlbum  || '#db4437';

    this.app.colorThiefAlbumOff = this.app.colorThiefAlbumOff  || 'white';

  },

  /* setup image  */
  setImage: function (event, callback) {
    'use strict';
    var imgURL = window.URL.createObjectURL(event.target.result);
    this.showArt(imgURL);
    this.isLoading = false;
    this.imgURL = imgURL;
    if (callback) {
      callback(imgURL);
    } else {
      imgURL = null;
    }
  },

  mouseIn: function (event, detail, sender) {
    'use strict';
    sender.setZ(2);
  },

  mouseOut: function (event, detail, sender) {
    'use strict';
    sender.setZ(1);
  },

  showArt: function (image) {
    'use strict';
    this.$.card.style.backgroundImage = "url('" + image + "')";
    this.$.topper.style.backgroundImage = "url('" + image + "')";
    this.imgURL = image;
  },

  doDialog: function () {
    'use strict';
    this.async(function () {
      this.app.dataLoading = false;
      this.app.tracker.sendAppView('Album Details');
      if (this.app.colorThiefEnabled && this.playlist[0].palette) {
        this.app.colorThiefAlbum = this.playlist[0].palette[0];
        this.app.colorThiefAlbumOff = this.playlist[0].palette[1];
      }
      this.$.detailsDialog.open();
      this.app.$.fab.state = 'mid';
      this.app.$.fab.ident = this.id;
    });
  },

  closeDialog: function () {
    'use strict';
    this.app.tracker.sendAppView('Album Wall');
    this.$.detailsDialog.close();
    this.app.$.fab.state = 'off';
  },

  add2Playlist: function () {
    'use strict';
    this.app.playlist = this.app.playlist.concat(this.playlist);
    this.app.dataLoading = false;
    if (this.app.$.player.$.audio.paused) {
      this.app.playing = 0;
      this.app.$.player.getImageForPlayer(this.imgURL, function () {
        this.app.setFabColor(this.playlist[0]);
      }.bind(this));
    }
    this.app.doToast(chrome.i18n.getMessage("added2Queue"));
  },

  doAlbumDownload: function (event, detail, sender) {
    'use strict';
    var manager = new DownloadManager(),
      animation = new CoreAnimation();
    animation.duration = 1000;
    animation.iterations = 'Infinity';
    animation.keyframes = [
      {opacity: 1},
      {opacity: 0}
    ];
    animation.target = sender;
    animation.play();
    this.doQuery(function () {
      this.app.$.downloads.appendChild(manager);
      this.app.isDownloading = true;
      animation.cancel();
      manager.downloadAlbum({
        id: this.albumID,
        artist: this.artist,
        album: this.album,
        size: this.albumSize
      }, function () {
        console.log('Download Finished: ' + this.artist + ' - ' + this.album);
      }.bind(this));
    }.bind(this));
  },

  doTrackDownload: function (event, detail, sender) {
    'use strict';
    var manager = new DownloadManager(),
      animation = new CoreAnimation();
    animation.duration = 1000;
    animation.iterations = 'Infinity';
    animation.keyframes = [
      {opacity: 1},
      {opacity: 0}
    ];
    animation.target = sender;
    animation.play();
    this.doQuery(function () {
      this.app.$.downloads.appendChild(manager);
      this.app.isDownloading = true;
      animation.cancel();
      manager.downloadTrack(sender.attributes.ident.value, function () {
        console.log('Track Download Finished');
      }.bind(this));
    }.bind(this));
  },

  playTrack: function (event, detail, sender) {
    'use strict';
    console.log(event);
    this.$.detailsDialog.close();
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
    'use strict';
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
    if (this.app.$.player.$.audio.paused) {
      this.app.setFabColor(this.app.playlist[0]);
      if (this.app.playing === 0) {
        this.app.$.player.playAudio(this.playlist[0]);
      } else {
        this.app.playing = 0;
      }
    }
    this.app.doToast(chrome.i18n.getMessage("added2Queue"));
  },
  
  chooseOption: function () {
    'use strict';
    if (this.bookmarkIndex !== undefined) {
      this.app.dataLoading = false;
      this.bookmarkTime = this.app.secondsToMins(this.playlist[this.bookmarkIndex].bookmarkPosition / 1000);
      this.$.albumPlaybackConfirm.open();
      if (this.$.detailsDialog.opened) {
        this.$.detailsDialog.close();
      }
    } else {
      this.playAlbum();
    }
  },
  
  playFromBookmark: function () {
    'use strict';
    this.shortPlaylist = this.playlist.splice(this.bookmarkIndex);
    this.app.dataLoading = false;
    this.$.detailsDialog.close();
    this.app.$.player.getImageForPlayer(this.imgURL, function () {
      this.app.playlist = this.shortPlaylist;
      this.app.setFabColor(this.app.playlist[0]);
      if (this.app.playing === 0) {
        this.app.$.player.playAudio(this.app.playlist[0]);
      } else {
        this.app.playing = 0;
      }
    }.bind(this));
  },

  playAlbum: function () {
    'use strict';
    var pLength = this.playlist.length;
    for (var i = 0; i < pLength; i++) {
      if (this.playlist[i].bookmarkPosition) {
        delete this.playlist[i].bookmarkPosition;
      }
    }
    this.app.dataLoading = false;
    this.$.detailsDialog.close();
    this.app.$.player.getImageForPlayer(this.imgURL, function () {
      this.app.playlist = this.playlist;
      this.app.setFabColor(this.playlist[0]);
      if (this.app.playing === 0) {
        this.app.$.player.playAudio(this.playlist[0]);
      } else {
        this.app.playing = 0;
      }
    }.bind(this));
  },

  addFavorite: function (event, detail, sender) {
    'use strict';
    var animation = new CoreAnimation();
    animation.duration = 1000;
    animation.iterations = 'Infinity';
    animation.keyframes = [
      {opacity: 1},
      {opacity: 0}
    ];
    animation.target = sender;
    animation.play();
    this.app.doXhr(
      this.app.buildUrl('star', {
        albumId: sender.attributes.ident.value
      }), 'json', function (e) {
      if (e.target.response['subsonic-response'].status === 'ok') {
        this.isFavorite = true;
        animation.cancel();
      }
    }.bind(this));
  },

  removeFavorite: function (event, detail, sender) {
    'use strict';
    var animation = new CoreAnimation(),
      url;
    animation.duration = 1000;
    animation.iterations = 'Infinity';
    animation.keyframes = [
      {opacity: 1},
      {opacity: 0}
    ];
    animation.target = sender;
    animation.play();
    this.app.doXhr(
      this.app.buildUrl('unstar', {
        albumId: sender.attributes.ident.value
      }), 'json', function (e) {
      if (e.target.response['subsonic-response'].status === 'ok') {
        this.isFavorite = false;
        animation.cancel();
      }
    }.bind(this));
  },

  getPalette: function (callback) {
    'use strict';
    this.app.getDbItem("al-" + this.item + '-palette', function (e) {
      this.palette = e.target.result;
      this.async(callback);
    }.bind(this));
  },

  doPlayback: function () {
    'use strict';
    this.app.dataLoading = true;
    this.getPalette(function () {
      this.doQuery(this.chooseOption.bind(this));
    }.bind(this));
  },

  doDetails: function () {
    'use strict';
    this.app.dataLoading = true;
    this.getPalette(function () {
      this.doQuery(this.doDialog.bind(this));
    }.bind(this));
  },

  doAdd2Playlist: function () {
    'use strict';
    this.app.dataLoading = true;
    this.getPalette(function () {
      this.doQuery(this.add2Playlist.bind(this));
    }.bind(this));
  },

  processJSON: function (callback) {
    'use strict';
    this.playlist.length = 0;
    this.albumID = this.trackResponse['subsonic-response'].album.song[0].parent;
    var tracks = this.trackResponse['subsonic-response'].album.song;
    /* sort tracks by diskNumber thanks Joe Shelby */
    tracks.sort(function doSort(a, b) {
      var da = a.discNumber || 0, db = b.discNumber || 0,
        ta = a.track || 0, tb = b.track || 0;
      if (da === db) {
        // TODO - if ta === tb (no real id3 info?) consider sorting by path using localeCompare or just the < > compare operators?
        return ta - tb;
      } else {
        return da - db;
      }
    });
    var length = tracks.length;
    for (var i = 0; i < length; i++) {
      this.albumSize = this.albumSize + tracks[i].size;
      this.playlist.push({
        id: tracks[i].id,
        artist: tracks[i].artist,
        title: tracks[i].title,
        duration: this.app.secondsToMins(tracks[i].duration),
        cover: this.imgURL,
        bookmarkPosition: tracks[i].bookmarkPosition,
        palette: this.palette,
        disk: tracks[i].diskNumber,
        track: tracks[i].track
      });
      if (tracks[i].bookmarkPosition && this.bookmarkIndex === undefined) {
        this.bookmarkIndex = i;
      }
      if (i === length - 1) {
        this.async(callback);
      }
    }
  },

  doQuery: function (callback) {
    'use strict';
    this.async(function () {
      this.app.doXhr(this.app.buildUrl('getAlbum', {id: this.item}), 'json', function (e) {
        this.trackResponse = e.target.response;
        this.processJSON(callback);
      }.bind(this));
    });
  },

  itemChanged: function () {
    'use strict';
    this.async(function itemUpdate() {
      this.bookmarkIndex = undefined;
      this.showArt(this.defaultImgURL);
      if (this.item && !this.app.scrolling) {
        var artId = "al-" + this.item;
        this.playlist = [];
        this.isLoading = true;
        this.async(function () {
          this.app.getDbItem(artId, function getIt(e) {
            if (e.target.result) {
              this.setImage(e);
              artId = null;
            } else {
              this.app.getImageFile(
                this.app.buildUrl('getCoverArt', {
                  size: 550,
                  id: artId
                }), artId, function (event) {
                this.setImage(event, function setIt(imgURL) {
                  this.app.colorThiefHandler(imgURL, artId);
                  artId = null;
                }.bind(this));
              }.bind(this));
            }
          }.bind(this));
        });
      } else {
        this.async(this.itemChanged, null, 50);
      }
    });
  },

  setRating: function (event, detail, sender) {
    'use strict';
    var rating = parseInt(sender.attributes.star.value, 10);
    var animation = new CoreAnimation();
    animation.duration = 1000;
    animation.iterations = 'Infinity';
    animation.keyframes = [
      {opacity: 1},
      {opacity: 0}
    ];
    animation.target = sender;
    animation.play();
    this.app.doXhr(this.app.buildUrl('setRating', {
      id: this.item,
      rating: rating
    }), 'json', function (e) {
      var json = e.target.response['subsonic-response'];
      animation.cancel();
      if (json.status === 'ok') {
        this.rating = rating;
      }
    }.bind(this));
  },

  moreLikeCallback: function () {
    if (this.app.$.player.$.audio.paused) {
      this.app.$.player.getImageForPlayer(this.app.playlist[0].cover, function () {
        this.app.playing = 0;
        this.app.setFabColor(this.app.playlist[0]);
        this.app.$.player.playAudio(this.app.playlist[0]);
        this.app.dataLoading = false;
      }.bind(this));
    }
  },

  moreLike: function (event, detail, sender) {
    'use strict';
    var id = sender.attributes.ident.value;
    this.$.detailsDialog.close();
    this.app.$.fab.state = 'off';
    this.app.dataLoading = true;
    this.app.doXhr(
      this.app.buildUrl('getSimilarSongs', {
        count: 50,
        id: id
      }), 'json', function (e) {
      var response = e.target.response['subsonic-response'].similarSongs.song;
      if (response) {
        this.app.$.player.$.audio.pause();
        this.app.playlist.length = 0;
        var length = response.length;
        for (var i = 0; i < length; i++) {
          var obj = {
              id: response[i].id,
              artist: response[i].artist,
              title: response[i].title,
              duration: this.app.secondsToMins(response[i].duration)
            },
            artId = 'al-' + response[i].albumId;
          this.app.getDbItem(artId, function (artEvent) {
            if (artEvent.target.result) {
              obj.cover = window.URL.createObjectURL(artEvent.target.result);
              this.app.getDbItem(artId + '-palette', function (paletteEvent) {
                obj.palette = paletteEvent.target.result;
                this.app.playlist.push(obj);
                this.moreLikeCallback();
              }.bind(this));
            } else {
              this.app.getImageFile(
                this.app.buildUrl('getCoverArt', {
                  size: 550,
                  id: artId
                }), artId, function (xhrEvent) {
                obj.cover = window.URL.createObjectURL(xhrEvent.target.result);
                this.app.colorThiefHandler(imgURL, artId, function (colorArray) {
                  obj.palette = colorArray;
                  this.app.playlist.push(obj);
                  this.moreLikeCallback();
                }.bind(this));
              }.bind(this));
            }
          }.bind(this));
        }
      } else {
        this.app.dataLoading = false;
        this.app.doToast(chrome.i18n.getMessage("noResults"));
      }
    }.bind(this));
  },

  conBookDel: function (event, detail, sender) {
    this.delID = sender.attributes.ident.value;
    this.$.bookmarkConfirm.open();
  },

  deleteBookmark: function (event) {
    this.app.doXhr(
      this.app.buildUrl('deleteBookmark', {
        id: this.delID
      }), 'json', function (e) {
      if (e.target.response['subsonic-response'].status === 'ok') {
        this.doQuery(function () {});
      } else {
        this.app.doToast(e.target.response['subsonic-response'].error.message);
      }
    }.bind(this));
  },

  playChoice: function (event, detail, sender) {
    this.$.playbackConfirm.open();
    this.bookMark = {
      id: sender.attributes.ident.value,
      artist: sender.attributes.artist.value,
      title: sender.attributes.trackTitle.value,
      duration: sender.attributes.duration.value,
      bookmarkPosition: sender.attributes.bookmark.value,
      cover: sender.attributes.cover.value
    };
    this.bookmarkTime = this.app.secondsToMins(sender.attributes.bookmark.value / 1000);
  }
});


