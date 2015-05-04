/*global Polymer, console, chrome, document, Blob, window, Image, CoreAnimation */
Polymer('album-art', {
  moreLikeThis: chrome.i18n.getMessage("moreLikeThis"),
  backButton: chrome.i18n.getMessage("backButton"),
  playTrackLabel: chrome.i18n.getMessage("playTrack"),
  moreOptionsLabel: chrome.i18n.getMessage("moreOptionsLabel"),
  closeLabel: chrome.i18n.getMessage("closeLabel"),
  /*
    method ran when element is created in dom
  */
  created: function () {
    'use strict';
    this.imgURL = '../../../images/default-cover-art.png';
  },

  /*
    element is ready
  */
  ready: function () {
    'use strict';
    this.page = this.page || "cover";

    this.artist = this.artist || "Artist Name";

    this.album = this.album || "Album Title";

    this.defaultImgURL = 'images/default-cover-art.png';
    
    this.app = document.getElementById("tmpl");
    
    this.audio = document.getElementById("audio");

    this.playerArt = document.getElementById("coverArt");

    this.app.colorThiefAlbum = this.app.colorThiefAlbum  || '#db4437';

    this.app.colorThiefAlbumOff = this.app.colorThiefAlbumOff  || 'white';
    
    this.add2PlayQueue = chrome.i18n.getMessage("add2PlayQueue");
    
    this.favoriteAlbum = chrome.i18n.getMessage("favoriteAlbum");
    
    this.downloadButton = chrome.i18n.getMessage("downloadButton");
    
    this.albumTracklist = chrome.i18n.getMessage("albumTracklist");
  },

  /*
    changes size and content of element
  */
  listModeChanged: function () {
    'use strict';
    this.async(function () {
      if (this.listMode === 'list') {
        this.page = "small";
        this.width = '520px';
        this.height = "75px";
        this.style.margin = '0px';
      } else {
        this.page = "cover";
        this.width = "250px";
        this.height = "250px";
        this.style.margin = '2px';
      }
    });
  },

  /* error handler for indexeddb calls */
  dbErrorHandler: function (e) {
    'use strict';
    this.app.doToast(e);
    console.log(e);
  },

  /* setup image  */
  setImage: function (event, callback) {
    'use strict';
    var imgFile = event.target.result,
      imgURL = window.URL.createObjectURL(imgFile),
      imgElement,
      i = 0;

    this.showArt(imgURL);
    this.isLoading = false;
    this.imgURL = imgURL;
    if (callback) {
      callback(imgURL);
    }
  },
  
  showArt: function (image) {
    'use strict';
    if (this.page === 'cover') {
      this.async(function () {
        this.$.card.style.backgroundImage = "url('" + image + "')";
      });
    } else if (this.page === 'small') {
      this.async(function () {
        this.$.smallCover.style.backgroundImage = "url('" + image + "')";
        this.$.card.style.backgroundImage = '';
      });
    }
    this.$.topper.style.backgroundImage = "url('" + image + "')";
    this.imgURL = image;
  },

  defaultArt: function () {
    'use strict';
    this.showArt(this.defaultImgURL);
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
    if (this.page === 'info') {
      this.page = "cover";
    }
  },

  doDialog: function () {
    'use strict';
    this.async(function () {
      this.app.tracker.sendAppView('Album Details');
      this.app.dataLoading = false;
      this.closeSlide();
      this.$.detailsDialog.open();
      this.app.$.fab.state = 'mid';
      this.app.$.fab.ident = this.id;
      if (this.colorThiefEnabled && this.playlist[0].palette) {
        this.app.colorThiefAlbum = this.playlist[0].palette[0];
        this.app.colorThiefAlbumOff = this.playlist[0].palette[1];
      }
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
    var art = this.app.$.coverArt;
    art.style.backgroundImage =  "url('images/default-cover-art.png')";
  },

  add2Playlist: function () {
    'use strict';
    this.app.dataLoading = false;
    var url = this.url + '/rest/stream.view?u=' + this.user + '&p=' + this.pass + '&v=' + this.version + '&c=PolySonic&maxBitRate=' + this.bitRate + '&id=' + this.playlist[0].id;
    if (this.audio.paused) {
      this.app.playing = 0;
      this.app.playAudio(this.playlist[0].artist, this.playlist[0].title, url, this.imgURL, this.playlist[0].id);
      this.app.getImageForPlayer(this.imgURL, function () {
        this.app.setFabColor(this.playlist[0]);
      }.bind(this));
    }
    Array.prototype.forEach.call(this.playlist, function (e) {
      this.app.playlist.push(e);
    }.bind(this));
    this.app.doToast(chrome.i18n.getMessage("added2Queue"));
  },

  doDownload: function (event, detail, sender) {
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
    this.doQuery(function () {
      animation.cancel();
      window.open(this.url + "/rest/download.view?u=" + this.user + "&p=" + this.pass + "&f=json&v=" + this.version + "&c=PolySonic&id=" + this.albumID, '_blank');
    }.bind(this));
  },

  playTrack: function (event, detail, sender) {
    'use strict';
    this.app.setFabColor(this.playlist[0]);
    var url = this.url + '/rest/stream.view?u=' + this.user + '&p=' + this.pass + '&v=' + this.version + '&c=PolySonic&maxBitRate=' + this.bitRate + '&id=' + sender.attributes.ident.value;
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
    this.app.playAudio(sender.attributes.artist.value, sender.attributes.trackTitle.value, url, this.imgURL, sender.attributes.ident.value);
    this.app.page = 1;
  },

  addSingle2Playlist: function (event, detail, sender) {
    'use strict';
    var url = this.url + '/rest/stream.view?u=' + this.user + '&p=' + this.pass + '&v=' + this.version + '&c=PolySonic&maxBitRate=' + this.bitRate + '&id=' + sender.attributes.ident.value,
      obj = {id: sender.attributes.ident.value, artist: sender.attributes.artist.value, title: sender.attributes.trackTitle.value,  duration: sender.attributes.duration.value, cover: this.imgURL};
    this.app.playlist.push(obj);
    if (this.audio.paused) {
      this.app.setFabColor(this.playlist[0]);
      this.app.playAudio(sender.attributes.artist.value, sender.attributes.trackTitle.value, url, this.imgURL, sender.attributes.ident.value);
      this.app.playing = 0;
      if (this.imgURL) {
        this.playerArt.style.backgroundImage = "url('" + this.imgURL + "')";
      } else {
        this.playerArt.style.backgroundImage =  "url('images/default-cover-art.png')";
      }
    }
    this.app.doToast(chrome.i18n.getMessage("added2Queue"));
  },


  playAlbum: function () {
    'use strict';
    this.app.dataLoading = false;
    this.$.detailsDialog.close();
    this.app.setFabColor(this.playlist[0]);
    var url = this.url + '/rest/stream.view?u=' + this.user + '&p=' + this.pass + '&v=' + this.version + '&c=PolySonic&maxBitRate=' + this.bitRate + '&id=' + this.playlist[0].id;
    this.app.page = 1;
    this.app.getImageForPlayer(this.imgURL, function () {
      this.app.playlist = this.playlist;
      this.app.playing = 0;
      this.app.playAudio(this.playlist[0].artist, this.playlist[0].title, url, this.imgURL, this.playlist[0].id);
    }.bind(this));
  },

  addFavorite: function (event, detail, sender) {
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
    url = this.url + "/rest/star.view?u=" + this.user + "&p=" + this.pass + "&f=json&v=" + this.version + "&c=PolySonic&albumId=" + sender.attributes.ident.value;
    this.app.doXhr(url, 'json', function (e) {
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
    url = this.url + "/rest/unstar.view?u=" + this.user + "&p=" + this.pass + "&f=json&v=" + this.version + "&c=PolySonic&albumId=" + sender.attributes.ident.value;
    this.app.doXhr(url, 'json', function (e) {
      if (e.target.response['subsonic-response'].status === 'ok') {
        this.isFavorite = false;
        animation.cancel();
      }
    }.bind(this));
  },

  paletteChanged: function () {
    'use strict';
    if (this.palette !== undefined) {
      Array.prototype.forEach.call(this.playlist, function (element) {
        element.palette = this.palette;
      }.bind(this));
    }
  },
  
  getPalette: function (callback) {
    'use strict';
    var artId = "al-" + this.item;
    this.app.getDbItem(artId + '-palette', function (e) {
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
    var i = 0;
    this.playlist.length = 0;
    this.albumID = this.trackResponse['subsonic-response'].album.song[0].parent;
    this.tracks = this.trackResponse['subsonic-response'].album.song;

    /* sort tracks by diskNumber thanks Joe Shelby */
    this.tracks.sort(function (a, b) {
      var da = a.discNumber || 0, db = b.discNumber || 0,
        ta = a.track || 0, tb = b.track || 0;
      if (da === db) {
        // TODO - if ta === tb (no real id3 info?) consider sorting by path using localeCompare or just the < > compare operators?
        return ta - tb;
      } else {
        return da - db;
      }
    });
    Array.prototype.forEach.call(this.tracks, function (e) {
      var mins = Math.floor(e.duration / 60),
        seconds = Math.floor(e.duration - (mins * 60)),
        timeString = mins + ':' + ('0' + seconds).slice(-2),
        obj = {id: e.id, artist: e.artist, title: e.title, duration: timeString, cover: this.imgURL, palette: this.palette, disk: e.diskNumber, track: e.track};
      this.playlist.push(obj);
      i = i + 1;
      if (i === this.tracks.length) {
        this.async(callback);
      }
    }.bind(this));
  },
  
  doQuery: function (callback) {
    'use strict';
    this.queryingJSON = true;
    /*
      check indexeddb
    */
    this.app.getDbItem(this.item, function (event) {
      if (event.target.result) {
        this.trackResponse = event.target.result;
        this.async(function () {
          this.processJSON(callback);
        });
      } else {
        var url = this.url + "/rest/getAlbum.view?u=" + this.user + "&p=" + this.pass + "&f=json&v=" + this.version + "&c=PolySonic&id=" + this.item;
        /*
          get the data from subsonic server
        */
        this.app.doXhr(url, 'json', function (e) {
          this.trackResponse = e.target.response;
          /*
            place json in indexeddb
          */
          this.app.putInDb(this.trackResponse, this.item, function () {
            this.async(function () {
              this.processJSON(callback);
            });
            console.log('JSON Data Added to indexedDB ' + this.item);
          }.bind(this));
        }.bind(this));
      }
    }.bind(this));
  },

  itemChanged: function () {
    'use strict';
    this.async(function () {
      var artId = "al-" + this.item,
        url = this.url + "/rest/getCoverArt.view?u=" + this.user + "&p=" + this.pass + "&v=" + this.version + "&c=PolySonic&size=550&id=" + artId;
      if (this.item) {
        this.isLoading = true;
        this.defaultArt();
        this.playlist = null;
        this.playlist = [];
        this.app.getDbItem(artId, function (e) {
          if (e.target.result) {
            this.setImage(e);
          } else {
            /*
              get image from subsonic server
            */
            this.app.getImageFile(url, artId, function (event) {
              this.setImage(event, function (imgURL) {
                this.app.colorThiefHandler(imgURL, artId);
              }.bind(this));
            }.bind(this));
          }
        }.bind(this));
      }
    });
  },

  /*
    OMG its a nested nightmare!!!!!!!!!!
    will get list of similar tracks from server then parse results match with artwork & color palette before pushing it to the this.playlist array and playing 1st result
  */
  moreLike: function (event, detail, sender) {
    'use strict';
    var id = sender.attributes.ident.value,
      url = this.url + "/rest/getSimilarSongs.view?u=" + this.user + "&p=" + this.pass + "&v=" + this.version + "&f=json&c=PolySonic&count=50&id=" + id,
      i = 0,
      array = [],
      /* to be run @ end of loop */
      callback = function () {
        this.app.getImageForPlayer(this.app.playlist[0].cover, function () {
          this.app.setFabColor(this.playlist[0]);
          var playURL = this.url + '/rest/stream.view?u=' + this.user + '&p=' + this.pass + '&v=' + this.version + '&c=PolySonic&maxBitRate=' + this.bitRate + '&id=' + this.app.playlist[0].id;
          this.app.playing = 0;
          this.app.playAudio(this.app.playlist[0].artist, this.app.playlist[0].title, playURL, this.app.playlist[0].cover, this.app.playlist[0].id);
          this.app.dataLoading = false;
          this.app.page = 1;
        }.bind(this));
      }.bind(this);
    this.$.detailsDialog.close();
    this.app.$.fab.state = 'off';
    this.app.dataLoading = true;
    /* get data */
    this.app.doXhr(url, 'json', function (e) {
      var response = e.target.response['subsonic-response'].similarSongs.song;
      if (response) {
        this.app.$.audio.pause();
        this.app.playlist = null;
        this.app.playlist = [];
        Array.prototype.forEach.call(response, function (element) {
          var mins = Math.floor(element.duration / 60),
            seconds = Math.floor(element.duration - (mins * 60)),
            timeString = mins + ':' + ('0' + seconds).slice(-2),
            obj = {id: element.id, artist: element.artist, title: element.title, duration: timeString},
            artId = 'al-' + element.albumId,
            url2 = this.url + "/rest/getCoverArt.view?u=" + this.user + "&p=" + this.pass + "&v=" + this.version + "&c=PolySonic&size=550&id=" + artId;
          /* check indexeddb */
          this.app.getDbItem(artId, function (ev) {
            if (ev.target.result) {
              var imgFile = ev.target.result,
                imgURL = window.URL.createObjectURL(imgFile);
              // got the image as imgURL
              obj.cover = imgURL;
              /* get palette if in db */
              this.app.getDbItem(artId + '-palette', function (e) {
                obj.palette = e.target.result;
                this.app.playlist.push(obj);
                i = i + 1;
                if (i === response.length) {
                  callback();
                }
              }.bind(this));
            } else {
              /*
                get image from subsonic server
              */
              this.app.getImageFile(url2, artId, function (event) {
                var imgFile = event.target.result,
                  imgURL = window.URL.createObjectURL(imgFile);


                obj.cover = imgURL;

                /*
                  get dominant color from image
                */
                this.app.colorThiefHandler(imgURL, artId, function (colorArray) {
                  obj.palette = colorArray;
                  this.app.playlist.push(obj);
                  i = i + 1;
                  if (i === response.length) {
                    callback();
                  }
                }.bind(this));
              }.bind(this));
            }
          }.bind(this));
        }.bind(this));
      } else {
        this.app.dataLoading = false;
        this.app.doToast(chrome.i18n.getMessage("noResults"));
      }
    }.bind(this));
  }
});


