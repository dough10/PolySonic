Polymer('artist-details', {
  created: function () {
    this.data = [];
  },
  domReady: function () {
    this.tmpl = document.getElementById("tmpl");
    this.scrollTarget = this.tmpl.appScroller();
  },
  queryData: function () {
    this.data = null;
    this.data = [];
    var url = this.url + "/rest/getArtist.view?u=" + this.user + "&p=" + this.pass + "&f=json&v=" + this.version + "&c=PolySonic&id=" + this.artistId;
    this.tmpl.doXhr(url, 'json', function (event) {
      var response = event.target.response['subsonic-response'];
      Array.prototype.forEach.call(response.artist.album, function (e) {
        var obj = {name: e.name, artist: e.artist, coverArt: e.coverArt, id: e.id, starred: e.starred, url: this.url, user: this.user, pass: this.pass, version: this.version, listMode: this.listMode, bitRate: this.bitRate, colorThiefEnabled: this.colorThiefEnabled};
        this.data.push(obj);
      }.bind(this));
    }.bind(this));
  },
  playSomething: function (id) {
    var albums = this.$.all.querySelectorAll('album-art');
    Array.prototype.forEach.call(albums, function (el) {
      if (el.id === id) {
        el.playAlbum();
      }
    }.bind(this));
  }
});
