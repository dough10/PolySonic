Polymer({
  is: 'album-art',
  properties: {
    album: {
      type: Object,
      observer: "_albumChanged"
    }
  },
  _albumChanged: function (newVal) {
    this.async(function () {
      if (newVal) {
        this.albumTitle = newVal.album;
        this.artist = newVal.artist;
      }
    });
  }
});
