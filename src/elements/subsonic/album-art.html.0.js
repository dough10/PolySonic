/*global Polymer, console, chrome, document, Blob, window, Image, CoreAnimation */
Polymer('album-art', {
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
    
    this.tmpl = document.getElementById("tmpl");
    
    this.audio = document.getElementById("audio");

    this.playerArt = document.getElementById("coverArt");

    this.tmpl.colorThiefAlbum = this.tmpl.colorThiefAlbum  || '#db4437';

    this.tmpl.colorThiefAlbumOff = this.tmpl.colorThiefAlbumOff  || 'white';
    
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
    if (this.listMode === 'list') {
      this.page = "small";
      this.width = '520px';
      this.height = "75px";
    } else if (this.listMode === 'search') {
      this.page = 'search';
      this.width = '370px';
      this.height = '60px';
    } else {
      this.page = "cover";
      this.width = "250px";
      this.height = "250px";
    }
  },

  /* error handler for indexeddb calls */
  dbErrorHandler: function (e) {
    'use strict';
    this.tmpl.doToast(e);
    console.log(e);
  },

  /* setup image  */
  setImage: function (event) {
    'use strict';
    var imgFile = event.target.result,
      imgURL = window.URL.createObjectURL(imgFile),
      imgElement,
      i = 0;

    this.async(function () {
      this.showArt(imgURL);
    });
    this.imgURL = imgURL;
    Array.prototype.forEach.call(this.playlist, function (e) {
      e.cover = imgURL;
    }.bind(this));
    this.async(function () {
      this.isLoading = false;
    });
  },
  
  showArt: function (image) {
    'use strict';
    if (this.page === 'cover') {
      this.$.card.style.backgroundImage = "url('" + image + "')";
    } else if (this.page === 'small') {
      this.$.smallCover.style.backgroundImage = "url('" + image + "')";
      this.$.card.style.backgroundImage = null;
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
    this.tmpl.dataLoading = false;
    this.closeSlide();
    this.$.detailsDialog.open();
    this.tmpl.$.fab.state = 'mid';
    this.tmpl.$.fab.ident = this.id;
    if (this.colorThiefEnabled && this.playlist[0].palette) {
      this.tmpl.colorThiefAlbum = this.playlist[0].palette[0];
      this.tmpl.colorThiefAlbumOff = this.playlist[0].palette[1];
    }
  },

  closeDialog: function () {
    'use strict';
    this.$.detailsDialog.close();
    this.tmpl.$.fab.state = 'off';
  },

  defaultPlayerImage: function () {
    'use strict';
    var art = this.tmpl.$.coverArt;
    art.style.backgroundImage =  "url('images/default-cover-art.png')";
  },

  add2Playlist: function () {
    'use strict';
    this.tmpl.dataLoading = false;
    var url = this.url + '/rest/stream.view?u=' + this.user + '&p=' + this.pass + '&v=' + this.version + '&c=PolySonic&maxBitRate=' + this.bitRate + '&id=' + this.playlist[0].id;
    if (this.audio.paused) {
      this.tmpl.playing = 0;
      this.tmpl.playAudio(this.playlist[0].artist, this.playlist[0].title, url, this.imgURL, this.playlist[0].id);
      this.tmpl.getImageForPlayer(this.imgURL, function () {
        this.tmpl.setFabColor(this.playlist[0]);
      }.bind(this));
    }
    Array.prototype.forEach.call(this.playlist, function (e) {
      this.tmpl.playlist.push(e);
    }.bind(this));
    this.tmpl.doToast(chrome.i18n.getMessage("added2Queue"));
  },

  doDownload: function (event, detail, sender) {
    'use strict';
    this.tmpl.dataLoading = true;
    this.doQuery(function () {
      this.tmpl.dataLoading = false;
      window.open(this.url + "/rest/download.view?u=" + this.user + "&p=" + this.pass + "&f=json&v=" + this.version + "&c=PolySonic&id=" + sender.attributes.ident.value, '_blank');
    }.bind(this));
  },

  playTrack: function (event, detail, sender) {
    'use strict';
    this.tmpl.setFabColor(this.playlist[0]);
    var url = this.url + '/rest/stream.view?u=' + this.user + '&p=' + this.pass + '&v=' + this.version + '&c=PolySonic&maxBitRate=' + this.bitRate + '&id=' + sender.attributes.ident.value;
    this.$.detailsDialog.close();
    this.playerArt.style.backgroundImage = "url('" + this.imgURL + "')";
    this.tmpl.playlist = [{artist: sender.attributes.artist.value, title: sender.attributes.title.value, cover: this.imgURL, duration: sender.attributes.duration.value, id: sender.attributes.ident.value}];
    this.tmpl.playing = 0;
    this.tmpl.playAudio(sender.attributes.artist.value, sender.attributes.title.value, url, this.imgURL, sender.attributes.ident.value);
    this.tmpl.page = 1;
  },

  addSingle2Playlist: function (event, detail, sender) {
    'use strict';
    var url = this.url + '/rest/stream.view?u=' + this.user + '&p=' + this.pass + '&v=' + this.version + '&c=PolySonic&maxBitRate=' + this.bitRate + '&id=' + sender.attributes.ident.value,
      obj = {id: sender.attributes.ident.value, artist: sender.attributes.artist.value, title: sender.attributes.title.value,  duration: sender.attributes.duration.value, cover: this.imgURL};
    this.tmpl.playlist.push(obj);
    if (this.audio.paused) {
      this.tmpl.setFabColor(this.playlist[0]);
      this.tmpl.playAudio(sender.attributes.artist.value, sender.attributes.title.value, url, this.imgURL, sender.attributes.ident.value);
      this.tmpl.playing = 0;
      if (this.imgURL) {
        this.playerArt.style.backgroundImage = "url('" + this.imgURL + "')";
      } else {
        this.playerArt.style.backgroundImage =  "url('images/default-cover-art.png')";
      }
    }
    this.tmpl.doToast(chrome.i18n.getMessage("added2Queue"));
  },

  playAlbum: function () {
    'use strict';
    this.tmpl.dataLoading = false;
    this.$.detailsDialog.close();
    this.tmpl.setFabColor(this.playlist[0]);
    var url = this.url + '/rest/stream.view?u=' + this.user + '&p=' + this.pass + '&v=' + this.version + '&c=PolySonic&maxBitRate=' + this.bitRate + '&id=' + this.playlist[0].id;
    this.tmpl.page = 1;
    this.tmpl.getImageForPlayer(this.imgURL, function () {
      this.tmpl.playlist = this.playlist;
      this.tmpl.playing = 0;
      this.tmpl.playAudio(this.playlist[0].artist, this.playlist[0].title, url, this.imgURL, this.playlist[0].id);
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
    this.tmpl.doXhr(url, 'json', function (e) {
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
    this.tmpl.doXhr(url, 'json', function (e) {
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
  
  doSearchPlayback: function () {
    'use strict';
    this.tmpl.$.searchDialog.close();
    this.tmpl.dataLoading = true;
    this.doQuery(this.playAlbum.bind(this));
  },
  
  doSearchDetails: function () {
    'use strict';
    this.tmpl.$.searchDialog.close();
    this.tmpl.dataLoading = true;
    this.doQuery(function () {
      this.tmpl.dataLoading = false;
      this.$.detailsDialog.open();
      this.tmpl.$.fab.state = 'mid';
      this.tmpl.$.fab.ident = this.id;
      if (this.colorThiefEnabled && this.playlist[0].palette) {
        this.tmpl.colorThiefAlbum = this.playlist[0].palette[0];
        this.tmpl.colorThiefAlbumOff = this.playlist[0].palette[1];
      }
    }.bind(this));
  },
  
  getPalette: function (callback) {
    'use strict';
    var artId = "al-" + this.item;
    this.tmpl.getDbItem(artId + '-palette', function (e) {
      this.palette = e.target.result;
      callback();
    }.bind(this));
  },

  doPlayback: function () {
    'use strict';
    this.tmpl.$.searchDialog.close();
    this.tmpl.dataLoading = true;
    this.getPalette(function () {
      this.doQuery(this.playAlbum.bind(this));
    }.bind(this));
  },
  
  doDetails: function () {
    'use strict';
    this.tmpl.dataLoading = true;
    this.getPalette(function () {
      this.doQuery(this.doDialog.bind(this));
    }.bind(this));
  },
  
  doAdd2Playlist: function () {
    'use strict';
    this.tmpl.dataLoading = true;
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
    this.async(function () {
      Array.prototype.forEach.call(this.tracks, function (e) {
        var mins = Math.floor(e.duration / 60),
          seconds = Math.floor(e.duration - (mins * 60)),
          timeString = mins + ':' + ('0' + seconds).slice(-2),
          obj = {id: e.id, artist: e.artist, title: e.title, duration: timeString, cover: this.imgURL, palette: this.palette, disk: e.diskNumber, track: e.track};
        this.playlist.push(obj);
        i = i + 1;
        if (i === this.tracks.length) {
          callback();
        }
      }.bind(this));
    });
  },
  
  doQuery: function (callback) {
    'use strict';
    this.queryingJSON = true;
    /*
      check indexeddb
    */
    this.tmpl.getDbItem(this.item, function (event) {
      if (event.target.result) {
        this.trackResponse = event.target.result;
        this.processJSON(callback);
      } else {
        var url = this.url + "/rest/getAlbum.view?u=" + this.user + "&p=" + this.pass + "&f=json&v=" + this.version + "&c=PolySonic&id=" + this.item;
        /*
          get the data from subsonic server
        */
        this.tmpl.doXhr(url, 'json', function (e) {
          this.trackResponse = e.target.response;
          /*
            place json in indexeddb
          */
          this.tmpl.putInDb(this.trackResponse, this.item, function () {
            this.processJSON(callback);
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
        this.async(this.defaultArt.bind(this));
        this.playlist = null;
        this.playlist = [];
        this.async(function () {
          this.tmpl.getDbItem(artId, function (e) {
            if (e.target.result) {
              this.setImage(e);
            } else {
              /*
                get image from subsonic server
              */
              this.tmpl.getImageFile(url, artId, function (event) {
                var imgFile = event.target.result,
                  imgURL = window.URL.createObjectURL(imgFile),
                  imgElement;
  
                Array.prototype.forEach.call(this.playlist, function (e) {
                  e.cover = imgURL;
                }.bind(this));
                this.async(function () {
                  this.showArt(imgURL);
                  this.isLoading = false;
                });
                /*
                  get dominant color from image
                */
                this.tmpl.colorThiefHandler(imgURL, artId, function (colorArray) {});
              }.bind(this));
            }
          }.bind(this));
        });
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
        this.tmpl.getImageForPlayer(this.tmpl.playlist[0].cover, function () {
          this.async(function () {
            this.tmpl.setFabColor(this.playlist[0]);
            var playURL = this.url + '/rest/stream.view?u=' + this.user + '&p=' + this.pass + '&v=' + this.version + '&c=PolySonic&maxBitRate=' + this.bitRate + '&id=' + this.tmpl.playlist[0].id;
            this.tmpl.playing = 0;
            this.tmpl.playAudio(this.tmpl.playlist[0].artist, this.tmpl.playlist[0].title, playURL, this.tmpl.playlist[0].cover, this.tmpl.playlist[0].id);
            this.tmpl.dataLoading = false;
            this.tmpl.page = 1;
          });
        }.bind(this));
      }.bind(this);
    this.$.detailsDialog.close();
    this.tmpl.$.fab.state = 'off';
    this.tmpl.dataLoading = true;
    /* get data */
    this.tmpl.doXhr(url, 'json', function (e) {
      var response = e.target.response['subsonic-response'].similarSongs.song;
      if (response) {
        this.tmpl.$.audio.pause();
        this.tmpl.playlist = null;
        this.tmpl.playlist = [];
        Array.prototype.forEach.call(response, function (element) {
          var mins = Math.floor(element.duration / 60),
            seconds = Math.floor(element.duration - (mins * 60)),
            timeString = mins + ':' + ('0' + seconds).slice(-2),
            obj = {id: element.id, artist: element.artist, title: element.title, duration: timeString},
            artId = 'al-' + element.albumId,
            url2 = this.url + "/rest/getCoverArt.view?u=" + this.user + "&p=" + this.pass + "&v=" + this.version + "&c=PolySonic&size=550&id=" + artId;
          /* check indexeddb */
          this.tmpl.getDbItem(artId, function (ev) {
            if (ev.target.result) {
              var imgFile = ev.target.result,
                imgURL = window.URL.createObjectURL(imgFile);
              // got the image as imgURL
              obj.cover = imgURL;
              /* get palette if in db */
              this.tmpl.getDbItem(artId + '-palette', function (e) {
                obj.palette = e.target.result;
                this.tmpl.playlist.push(obj);
                i = i + 1;
                if (i === response.length) {
                  callback();
                }
              }.bind(this));
            } else {
              /*
                get image from subsonic server
              */
              this.tmpl.getImageFile(url2, artId, function (event) {
                var imgFile = event.target.result,
                  imgURL = window.URL.createObjectURL(imgFile);


                obj.cover = imgURL;

                /*
                  get dominant color from image
                */
                this.tmpl.colorThiefHandler(imgURL, artId, function (colorArray) {
                  obj.palette = colorArray;
                  this.tmpl.playlist.push(obj);
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
        this.tmpl.dataLoading = false;
        this.tmpl.doToast(chrome.i18n.getMessage("noResults"));
      }
    }.bind(this));
  }
});


