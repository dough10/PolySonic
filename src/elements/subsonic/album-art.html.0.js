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
    this.async(function () {
      if (this.listMode === 'list') {
        this.page = "small";
        this.width = '520px';
        this.height = "60px";
      } else if (this.listMode === 'search') {
        this.page = 'search';
        this.width = '370px';
        this.height = '60px';
      } else {
        this.page = "cover";
        this.width = "250px";
        this.height = "250px";
      }
    });
  },

  /* error handler for indexeddb calls */
  dbErrorHandler: function (e) {
    'use strict';
    this.tmpl.doToast(e);
    console.log(e);
  },

  /* counts json entrys in indexeddb with a given id */
  checkJSONEntry: function (id, callback) {
    'use strict';
    var transaction = this.tmpl.db.transaction(["albumInfo"], "readwrite"),
      request = transaction.objectStore("albumInfo").count(id);
    request.onsuccess = callback;
  },

  /* setup image  */
  setImage: function (event) {
    'use strict';
    this.async(function () {
      var imgFile = event.target.result,
        imgURL = window.URL.createObjectURL(imgFile),
        imgElement;

      this.$.card.style.backgroundImage = "url('" + imgURL + "')";
      this.$.topper.style.backgroundImage = "url('" + imgURL + "')";
      this.imgURL = imgURL;
      Array.prototype.forEach.call(this.playlist, function (e) {
        e.cover = imgURL;
      }.bind(this));
      this.isLoading = false;
    });
  },
  
  defaultArt: function () {
    this.async(function () {
      this.$.card.style.backgroundImage = "url('" + this.defaultImgURL + "')";
      this.$.topper.style.backgroundImage = "url('" + this.defaultImgURL + "')";
      this.imgURL = this.defaultImgURL;
    });
  },

  /*
    slide up the box to cover art and show hidden details
  */
  slideUp: function () {
    'use strict';
    this.async(function () {
      this.page = "info";
    });
  },

  /*
    slide box to normal position
  */
  closeSlide: function () {
    'use strict';
    this.async(function () {
      if (this.page === 'info') {
        this.page = "cover";
      }
    });
  },

  doDialog: function () {
    'use strict';
    this.async(function () {
      this.tmpl.dataLoading = false;
      this.closeSlide();
      this.$.detailsDialog.open();
      this.tmpl.$.fab.state = 'mid';
      this.tmpl.$.fab.ident = this.id;
      if (this.colorThiefEnabled && this.playlist[0].palette) {
        this.tmpl.colorThiefAlbum = this.playlist[0].palette[0];
        this.tmpl.colorThiefAlbumOff = this.playlist[0].palette[1];
      }
    });
  },

  closeDialog: function () {
    this.async(function () {
      this.$.detailsDialog.close();
      this.tmpl.$.fab.state = 'off';
    });
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
      this.tmpl.getImageForPlayer(this.imgURL);
      if (this.colorThiefEnabled && this.playlist[0].palette) {
        this.tmpl.colorThiefFab = this.playlist[0].palette[0];
        this.tmpl.colorThiefFabOff = this.playlist[0].palette[1];
        this.tmpl.colorThiefBuffered = this.playlist[0].palette[2];
        this.tmpl.colorThiefProgBg = this.playlist[0].palette[3];
      }
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
    this.async(function () {
      if (this.colorThiefEnabled && this.playlist[0].palette) {
        this.tmpl.colorThiefFab = this.playlist[0].palette[0];
        this.tmpl.colorThiefFabOff = this.playlist[0].palette[1];
        this.tmpl.colorThiefBuffered = this.playlist[0].palette[2];
        this.tmpl.colorThiefProgBg = this.playlist[0].palette[3];
      }
      var url = this.url + '/rest/stream.view?u=' + this.user + '&p=' + this.pass + '&v=' + this.version + '&c=PolySonic&maxBitRate=' + this.bitRate + '&id=' + sender.attributes.ident.value;
      this.$.detailsDialog.close();
      this.playerArt.style.backgroundImage = "url('" + this.imgURL + "')";
      this.tmpl.playlist = [{artist: sender.attributes.artist.value, title: sender.attributes.title.value, cover: this.imgURL, duration: sender.attributes.duration.value, id: sender.attributes.ident.value}];
      this.tmpl.playing = 0;
      this.tmpl.playAudio(sender.attributes.artist.value, sender.attributes.title.value, url, this.imgURL, sender.attributes.ident.value);
      this.tmpl.page = 1;
    });
  },

  addSingle2Playlist: function (event, detail, sender) {
    'use strict';
    this.async(function () {
      var url = this.url + '/rest/stream.view?u=' + this.user + '&p=' + this.pass + '&v=' + this.version + '&c=PolySonic&maxBitRate=' + this.bitRate + '&id=' + sender.attributes.ident.value,
        obj = {id: sender.attributes.ident.value, artist: sender.attributes.artist.value, title: sender.attributes.title.value,  duration: sender.attributes.duration.value , cover: this.imgURL};

      this.tmpl.playlist.push(obj);
      if (this.audio.paused) {
        if (this.colorThiefEnabled && this.playlist[0].palette) {
          this.tmpl.colorThiefFab = this.playlist[0].palette[0];
          this.tmpl.colorThiefFabOff = this.playlist[0].palette[1];
          this.tmpl.colorThiefBuffered = this.playlist[0].palette[2];
          this.tmpl.colorThiefProgBg = this.playlist[0].palette[3];
        }
        this.tmpl.playAudio(sender.attributes.artist.value, sender.attributes.title.value, url, this.imgURL, sender.attributes.ident.value);
        this.tmpl.playing = 0;
        if (this.imgURL) {
          this.playerArt.style.backgroundImage = "url('" + this.imgURL + "')";
        } else {
          this.playerArt.style.backgroundImage =  "url('images/default-cover-art.png')";
        }
      }
      this.tmpl.doToast(chrome.i18n.getMessage("added2Queue"));
    });
  },

  playAlbum: function () {
    'use strict';
    this.async(function () {
      this.tmpl.dataLoading = false;
      this.$.detailsDialog.close();
      if (this.colorThiefEnabled && this.playlist[0].palette) {
        this.tmpl.colorThiefFab = this.playlist[0].palette[0];
        this.tmpl.colorThiefFabOff = this.playlist[0].palette[1];
        this.tmpl.colorThiefBuffered = this.playlist[0].palette[2];
        this.tmpl.colorThiefProgBg = this.playlist[0].palette[3];
      }
      var url = this.url + '/rest/stream.view?u=' + this.user + '&p=' + this.pass + '&v=' + this.version + '&c=PolySonic&maxBitRate=' + this.bitRate + '&id=' + this.playlist[0].id;
      this.tmpl.getImageForPlayer(this.imgURL);
      this.tmpl.playlist = this.playlist;
      this.tmpl.playing = 0;
      this.tmpl.playAudio(this.playlist[0].artist, this.playlist[0].title, url, this.imgURL, this.playlist[0].id);
      this.tmpl.page = 1;
    });
  },

  addFavorite: function (event, detail, sender) {
    'use strict';
    this.async(function () {
      var animation = new CoreAnimation();
      animation.duration = 1000;
      animation.iterations = 'Infinity';
      animation.keyframes = [
        {opacity: 1},
        {opacity: 0}
      ];
      animation.target = sender;
      animation.play();
      var url = this.url + "/rest/star.view?u=" + this.user + "&p=" + this.pass + "&f=json&v=" + this.version + "&c=PolySonic&albumId=" + sender.attributes.ident.value;
      this.tmpl.doXhr(url, 'json', function (e) {
        if (e.target.response['subsonic-response'].status === 'ok') {
          this.isFavorite = true;
          animation.cancel();
        }
      }.bind(this));
    });
  },

  removeFavorite: function (event, detail, sender) {
    'use strict';
    this.async(function () {
      var animation = new CoreAnimation();
      animation.duration = 1000;
      animation.iterations = 'Infinity';
      animation.keyframes = [
        {opacity: 1},
        {opacity: 0}
      ];
      animation.target = sender;
      animation.play();
      var url = this.url + "/rest/unstar.view?u=" + this.user + "&p=" + this.pass + "&f=json&v=" + this.version + "&c=PolySonic&albumId=" + sender.attributes.ident.value;
      this.tmpl.doXhr(url, 'json', function (e) {
        if (e.target.response['subsonic-response'].status === 'ok') {
          this.isFavorite = false;
          animation.cancel();
        }
      }.bind(this));
    });
  },

  paletteChanged: function () {
    if (this.palette !== undefined) {
      Array.prototype.forEach.call(this.playlist, function (el) {
        el.palette = this.palette;
      }.bind(this));
    }
  },
  
  doSearchPlayback: function () {
    this.tmpl.$.searchDialog.close();
    this.tmpl.dataLoading = true;
    this.doQuery(this.playAlbum.bind(this));
  },
  
  doSearchDetails: function () {
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
  
  getPalette: function () {
    var artId = "al-" + this.item;
    this.tmpl.getDbItem(artId + '-palette', function (e) {
      this.palette = e.target.result;
    }.bind(this));
  },

  doPlayback: function () {
    this.async(function () {
      this.tmpl.$.searchDialog.close();
      this.tmpl.dataLoading = true;
      this.getPalette();
      this.doQuery(this.playAlbum.bind(this));
    });
  },
  
  doDetails: function () {
    this.async(function () {
      this.tmpl.dataLoading = true;
      this.getPalette();
      this.doQuery(this.doDialog.bind(this));
    });
  },
  
  doAdd2Playlist: function () {
    this.async(function () {
      this.tmpl.dataLoading = true;
      this.getPalette();
      this.doQuery(this.add2Playlist.bind(this));
    });
  },
  
  processJSON: function (callback) {
    this.playlist.length = 0;
    this.albumID = this.trackResponse['subsonic-response'].album.song[0].parent;
    this.tracks = this.trackResponse['subsonic-response'].album.song;

    /* sort tracks by diskNumber thanks Joe Shelby */
    this.tracks.sort(function(a,b) {
      var da = a.discNumber || 0, db = b.discNumber || 0;
      var ta = a.track || 0, tb = b.track || 0;
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
      this.job('job1', function () {
        callback();
      }, 200);
    }.bind(this)); 
  },
  
  doQuery: function (callback) {
    /*
      search indexeddb for data
    */
    this.queryingJSON = true;
    this.checkJSONEntry(this.item, function (e) {
      if (e.target.result === 0) {
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
      } else {
        /*
          get the data from indexeddb
        */
        this.tmpl.getDbItem(this.item, function (event) {
          this.trackResponse = event.target.result;
          this.processJSON(callback);
        }.bind(this));
      }
    }.bind(this));
  },

  itemChanged: function () {
    this.async(this.updateValues);
  },

  updateValues: function () {
    'use strict';
    if (this.item) {
      this.isLoading = true;
      this.defaultArt();
      this.playlist = null;
      this.playlist = [];

      var artId = "al-" + this.item,
          url = this.url + "/rest/getCoverArt.view?u=" + this.user + "&p=" + this.pass + "&v=" + this.version + "&c=PolySonic&size=550&id=" + artId;
      /*
        check indexeddb for image
      */
      this.tmpl.checkForImage(artId, function (e) {
        if (e.target.result === 0) {
          /*
            get image from subsonic server
          */
          this.tmpl.getImageFile(url, artId, function (event) {
            var imgFile = event.target.result,
              imgURL = window.URL.createObjectURL(imgFile),
              imgElement;

            this.$.card.style.backgroundImage = "url('" + imgURL + "')";
            this.$.topper.style.backgroundImage = "url('" + imgURL + "')";
            this.imgURL = imgURL;
            Array.prototype.forEach.call(this.playlist, function (e) {
              e.cover = imgURL;
            }.bind(this));
            this.isLoading = false;

            /*
              get dominant color from image

              rgb color code saved as this.color
            */
            imgElement = new Image();
            imgElement.src = imgURL;
            imgElement.onload = function () {
              var color = this.tmpl.getColor(imgElement),
                  array = [],
                  r = color[1][0],
                  g = color[1][1],
                  b = color[1][2],
                  hex = this.tmpl.rgbToHex(r, g, b);

              /*
                array[0] fab color

                array[1] fab contrasting color

                array[2] progress bar buffering color

                array[3] progress bar background
              */
              array[0] = 'rgb(' + r + ',' + g + ',' + b + ');';
              array[1]= this.tmpl.getContrast50(hex);
              array[2]= 'rgba(' + r + ',' + g + ',' + b + ',0.5);';
              if (array[1] !== 'white') {
                array[3] = '#444444';
              } else {
                array[3] = '#c8c8c8';
              }
              this.palette = array;
              this.tmpl.putInDb(array, this.cover + '-palette', function () {
                console.log('Color palette saved ' + this.cover);
              }.bind(this));
            }.bind(this);

          }.bind(this));
        } else {
          /*
            get image from indexeddb
          */
          this.tmpl.getDbItem(artId, this.setImage.bind(this));
        }
      }.bind(this));
    }
  }
});


