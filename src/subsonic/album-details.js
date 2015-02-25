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

    this.tmpl = document.querySelector("#tmpl");

  },

  domReady: function () {
    'use strict';
    this.audio = document.querySelector("#audio");

    this.playerArt = document.querySelector("#coverArt");

  },

  setImage: function (img) {
    'use strict';
    this.$.head.style.backgroundImage = "url('" + img + "')";
  },

  dataChanged: function () {
    'use strict';
    if (this.data) {
      this.playlist = null;
      this.playlist = [];
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
    var url = this.url + '/rest/stream.view?u=' + this.user + '&p=' + this.pass + '&v=' + this.version + '&c=PolySonic&maxBitRate=' + this.bitRate + '&id=' + this.playlist[0].id;

    if (this.audio.paused) {
      this.tmpl.playing = 0;
      this.tmpl.playAudio(this.playlist[0].artist, this.playlist[0].title, url);
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
    this.playerArt.style.backgroundImage = "url('" + this.data.cover + "')";
    this.tmpl.page = 1;
    this.tmpl.playlist = this.playlist;
    this.tmpl.playing = 0;
    this.tmpl.playAudio(this.playlist[0].artist, this.playlist[0].title, url, this.data.cover);
  },


  playTrack: function (event, detail, sender) {
    'use strict';
    var url = this.url + '/rest/stream.view?u=' + this.user + '&p=' + this.pass + '&v=' + this.version + '&c=PolySonic&maxBitRate=' + this.bitRate + '&id=' + sender.attributes.ident.value,
      playerArt = document.querySelector('#coverArt');
    playerArt.style.backgroundImage = "url('" + this.data.cover + "')";
    this.tmpl.page = 1;
    this.tmpl.playlist = [{artist: sender.attributes.artist.value, title: sender.attributes.title.value, cover: this.data.cover, id: sender.attributes.ident.value}];
    this.tmpl.playing = 0;
    this.tmpl.playAudio(sender.attributes.artist.value, sender.attributes.title.value, url, this.data.cover);
  },

  addSingle2Playlist: function (event, detail, sender) {
    'use strict';
    var url = this.url + '/rest/stream.view?u=' + this.user + '&p=' + this.pass + '&v=' + this.version + '&c=PolySonic&maxBitRate=' + this.bitRate + '&id=' + sender.attributes.ident.value,
      obj = {id: sender.attributes.ident.value, artist: sender.attributes.artist.value, title: sender.attributes.title.value, cover: sender.attributes.cover.value};

    this.tmpl.playlist.push(obj);
    if (this.audio.paused) {
      this.tmpl.playAudio(sender.attributes.artist.value, sender.attributes.title.value, url, this.data.cover);
      this.tmpl.playing = 0;
      if (this.data.cover) {
        this.playerArt.style.backgroundImage = "url('" + this.data.cover + "')";
      } else {
        this.playerArt.style.backgroundImage =  "url('images/default-cover-art.png')";
      }
    }
    this.tmpl.doToast('Added to Playlist');
  },

  addFavorite: function (event, detail, sender) {
    'use strict';
    var url = this.url + "/rest/star.view?u=" + this.user + "&p=" + this.pass + "&f=json&v=" + this.version + "&c=PolySonic&albumId=" + sender.attributes.ident.value;
    this.tmpl.doXhr(url, 'json', function (e) {
      if (e.target.response['subsonic-response'].status === 'ok') {
        this.data.favorite = true;
      }
    }.bind(this));
  },

  removeFavorite: function (event, detail, sender) {
    'use strict';
    var url = this.url + "/rest/unstar.view?u=" + this.user + "&p=" + this.pass + "&f=json&v=" + this.version + "&c=PolySonic&albumId=" + sender.attributes.ident.value;
    this.tmpl.doXhr(url, 'json', function (e) {
      if (e.target.response['subsonic-response'].status === 'ok') {
        this.data.favorite = false;
      }
    }.bind(this));
  }
});

