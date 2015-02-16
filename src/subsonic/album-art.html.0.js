/*global Polymer, console, document */
Polymer('album-art', {
  /*
    method ran when element is created in dom
  */
  created: function () {
    'use strict';
    this.imgURL = '../../images/default-cover-art.png';
  },

  ready: function () {
    'use strict';
    this.page = this.page || "cover";

    this.artist = this.artist || "Artist Name";

    this.album = this.album || "Album Title";

    this.playlist = [];

    this.defaultImgURL = '../../images/default-cover-art.png';
    
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
    } else {
      this.page = "cover";
      this.width = "250px";
      this.height = "250px";
    }
  },

  /* error handler for indexeddb calls */
  dbErrorHandler: function (e) {
    'use strict';
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
        this.new = true;
        this.doAjax();
      } else {
        this.new = false;
        this.getJSONFromDb(id);
      }
    }.bind(this);
  },

  /* pulls json content from indexeddb */
  getJSONFromDb: function (id) {
    'use strict';
    this.getDbItem(id, function (event) {
      var data = event.target.result;
      this.trackResponse = data;
    }.bind(this));
  },

  /* setup image  */
  setImage: function (event) {
    'use strict';
    var imgFile = event.target.result,
      imgURL = window.URL.createObjectURL(imgFile);

    this.$.card.style.backgroundImage = "url('" + imgURL + "')";
    this.imgURL = imgURL;
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
    var xhr = new XMLHttpRequest(),
      blob;
    xhr.open("GET", url, true);
    xhr.responseType = "blob";
    xhr.onload = function () {
      if (xhr.status === 200) {
        blob = xhr.response;
        this.putInDb(blob, id, callback);
      }
    }.bind(this);
    xhr.send();
    console.log('New Image Added to indexedDB ' + id);
  },

  /*
    method ran when cover attribute is changed
  */
  coverChanged: function () {
    'use strict';
    var visible = document.querySelector("#loader").classList.contains("hide"),
      loader = document.querySelector('#loader'),
      box = document.querySelector(".box");

    if (!visible) {
      loader.classList.add('hide');
      box.classList.add('hide');
    }
    if (this.cover) {
      var url = this.url + "/rest/getCoverArt.view?u=" + this.user + "&p=" + this.pass + "&f=json&v=" + this.version + "&c=PolySonic&id=" + this.cover;
      this.checkForImage(this.cover, function (e) {
        if (e.target.result === 0) {
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
    slide box box to normal position
  */
  closeSlide: function () {
    'use strict';
    this.page = "cover";
  },

  trackResponseChanged: function () {
    'use strict';
    if (this.trackResponse) {
      Array.prototype.forEach.call(this.trackResponse['subsonic-response'].album.song, function (e) {
        var obj = {id: e.id, artist: e.artist, title: e.title, cover: this.imgURL};
        this.playlist.push(obj);
      }.bind(this));
      this.albumID = this.trackResponse['subsonic-response'].album.song[0].parent;
      this.tracks = this.trackResponse['subsonic-response'].album.song;
    }
    if (this.new && this.trackResponse) {
      this.putInDb(this.trackResponse, this.item, function () {
        console.log('New JSON Data Added to indexedDB ' + this.item);
      }.bind(this));
    }
  },

  tracksChanged: function () {
    if (this.playlist.length !== this.tracks.length) {
      console.log(this.playlist);
    }
  },


  doDialog: function () {
    'use strict';
    console.log(this.playlist);
    console.log(this.tracks);
    var data = {artist: this.artist, album: this.album, id: this.item, coverid: this.cover, cover: this.imgURL, tracks: this.tracks, favorite: this.isFavorite, parent: this.albumID},
      details = document.querySelector("#details"),
      scroller = this.tmpl.appScroller();
    scroller.scrollTop = 0;
    details.data = data;
    this.tmpl.page = 3;
  },

  doAjax: function () {
    'use strict';
    var tracks = this.$.track;
    tracks.go();
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
      this.tmpl.playAudio(this.playlist[0].artist, this.playlist[0].title, url);
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
    var url = this.url + '/rest/stream.view?u=' + this.user + '&p=' + this.pass + '&v=' + this.version + '&c=PolySonic&maxBitRate=' + this.bitRate + '&id=' + this.playlist[0].id;
    console.log(this.playlist[0]);
    console.log(this.playlist);
    if (this.cover) {
      this.tmpl.getImageForPlayer(this.imgURL);
    } else {
      this.defaultPlayerImage();
    }
    this.tmpl.page = 1;
    this.tmpl.playlist = this.playlist;
    this.tmpl.playing = 0;
    this.tmpl.playAudio(this.playlist[0].artist, this.playlist[0].title, url);
    this.tmpl.systemNotify(this.playlist[0].artist, this.playlist[0].title, this.imgURL);
  },

  addFavorite: function (event, detail, sender) {
    'use strict';
    var xhr = new XMLHttpRequest(),
      fav = this;
    xhr.open('GET', this.url + "/rest/star.view?u=" + this.user + "&p=" + this.pass + "&f=json&v=" + this.version + "&c=PolySonic&albumId=" + sender.attributes.ident.value, true);
    xhr.responseType = 'json';
    xhr.onload = function () {
      if (this.response['subsonic-response'].status === 'ok') {
        fav.isFavorite = true;
      }
    };
    xhr.send();
  },

  removeFavorite: function (event, detail, sender) {
    'use strict';
    var xhr = new XMLHttpRequest(),
      fav = this;
    xhr.open('GET', this.url + "/rest/unstar.view?u=" + this.user + "&p=" + this.pass + "&f=json&v=" + this.version + "&c=PolySonic&albumId=" + sender.attributes.ident.value, true);
    xhr.responseType = 'json';
    xhr.onload = function () {
      if (this.response['subsonic-response'].status === 'ok') {
        fav.isFavorite = false;
      }
    };
    xhr.send();
  },

  itemChanged: function () {
    'use strict';
    if (this.item) {
      this.playlist.splice(0, this.playlist.length);
      this.checkJSONEntry(this.item);
    }
  }
});

