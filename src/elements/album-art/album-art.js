Polymer({
  is: 'album-art',
  
  behaviors: [
    Polymer.NeonAnimatableBehavior,
    Polymer.NeonAnimationRunnerBehavior,
    Polymer.NeonSharedElementAnimatableBehavior
  ],

  properties: {

    /**
     * a array the is the playlist for this album
     */
    playlist: {
      type: Array,
      value: []
    },

    /**
     * a Object with the details about this ablum
     */
    album: {
      type: Object,
      observer: "_albumChanged"
    },

    /**
     * a Array with the palette of colors matching the artwork for this album
     */
    palette: {
      type: Array,
      observer: '_paletteChanged'
    },

    /**
     * a Boolean if this album is in favorites list
     */
    isFavorite: {
      type: Boolean,
      value: false
    },
    
    animationConfig: {
      type: Object,
      value: function() {
        return {
          'fabIn': {
            name: 'scale-up-animation',
            node: this.$.fab
          },
          'fabOut': {
            name: 'scale-down-animation',
            node: this.$.fab
          }
        };
      }
    }
  },
  
  listeners: {
    'neon-animation-finish': '_onAnimationFinish'
  },
  
  /**
   * animation finished callback
   */
  _onAnimationFinish: function (e) {
    if (!this.$.details.opened) {
      this.$.fab.hidden = true;
    }
  },

  /**
   * animation of dialog has finished callback
   */
  _dialogAnimationFinished: function () {
    if (this.$.details.opened) {
      this.$.fab.hidden = false;
      this.playAnimation('fabIn');
    }
  },

  /**
   * element is ready
   */
  ready: function () {
    this.app = document.querySelector('#app');
  },

  /**
   * set the background immage url
   */
  setArt: function (url) {
    this.$.art.style.backgroundImage = "url('" + url + "')";
    this.$.detailsArt.style.backgroundImage = "url('" + url + "')";
    this.imgURL = url;
  },

  /**
   * mouse is over this item
   */
  mouseIn: function () {
    this.$.art.elevation = 3;
  },

  /**
   * mouse has left this item
   */
  mouseOut: function () {
    this.$.art.elevation = 1;
  },

  /**
   * request the image from Subsonic
   * request the image as a blob strores it in database
   * then processes image and extracts a color palette and saves that palette to database
   */
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
              this.app.colorThief(imgURL, this.item).then(function () {
                console.log('color pallet saved');
              });
              resolve(imgURL);
            }.bind(this));
          }.bind(this));
        }
      }.bind(this));
    }.bind(this));
  },

  /**
   * builds a playlist from the Subsonic response
   * @param {Array} tracks       the array from Subsonic response
   */
  makePlaylist: function (tracks) {
    return new Promise(function (resolve, reject) {
      this.playlist.length = 0;
      var tlength = tracks.length;
      for (var i = 0; i < tlength; i++) {
        this.albumSize = Number(this.albumSize) + Number(tracks[i].size);
        this.push('playlist', {
          id: tracks[i].id,
          artist: tracks[i].artist,
          title: tracks[i].title,
          duration: this.app.secondsToMins(tracks[i].duration),
          cover: this.imgURL,
          bookmarkPosition: tracks[i].bookmarkPosition,
          palette: this.palette,
          disk: tracks[i].discNumber,
          track: tracks[i].track
        });
        if (tracks[i].bookmarkPosition && this.bookmarkIndex === undefined) {
          this.bookmarkIndex = i;
        }
        if (i === tlength - 1) {
          resolve(this.playlist);
        }
      }
    }.bind(this));
  },

  /**
   * requests the playlist from Subsonic and starts playing the album
   */
  playAlbum: function () {
    this.app.dataLoading = true;
    this.app.playlist.length = 0;
    this.playlist.length = 0;
    this.app.getDbItem(this.item + '-palette', function (e) {
      this.palette = e.target.result;
      this.app.fetchJSON(this.app.buildUrl('getMusicDirectory', {
        id: this.item
      })).then(function (json) {
        if (json.status === 'ok') {
          this.app.dataLoading = false;
          this.makePlaylist(json.directory.child).then(function () {
            this.app.playlist = this.playlist;
          }.bind(this));
        }
      }.bind(this));
    }.bind(this));
  },

  /**
   * opens the album details dialog
   */
  openDetails: function () {
    this.app.dataLoading = true;
    this.app.getDbItem(this.item + '-palette', function (e) {
      this.palette = e.target.result;
      this.app.fetchJSON(this.app.buildUrl('getMusicDirectory', {
        id: this.item
      })).then(function (json) {
        if (json.status === 'ok') {
          this.makePlaylist(json.directory.child).then(function () {
            if (!this.$.details.opened) {
              this.$.details.open();
              var wall = document.querySelector('album-wall');
              wall.playAnimation('fabDown');
              wall.fabShowing = false;
              this.size();
              this.app.dataLoading = false;
            }
          }.bind(this));
        }
      }.bind(this));
    }.bind(this));
  },

  /**
   * close the albums details dialog
   */
  closeDetails: function () {
    if (this.$.details.opened) {
      this.$.details.close();
      this.playAnimation('fabOut');
    }
  },

  /**
   * the album property has changed
   */
  _albumChanged: function (newVal) {
    this.async(function ablumChanged() {
      if (newVal) {
        this.$.downloadLink.hidden = !this.app.activeUser.downloadRole;
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
  },

  /**
   * the pallet array has changed
   * sets the color palette of this album
   */
  _paletteChanged: function (newVal) {
    this.$.closeDialog.style.background = newVal[1];
    this.$.closeDialog.style.color = newVal[0];
    this.$.fab.style.color = newVal[1];
    this.$.fab.style.background = newVal[0];
  },
  
  /**
   * app resize callback
   * sets the position of the details play fab 
   */
  size: function () {
    this.$.fab.style.right = ((window.innerWidth / 2) - 260)+ 'px';
    this.$.fab.style.bottom = ((window.innerHeight / 2) - 75) + 'px';
  },

  /**
   * play back 1 single
   * @param {Event} e
   */
  playTrack: function (e) {
    var item = this.playlist[e.model.index];
    if (item.bookmarkPosition && this.$.bookmarkOption.opened) {
      // give option to play from bookmark or start from beginning 
    }
    console.log(item);
  },
  
  /**
   * resume playback of a album from a bookmarked position
   */
  resumeFromBookmark: function () {},
  
  /**
   * play the album from the beginning
   */
  playFromBeginning: function () {},

  /**
   * add a single to the app play queue
   */
  addSingle2Playlist: function (e) {
    var item = this.playlist[e.model.index];
    console.log(item);
  },

  /**
   * queue the track to downlaod
   * @param {Event} e
   */
  trackDownload: function (e) {
    var item = this.playlist[e.model.index];
    console.log(item);
  }
});
