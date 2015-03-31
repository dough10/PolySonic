/*global Polymer, console, document, Blob, window */
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

  },

  /* 
    changes size and content of element 
  */
  listModeChanged: function () {
    'use strict';
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
    var imgFile = event.target.result,
      imgURL = window.URL.createObjectURL(imgFile),
      imgElement,
      list;
      
    this.$.card.style.backgroundImage = "url('" + imgURL + "')";
    this.imgURL = imgURL;
    Array.prototype.forEach.call(this.playlist, function (e) {
      e.cover = imgURL;
    }.bind(this));
    this.isLoading = false; 
    
    /*
      get dominant color from image
      
      rgb color code saved as this.color
    */
    if (this.colorThiefEnabled) {
      imgElement = new Image();
      imgElement.src = imgURL;
      imgElement.onload = function (e) {
        var color = this.tmpl.getColor(imgElement); 
        console.log(color);
      }.bind(this);
    }
  },
  
  defaultArt: function () {
    this.$.card.style.backgroundImage = "url('" + this.defaultImgURL + "')";
    this.imgURL = this.defaultImgURL;
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
    this.tmpl.$.searchDialog.close();
    this.tmpl.setScrollerPos();
    var data = {artist: this.artist, album: this.album, id: this.item, coverid: this.cover, cover: this.imgURL, tracks: this.tracks, favorite: this.isFavorite, parent: this.albumID},
      details = this.tmpl.$.details;
    details.data = data;
    this.tmpl.page = 3;
  },

  defaultPlayerImage: function () {
    'use strict';
    var art = this.tmpl.$.coverArt;
    art.style.backgroundImage =  "url('images/default-cover-art.png')";
  },

  add2Playlist: function () {
    'use strict';
    var url = this.url + '/rest/stream.view?u=' + this.user + '&p=' + this.pass + '&v=' + this.version + '&c=PolySonic&maxBitRate=' + this.bitRate + '&id=' + this.playlist[0].id;
    if (this.audio.paused) {
      this.tmpl.playing = 0;
      this.tmpl.playAudio(this.playlist[0].artist, this.playlist[0].title, url, this.imgURL);
      this.tmpl.getImageForPlayer(this.imgURL);
    }
    Array.prototype.forEach.call(this.playlist, function (e) {
      this.tmpl.playlist.push(e);
    }.bind(this));
    this.tmpl.doToast('Added to Play Queue');
  },

  doDownload: function (event, detail, sender) {
    'use strict';
    window.open(this.url + "/rest/download.view?u=" + this.user + "&p=" + this.pass + "&f=json&v=" + this.version + "&c=PolySonic&id=" + sender.attributes.ident.value, '_blank');
  },

  playAlbum: function () {
    'use strict';
    this.tmpl.$.searchDialog.close();
    this.tmpl.setScrollerPos();
    var url = this.url + '/rest/stream.view?u=' + this.user + '&p=' + this.pass + '&v=' + this.version + '&c=PolySonic&maxBitRate=' + this.bitRate + '&id=' + this.playlist[0].id;
    this.tmpl.getImageForPlayer(this.imgURL);
    this.tmpl.page = 1;
    this.tmpl.playlist = this.playlist;
    this.tmpl.playing = 0;
    this.tmpl.playAudio(this.playlist[0].artist, this.playlist[0].title, url, this.imgURL);
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
    var url = this.url + "/rest/star.view?u=" + this.user + "&p=" + this.pass + "&f=json&v=" + this.version + "&c=PolySonic&albumId=" + sender.attributes.ident.value;
    this.tmpl.doXhr(url, 'json', function (e) {
      if (e.target.response['subsonic-response'].status === 'ok') {
        this.isFavorite = true;
        animation.cancel();
      }
    }.bind(this));
  },

  removeFavorite: function (event, detail, sender) {
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
    var url = this.url + "/rest/unstar.view?u=" + this.user + "&p=" + this.pass + "&f=json&v=" + this.version + "&c=PolySonic&albumId=" + sender.attributes.ident.value;
    this.tmpl.doXhr(url, 'json', function (e) {
      if (e.target.response['subsonic-response'].status === 'ok') {
        this.isFavorite = false;
        animation.cancel();
      }
    }.bind(this));
  },

  itemChanged: function () {
    'use strict';
    if (this.item) {
      this.defaultArt();
      this.playlist = null;
      this.playlist = [];
      
      /*
        search indexeddb for data
      */
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
              console.log('JSON Data Added to indexedDB ' + this.item);
            }.bind(this));
          }.bind(this));
        } else {
          /*
            get the data from indexeddb
          */
          this.tmpl.getDbItem(this.item, function (event) {
            this.trackResponse = event.target.result;
          }.bind(this));
        }
      }.bind(this));
      var artId = "al-" + this.item;
      this.isLoading = true;
      var url = this.url + "/rest/getCoverArt.view?u=" + this.user + "&p=" + this.pass + "&v=" + this.version + "&c=PolySonic&id=" + artId;
      /*
        check indexeddb for image
      */
      this.tmpl.checkForImage(artId, function (e) {
        if (e.target.result === 0) {
          /*
            get image from subsonic server
          */
          this.tmpl.getImageFile(url, artId, this.setImage.bind(this));
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


