Polymer('artist-details', {
  domReady: function () {
    this.app = document.getElementById("tmpl");
    this.scrollTarget = this.app.appScroller();
  },
  queryData: function () {
    this.async(function () {
      this.app.doXhr(
        this.app.buildUrl('getArtist', {id: this.artistId}), 'json', function (event) {
        this.data = event.target.response['subsonic-response'].artist.album;
        this.app.dataLoading = false;
        this.async(function () {
          this.app.page = 3;
        });
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
