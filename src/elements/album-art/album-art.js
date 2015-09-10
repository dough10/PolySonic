Polymer({
  is: 'album-art',
  properties: {
    album: {
      type: Object,
      observer: "_albumChanged"
    }
  },
  ready: function () {
    this.app = document.querySelector('#app');
  },
  setArt: function (url) {
    this.$.art.style.backgroundImage = "url('" + url + "')";
    this.imgURL = url;
  },
  getImage: function () {
    return new Promise(function (resolve, reject) {
      this.app.getDbItem(this.item, function (e) {
        var img = e.target.result;
        if (img) {
          var imgURL = window.URL.createObjectURL(img);
          resolve(imgURL);
        } else {
          this.app.fetchImage(this.app.buildUrl('getCoverArt', {
            size: 500,
            id: this.item
          })).then(function gotBlob(blob) {
            this.app.storeInDb(blob, this.item).then(function (dbBlob) {
              var imgURL = window.URL.createObjectURL(blob);
              resolve(imgURL);
            });
          }.bind(this));
        }
      }.bind(this));
    }.bind(this));
  },
  _albumChanged: function (newVal) {
    this.async(function ablumChanged() {
      if (newVal) {
        this.setArt('../../../images/default-cover-art.png');
        this.albumTitle = newVal.album;
        this.artist = newVal.artist;
        this.item = newVal.id;
        this.id = 'album' + this.item;
        this.getImage().then(function (image) {
          this.setArt(image);
          this.$.loading.hidden = true;
        }.bind(this));
      }
    });
  }
});
