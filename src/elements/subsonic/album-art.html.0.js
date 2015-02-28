/*global Polymer, console, document, Blob, window */
Polymer('album-art', {
  /*
    method ran when element is created in dom
  */
  created: function () {
    'use strict';
    this.imgURL = 'images/default-cover-art.png';
  },

  ready: function () {
    'use strict';
    this.page = this.page || "cover";

    this.artist = this.artist || "Artist Name";

    this.album = this.album || "Album Title";

    this.defaultImgURL = 'images/default-cover-art.png';
    
    this.tmpl = document.querySelector("#tmpl");
    
    this.audio = document.querySelector("#audio");

  },

  /* changes size and content of element */
  listModeChanged: function () {
    'use strict';
    if (this.listMode === 'list') {
      this.page = "small";
      this.width = '556px';
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
  },

  /* error handler for indexeddb calls */
  dbErrorHandler: function (e) {
    'use strict';
    this.tmpl.doToast(e);
    console.log(e);
  },

  /* query indexeddb content */
  getDbItem: function (id, callback) {
    'use strict';
    var transaction = this.tmpl.db.transaction(["albumInfo"], "readwrite"),
      request = transaction.objectStore("albumInfo").get(id);
    request.onsuccess = callback;
    request.onerror = this.dbErrorHandler;
  },

  /* counts images in indexeddb with a given id */
  checkForImage: function (id, callback) {
    'use strict';
    var transaction = this.tmpl.db.transaction(["albumInfo"], "readwrite"),
      request = transaction.objectStore("albumInfo").count(id);
    request.onsuccess = callback;
    request.onerror = this.dbErrorHandler;
  },

  /* counts json entrys in indexeddb with a given id */
  checkJSONEntry: function (id) {
    'use strict';
    var transaction = this.tmpl.db.transaction(["albumInfo"], "readwrite"),
      request = transaction.objectStore("albumInfo").count(id);
    request.onsuccess = function () {
      if (request.result === 0) {
        var url = this.url + "/rest/getAlbum.view?u=" + this.user + "&p=" + this.pass + "&f=json&v=" + this.version + "&c=PolySonic&id=" + id;
        this.tmpl.doXhr(url, 'json', function (e) {
          this.trackResponse = e.target.response;
          this.putInDb(this.trackResponse, id, function () {
            console.log('New JSON Data Added to indexedDB ' + id);
          });
        }.bind(this));
      } else {
        this.getDbItem(id, function (event) {
          var data = event.target.result;
          this.trackResponse = data;
        }.bind(this));
      }
    }.bind(this);
  },

  /* setup image  */
  setImage: function (event) {
    'use strict';
    var imgFile = event.target.result,
      imgURL = window.URL.createObjectURL(imgFile);

    if (imgURL === null) {
      console.log(this.cover + ' = null');
    }
    this.$.card.style.backgroundImage = "url('" + imgURL + "')";
    this.imgURL = imgURL;
    Array.prototype.forEach.call(this.playlist, function (e) {
      e.cover = imgURL;
    }.bind(this));
    this.isLoading = false;
  },

  /* save content to indexeddb */
  putInDb: function (data, id, callback) {
    'use strict';
    var transaction = this.tmpl.db.transaction(["albumInfo"], "readwrite");
    if (id) {
      transaction.objectStore("albumInfo").put(data, id);
      transaction.objectStore("albumInfo").get(id).onsuccess = callback;
    }
  },

  /* pull image from server */
  getImageFile: function (url, id, callback) {
    'use strict';
    this.tmpl.doXhr(url, 'blob', function (e) {
      var blob = new Blob([e.target.response], {type: 'image/jpeg'});
      this.putInDb(blob, id, callback);
      console.log('New Image Added to indexedDB ' + id);
    }.bind(this));
  },

  /*
    method ran when cover attribute is changed
  */
  coverChanged: function () {
    'use strict';
    document.querySelector("#tmpl").showApp();
    if (this.cover) {
      this.isLoading = true;
      var url = this.url + "/rest/getCoverArt.view?u=" + this.user + "&p=" + this.pass + "&v=" + this.version + "&c=PolySonic&id=" + this.cover;
      this.checkForImage(this.cover, function (e) {
        if (e.target.result === 0) {
          this.$.card.style.backgroundImage = "url('" + this.defaultImgURL + "')";
          this.imgURL = this.defaultImgURL;
          this.getImageFile(url, this.cover, this.setImage.bind(this));
        } else {
          this.getDbItem(this.cover, this.setImage.bind(this));
        }
      }.bind(this));
    } else {
      this.$.card.style.backgroundImage = "url('" + this.defaultImgURL + "')";
      this.imgURL = this.defaultImgURL;
    }
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

  trackResponseChanged: function () {
    'use strict';
    if (this.trackResponse) {
      this.playlist.length = 0;
      this.albumID = this.trackResponse['subsonic-response'].album.song[0].parent;
      this.tracks = this.trackResponse['subsonic-response'].album.song;
      Array.prototype.forEach.call(this.trackResponse['subsonic-response'].album.song, function (e) {
        var mins = Math.floor(e.duration / 60),
          seconds = Math.floor(e.duration - (mins * 60)),
          timeString = mins + ':' + ('0' + seconds).slice(-2),
          obj = {id: e.id, artist: e.artist, title: e.title, duration: timeString, cover: this.imgURL};
        this.playlist.push(obj);
      }.bind(this));
    }
  },

  doDialog: function () {
    'use strict';
    this.tmpl.setScrollerPos();
    var data = {artist: this.artist, album: this.album, id: this.item, coverid: this.cover, cover: this.imgURL, tracks: this.tracks, favorite: this.isFavorite, parent: this.albumID},
      details = document.querySelector("#details");
    details.data = data;
    this.tmpl.page = 3;
  },

  defaultPlayerImage: function () {
    'use strict';
    var art = document.querySelector('#coverArt');
    art.style.backgroundImage =  "url('images/default-cover-art.png')";
  },

  add2Playlist: function () {
    'use strict';
    var url = this.url + '/rest/stream.view?u=' + this.user + '&p=' + this.pass + '&v=' + this.version + '&c=PolySonic&maxBitRate=' + this.bitRate + '&id=' + this.playlist[0].id;
    if (this.audio.paused) {
      this.tmpl.playing = 0;
      this.tmpl.playAudio(this.playlist[0].artist, this.playlist[0].title, url, this.imgURL);
      if (this.cover) {
        this.tmpl.getImageForPlayer(this.imgURL);
      } else {
        this.defaultPlayerImage();
      }
    }
    Array.prototype.forEach.call(this.playlist, function (e) {
      this.tmpl.playlist.push(e);
    }.bind(this));
    this.tmpl.doToast('Added to Playlist');
  },

  doDownload: function (event, detail, sender) {
    'use strict';
    window.open(this.url + "/rest/download.view?u=" + this.user + "&p=" + this.pass + "&f=json&v=" + this.version + "&c=PolySonic&id=" + sender.attributes.ident.value, '_blank');
  },

  playAlbum: function () {
    'use strict';
    this.tmpl.setScrollerPos();
    var url = this.url + '/rest/stream.view?u=' + this.user + '&p=' + this.pass + '&v=' + this.version + '&c=PolySonic&maxBitRate=' + this.bitRate + '&id=' + this.playlist[0].id;
    if (this.cover) {
      this.tmpl.getImageForPlayer(this.imgURL);
    } else {
      this.defaultPlayerImage();
    }
    this.tmpl.page = 1;
    this.tmpl.playlist = this.playlist;
    this.tmpl.playing = 0;
    this.tmpl.playAudio(this.playlist[0].artist, this.playlist[0].title, url, this.imgURL);
  },

  addFavorite: function (event, detail, sender) {
    'use strict';
    var url = this.url + "/rest/star.view?u=" + this.user + "&p=" + this.pass + "&f=json&v=" + this.version + "&c=PolySonic&albumId=" + sender.attributes.ident.value;
    this.tmpl.doXhr(url, 'json', function (e) {
      if (e.target.response['subsonic-response'].status === 'ok') {
        this.isFavorite = true;
      }
    }.bind(this));
  },

  removeFavorite: function (event, detail, sender) {
    'use strict';
    var url = this.url + "/rest/unstar.view?u=" + this.user + "&p=" + this.pass + "&f=json&v=" + this.version + "&c=PolySonic&albumId=" + sender.attributes.ident.value;
    this.tmpl.doXhr(url, 'json', function (e) {
      if (e.target.response['subsonic-response'].status === 'ok') {
        this.isFavorite = false;
      }
    }.bind(this));
  },

  itemChanged: function () {
    'use strict';
    if (this.item) {
      this.playlist = null;
      this.playlist = [];
      this.checkJSONEntry(this.item);
    }
  }
});

