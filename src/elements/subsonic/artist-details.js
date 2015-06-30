Polymer('artist-details', {
  created: function () {
    this.data = [];
  },
  domReady: function () {
    this.app = document.getElementById("tmpl");
    this.scrollTarget = this.app.appScroller();
  },
  queryData: function () {
    this.data.length = 0;
    this.async(function () {
      this.app.doXhr(this.app.buildUrl('getArtist', {id: this.artistId}), 'json', function (event) {
        var response = event.target.response['subsonic-response'].artist.album;
        var length = response.length;
        for (var i = 0; i < length; i++) {
          this.data.push(response[i]);
          if (i === length - 1) {
            this.app.page = 3;
            this.app.dataLoading = false;
          }
        }
      }.bind(this));
    });
  },
  playSomething: function (id, callback) {
    var element = this.$.all.querySelector('#' + id);
    console.log(element);
    element.$.detailsDialog.close();
    element.doPlayback();
    this.async(callback);
  }
});
