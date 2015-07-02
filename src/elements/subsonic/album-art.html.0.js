/*global Polymer, console, chrome, document, Blob, window, Image, CoreAnimation */
Polymer('album-art', {
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
  width: "250px",
  height: "250px",
  albumSize: 0,
  /*
    element is ready
  */
  ready: function () {
    'use strict';
    this.page = this.page || "cover";

    this.artist = this.artist || "Artist Name";

    this.album = this.album || "Album Title";
    
    this.app = document.getElementById("tmpl");
    
    this.audio = document.getElementById("audio");

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
    }
  },
  
  mouseIn: function (event, detail, sender) {
    sender.setZ(2);
  },
  
  mouseOut: function (event, detail, sender) {
    sender.setZ(1);
  },
  
  showArt: function (image) {
    'use strict';
    this.$.card.style.backgroundImage = "url('" + image + "')";
    this.$.topper.style.backgroundImage = "url('" + image + "')";
    this.imgURL = image;
  },

  /*
    slide up the box to cover art and show hidden details
  */
  slideUp: function () {
    'use strict';
    this.page = "info";
  },

  /*
    slide box to normal position
  */
  closeSlide: function () {
    'use strict';
    this.page = "cover";
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
      this.closeSlide();
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

  defaultPlayerImage: function () {
    'use strict';
    this.app.$.coverArt.style.backgroundImage =  "url('../../images/default-cover-art.png')";
  },

  add2Playlist: function () {
    'use strict';
    this.app.dataLoading = false;
    if (this.audio.paused) {
      this.app.playing = 0;
      this.app.playAudio(
        this.playlist[0].artist, 
        this.playlist[0].title, 
        this.app.buildUrl('stream', {maxBitRate: this.app.bitRate, id: this.playlist[0].id}), 
        this.imgURL, 
        this.playlist[0].id
      );
      this.app.getImageForPlayer(this.imgURL, function () {
        this.app.setFabColor(this.playlist[0]);
      }.bind(this));
    }
    var length = this.playlist.length;
    for (var i = 0; i < length; i++) {
      this.app.playlist.push(this.playlist[i]);
    }
    this.app.doToast(chrome.i18n.getMessage("added2Queue"));
  },

  doAlbumDownload: function (event, detail, sender) {
    'use strict';
    var manager = new DownloadManager(),
      animation = new CoreAnimation(),
      url;
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
        id:this.albumID,
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
      animation = new CoreAnimation(),
      url;
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
    this.app.setFabColor(this.playlist[0]);
    this.$.detailsDialog.close();
    this.playerArt.style.backgroundImage = "url('" + this.imgURL + "')";
    this.app.playlist = [
      {
        artist: sender.attributes.artist.value,
        title: sender.attributes.trackTitle.value,
        cover: this.imgURL,
        duration: sender.attributes.duration.value,
        id: sender.attributes.ident.value
      }
    ];
    this.app.playing = 0;
    this.app.playAudio(
      sender.attributes.artist.value, 
      sender.attributes.trackTitle.value, 
      this.app.buildUrl('stream', {maxBitRate: this.app.bitRate, id: sender.attributes.ident.value}), 
      this.imgURL, 
      sender.attributes.ident.value
    );
    //this.app.page = 1;
  },

  addSingle2Playlist: function (event, detail, sender) {
    'use strict';
    var obj = {
        id: sender.attributes.ident.value, 
        artist: sender.attributes.artist.value, 
        title: sender.attributes.trackTitle.value,  
        duration: sender.attributes.duration.value, 
        cover: this.imgURL
      };
    this.app.playlist.push(obj);
    if (this.audio.paused) {
      this.app.setFabColor(this.playlist[0]);
      this.app.playAudio(
        sender.attributes.artist.value, 
        sender.attributes.trackTitle.value, 
        this.app.buildUrl('stream', {maxBitRate: this.app.bitRate, id: sender.attributes.ident.value}), 
        this.imgURL, 
        sender.attributes.ident.value
      );
      this.app.playing = 0;
      if (this.imgURL) {
        this.playerArt.style.backgroundImage = "url('" + this.imgURL + "')";
      } else {
        this.playerArt.style.backgroundImage =  "url('../../images/default-cover-art.png')";
      }
    }
    this.app.doToast(chrome.i18n.getMessage("added2Queue"));
  },


  playAlbum: function () {
    'use strict';
    this.app.dataLoading = false;
    this.$.detailsDialog.close();
    this.app.setFabColor(this.playlist[0]);
    //this.app.page = 1;
    this.app.getImageForPlayer(this.imgURL, function () {
      this.app.playlist = this.playlist;
      this.app.playing = 0;
      this.app.playAudio(
        this.playlist[0].artist, 
        this.playlist[0].title, 
        this.app.buildUrl('stream', {maxBitRate: this.app.bitRate, id: this.playlist[0].id}), 
        this.imgURL, 
        this.playlist[0].id
      );
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
    this.app.doXhr(this.app.buildUrl('star', {albumId: sender.attributes.ident.value}), 'json', function (e) {
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
    this.app.doXhr(this.app.buildUrl('unstar', {albumId: sender.attributes.ident.value}), 'json', function (e) {
      if (e.target.response['subsonic-response'].status === 'ok') {
        this.isFavorite = false;
        animation.cancel();
      }
    }.bind(this));
  },

  paletteChanged: function () {
    'use strict';
    if (this.palette) {
      var length = this.playlist.length;
      for (var i = 0; i < length; i++) {
        this.playlist[i].palette = this.palette;
      }
    }
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
      this.doQuery(this.playAlbum.bind(this));
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
    tracks.sort(function (a, b) {
      var da = a.discNumber || 0, db = b.discNumber || 0,
        ta = a.track || 0, tb = b.track || 0;
      if (da === db) {
        // TODO - if ta === tb (no real id3 info?) consider sorting by path using localeCompare or just the < > compare operators?
        return ta - tb;
      } else {
        return da - db;
      }
    });
    this.async(function () {
      var length = tracks.length;
      for (var i = 0; i < length; i++) {
        var mins = Math.floor(tracks[i].duration / 60),
          seconds = Math.floor(tracks[i].duration - (mins * 60)),
          timeString = mins + ':' + ('0' + seconds).slice(-2),
          obj = {
            id: tracks[i].id, 
            artist: tracks[i].artist, 
            title: tracks[i].title, 
            duration: timeString, 
            cover: this.imgURL, 
            palette: this.palette, 
            disk: tracks[i].diskNumber, 
            track: tracks[i].track
          };
        this.albumSize = this.albumSize + tracks[i].size;
        this.playlist.push(obj);
        if (i === length - 1) {
          this.async(callback);
        }
      }
    });
  },
  
  doQuery: function (callback) {
    'use strict';
    this.async(function () {
      this.app.getDbItem(this.item, function (event) {
        if (event.target.result) {
          this.trackResponse = event.target.result;
          this.processJSON(callback);
        } else {
          this.app.doXhr(this.app.buildUrl('getAlbum', {id: this.item}), 'json', function (e) {
            this.trackResponse = e.target.response;
            this.processJSON(callback);
            this.app.putInDb(this.trackResponse, this.item, function () {
              console.log('JSON Data Added to indexedDB ' + this.item);
            }.bind(this));
          }.bind(this));
        }
      }.bind(this));
    });
  },

  itemChanged: function () {
    'use strict';
    this.async(function () {
      if (this.item) {
        var artId = "al-" + this.item;
        this.showArt(this.defaultImgURL);
        this.playlist = [];
        this.isLoading = true;
        this.async(function () {
          this.app.getDbItem(artId, function (e) {
            if (e.target.result) {
              this.setImage(e);
            } else {
              this.app.getImageFile(this.app.buildUrl('getCoverArt', {size: 550, id: artId}), artId, function (event) {
                this.setImage(event, function (imgURL) {
                  this.app.colorThiefHandler(imgURL, artId);
                }.bind(this));
              }.bind(this));
            }
          }.bind(this));
        });
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
    this.app.doXhr(this.app.buildUrl('setRating', {id: this.item, rating: rating}), 'json', function (e) {
      var json = e.target.response['subsonic-response'];
      animation.cancel();
      if (json.status === 'ok') {
        this.rating = rating;
      }
    }.bind(this));
  },

  moreLikeCallback: function () {
    if (this.app.$.audio.paused) {
      this.app.getImageForPlayer(this.app.playlist[0].cover, function () {
        this.app.playing = 0;
        this.app.setFabColor(this.app.playlist[0]);
        this.app.playAudio(this.app.playlist[0].artist, this.app.playlist[0].title, this.app.buildUrl('stream', {maxBitRate: this.app.bitRate, id: this.app.playlist[0].id}), this.app.playlist[0].cover, this.app.playlist[0].id);
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
    this.app.doXhr(this.app.buildUrl('getSimilarSongs', {count: 50, id: id}), 'json', function (e) {
      var response = e.target.response['subsonic-response'].similarSongs.song;
      if (response) {
        this.app.$.audio.pause();
        this.app.playlist.length = 0;
        var length = response.length;
        for (var i = 0; i < length; i++) {
          var mins = Math.floor(response[i].duration / 60),
            obj = {
              id: response[i].id, 
              artist: response[i].artist, 
              title: response[i].title, 
              duration: mins + ':' + ('0' + Math.floor(response[i].duration - (mins * 60))).slice(-2)
            }, artId = 'al-' + response[i].albumId;
          this.app.getDbItem(artId, function (artEvent) {
            if (artEvent.target.result) {
              obj.cover = window.URL.createObjectURL(artEvent.target.result);
              this.app.getDbItem(artId + '-palette', function (paletteEvent) {
                obj.palette = paletteEvent.target.result;
                this.app.playlist.push(obj);
                this.moreLikeCallback();
              }.bind(this));
            } else {
              this.app.getImageFile(this.app.buildUrl('getCoverArt', {size: 550, id: artId}), artId, function (xhrEvent) {
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
  }
});


