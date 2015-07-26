Polymer('artist-details', {
  domReady: function () {
    this.app = document.getElementById("tmpl");
    this.scrollTarget = this.app.appScroller();
  },
  queryData: function () {
    this.async(function () {
      this.app.doXhr(this.app.buildUrl('getArtistInfo2', {id: this.artistId}), 'json', function (e) {
        this.artistBio = e.target.response['subsonic-response'].artistInfo2;
        this.$.bio.innerHTML = this.artistBio.biography;
        if (this.artistBio.similarArtist && this.artistBio.similarArtist.length > 6) {
          this.artistBio.similarArtist.length = 6;
        }
        this.app.doXhr(this.app.buildUrl('getCoverArt', {
          id: 'ar-' + this.artistId,
          size: 250
        }), 'blob', function (xhrEvent) {
          this.$.bioImage.src = window.URL.createObjectURL(xhrEvent.target.response);
        }.bind(this));
        this.app.doXhr(
          this.app.buildUrl('getArtist', {
            id: this.artistId
          }), 'json', function (event) {
          this.data = event.target.response['subsonic-response'].artist.album;
          this.app.dataLoading = false;
          this.async(function () {
            this.app.page = 3;
          });
        }.bind(this));
      }.bind(this));
    });
  },
  playSomething: function (id, callback) {
    var element = this.$.all.querySelector('#' + id);
    element.$.detailsDialog.close();
    element.doPlayback();
    this.async(callback);
  },
  changeArtist: function (event, detail, sender) {
    this.artistId = sender.dataset.id;
    this.app.dataLoading = true;
    this.async(this.queryData);
  },
  mouseIn: function (event, detail, sender) {
    sender.setZ(2);
  },
  mouseOut: function (event, detail, sender) {
    sender.setZ(1);
  }
});
