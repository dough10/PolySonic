Polymer('artist-details', {
  domReady: function () {
    this.app = document.getElementById("tmpl");
    this.scrollTarget = this.app.appScroller();
    this.sortBy = 0;
  },
  queryData: function () {
    this.async(function () {
      this.app.doXhr(
        this.app.buildUrl('getArtistInfo2', {
          id: this.artistId
        }), 'json', function (e) {
        this.artistBio = e.target.response['subsonic-response'].artistInfo2;
        this.$.bio.innerHTML = this.artistBio.biography;
        this.app.doXhr(
          this.app.buildUrl('getCoverArt', {
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
          for (var i = 0; i < this.data.length; i++) {
            this.data[i].listMode = this.listMode;
          }
          this.app.dataLoading = false;
          this.async(function () {
            if (this.app.page !== 3) {
              this.app.page = 3;
            }
            this.sortByChanged();
          });
        }.bind(this));
      }.bind(this));
    });
  },
  sortByChanged: function () {
    this.async(function () {
      if (this.data !== undefined) {
        switch (this.sortBy) {
          case 0:
            this.data.sort(function(a, b){
              if(a.name < b.name) return -1;
              if(a.name > b.name) return 1;
              return 0;
            });
            break;
          case 1:
            this.data.sort(function (a,b) {
              return a.year - b.year;
            });
            break;
          case 2:
            this.data.sort(function (a,b) {
              return a.year - b.year;
            });
            this.data.reverse();
            break;
        }
      }
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
