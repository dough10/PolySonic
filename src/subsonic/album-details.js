/*global Polymer, console, document */
Polymer('album-details', {
  /*
    method ran when element is created in dom
  */
  created: function () {
    'use strict';
    this.imgURL = this.imgURL || '../../images/default-cover-art.png';
  },

  ready: function () {
    'use strict';

    this.playlist = [];

    this.tracks = [];

  },

  setImage: function (img) {
    'use strict';
    this.$.head.style.backgroundImage = "url('" + img + "')";
  },

  dataChanged: function () {
    if (this.data) {
      if (this.data.cover) {
        this.setImage(this.data.cover);
      }
      Array.prototype.forEach.call(this.data.tracks, function (e) {
        var obj = {id: e.id, artist: e.artist, title: e.title, cover: this.data.cover};
        this.playlist.push(obj);
      }.bind(this));
    }
  },

  add2Playlist: function () {
    'use strict';
    var audio = document.querySelector("#audio"),
      toast = document.querySelector("#toast"),
      tmpl = document.querySelector("#tmpl"),
      url = this.url + '/rest/stream.view?u=' + this.user + '&p=' + this.pass + '&v=' + this.version + '&c=PolySonic&maxBitRate=' + this.bitRate + '&id=' + this.playlist[0].id;

    if (audio.paused) {
      tmpl.playing = 0;
      tmpl.playAudio(this.playlist[0].artist, this.playlist[0].title, url);
    }
    Array.prototype.forEach.call(this.playlist, function (e) {
      tmpl.playlist.push(e);
    }.bind(this));
    toast.text = 'Added to Playlist';
    toast.show();
  },

  doDownload: function (event, detail, sender) {
    'use strict';
    window.open(this.url + "/rest/download.view?u=" + this.user + "&p=" + this.pass + "&f=json&v=" + this.version + "&c=PolySonic&id=" + sender.attributes.ident.value, '_blank');
  },

  playAlbum: function () {
    'use strict';
    var tmpl = document.querySelector("#tmpl"),
      url = this.url + '/rest/stream.view?u=' + this.user + '&p=' + this.pass + '&v=' + this.version + '&c=PolySonic&maxBitRate=' + this.bitRate + '&id=' + this.playlist[0].id,
      playerArt = document.querySelector('#coverArt');
    playerArt.style.backgroundImage = "url('" + this.data.cover + "')";
    tmpl.page = 1;
    tmpl.playlist = this.playlist;
    tmpl.playing = 0;
    tmpl.playAudio(this.playlist[0].artist, this.playlist[0].title, url);
    tmpl.systemNotify(this.playlist[0].artist, this.playlist[0].title, this.data.cover);
  },


  playTrack: function (event, detail, sender) {
    'use strict';
    var tmpl = document.querySelector("#tmpl"),
      url = this.url + '/rest/stream.view?u=' + this.user + '&p=' + this.pass + '&v=' + this.version + '&c=PolySonic&maxBitRate=' + this.bitRate + '&id=' + sender.attributes.ident.value;

    tmpl.page = 1;
    tmpl.playlist = this.playlist;
    tmpl.playing = 0;
    tmpl.playAudio(sender.attributes.artist.value, sender.attributes.title.value, url);
    tmpl.systemNotify(sender.attributes.artist.value, sender.attributes.title.value, this.data.cover);
  },

  addSingle2Playlist: function (event, detail, sender) {
    'use strict';
    var audio = document.querySelector("#audio"),
      note = document.querySelector("#playNotify"),
      tmpl = document.querySelector("#tmpl"),
      toast = document.querySelector("#toast"),
      url = this.url + '/rest/stream.view?u=' + this.user + '&p=' + this.pass + '&v=' + this.version + '&c=PolySonic&maxBitRate=' + this.bitRate + '&id=' + sender.attributes.ident.value,
      obj = {id: sender.attributes.ident.value, artist: sender.attributes.artist.value, title: sender.attributes.title.value, cover: sender.attributes.cover.value};

    tmpl.playlist.push(obj);
    if (audio.paused) {
      tmpl.playAudio(sender.attributes.artist.value, sender.attributes.title.value, url);
      if (this.cover) {
        tmpl.getImageForPlayer(this.cover);
      } else {
        document.querySelector('#coverArt').style.backgroundImage =  "url('images/default-cover-art.png')";
      }
    }
    toast.text = 'Added to Playlist';
    toast.show();
    tmpl.systemNotify(sender.attributes.artist.value, sender.attributes.title.value, this.imgURL);
  },

  addFavorite: function (event, detail, sender) {
    'use strict';
    var xhr = new XMLHttpRequest(),
      fav = this;
    xhr.open('GET', this.url + "/rest/star.view?u=" + this.user + "&p=" + this.pass + "&f=json&v=" + this.version + "&c=PolySonic&albumId=" + sender.attributes.ident.value, true);
    xhr.responseType = 'json';
    xhr.onload = function (e) {
      if (this.response['subsonic-response'].status === 'ok') {
        fav.data.favorite = true;
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
    xhr.onload = function (e) {
      if (this.response['subsonic-response'].status === 'ok') {
        fav.data.favorite = false;
      }
    };
    xhr.send();
  }
});

