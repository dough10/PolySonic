/*global Polymer, console, chrome, document, Blob, window, Image, CoreAnimation */
Polymer('album-wall', {
  wall: [],
  podcast: [],
  artist: [],
  created: function () {

  },

  ready: function () {
    /* locale settings */
    'use strict';
    this.$.cover.grid = true;
    this.$.cover.width = '260';
    this.$.cover.height = '260';
    simpleStorage.getSync().then(function (res) {
      console.log(res);
      this.post = {
        type: res.sortType || 'newest',
        size: 20,
        offset: 0
      };
      this.request = res.request || 'getAlbumList2';
      this.showing = this.showing || 'cover';
      this.queryMethod = this.queryMethod || 'ID3';
      if (res.request === 'getPodcasts') {
        this.showing = 'podcast';
      } else if (res.request === 'getStarred2') {
        this.showing = this.listMode;
      } else if (res.request === 'getArtists') {
        this.showing = 'artists';
      }
    }.bind(this));
  },

  domReady: function () {
    'use strict';
    this.app = document.getElementById("tmpl");
    this.audio = this.app.$.player.audio;
    this.scrollTarget = this.app.appScroller();
  },

  mediaFolderChanged: function (oldVal, newVal) {
    'use strict';
    this.async(function () {
      this.$.globals.closeDrawer().then(function () {
        if (Number(newVal) !== 0) {
          this.post.musicFolderId = Number(newVal);
        } else {
          delete this.post.musicFolderId;
        }
        this.app.pageLimit = false;
        this.$.threshold.clearLower();
        this.async(this.refreshContent);
      }.bind(this))
    });
  },

  clearData: function (callback) {
    'use strict';
    console.time('data request');
    this.wall.length = 0;
    this.artist.length = 0;
    this.podcast.length = 0;
    this.isLoading = true;
    this.app.dataLoading = true;
    this.$.cover.updateSize();
    this.$.podcast.updateSize();
    this.$.artists.updateSize();
    this.async(callback);
  },

  responseCallback: function () {
    'use strict';
    this.app.dataLoading = false;
    this.async(function () {
      this.isLoading = false;
    }, null, 1000);
    this.app.showApp();
    console.timeEnd('data request');
  },

  responseChanged: function () {
    'use strict';
    if (this.response) {
      this.async(function responseCallback() {
        var response = this.response['subsonic-response'];
        if (response.status === 'failed') {
          console.log(response.error.message);
          this.app.doToast(response.error.message);
        } else {
          if (response.albumList2 && response.albumList2.album) {
            this.wall = this.wall.concat(response.albumList2.album);
            for (var i = 0; i < this.wall.length; i++) {
              this.wall[i].listMode = this.listMode;
            }
            this.async(this.responseCallback);
          } else if (response.albumList && response.albumList.album) {
            this.wall = this.wall.concat(response.albumList.album);
            for (var i = 0; i < this.wall.length; i++) {
              this.wall[i].listMode = this.listMode;
            }
            this.async(this.responseCallback);
          } else if (response.starred2 && response.starred2.album) {
            this.wall = this.wall.concat(response.starred2.album);
            for (var i = 0; i < this.wall.length; i++) {
              this.wall[i].listMode = this.listMode;
            }
            this.async(this.responseCallback);
          } else if (response.starred && response.starred.album) {
            this.wall = this.wall.concat(response.starred.album);
            for (var i = 0; i < this.wall.length; i++) {
              this.wall[i].listMode = this.listMode;
            }
            this.async(this.responseCallback);
          } else if (response.podcasts && response.podcasts.channel) {
            /* inject podcastRole into response so it can be used inside the repeating template scope */
            var podcasts = response.podcasts.channel;
            var length = podcasts.length;
            for (var i = 0; i < length; i++) {
              if ('episode' in podcasts[i]) {
                var innerLength = podcasts[i].episode.length;
                for (var ii = 0; ii < innerLength; ii++) {
                  podcasts[i].episode[ii].podcastRole = this.app.activeUser.podcastRole;
                }
              }
              if (i === length - 1) {
                this.podcast = podcasts;
                this.async(this.responseCallback);
              }
            }
          } else if (response.artists && response.artists.index) {
            this.artist = response.artists.index;
            this.async(this.responseCallback);
          } else if (response.searchResult3 && response.searchResult3.album) {
            /* filter out duplicate albums from response array */
            var data = response.searchResult3.album;
            var length2 = response.searchResult3.album.length;
            var tmpArray = [];
            for  (var i2 = 0; i2 < length2; i2++) {
              if (!this.containsObject(data[i2], tmpArray)) {
                tmpArray.push(data[i2]);
              }
              if (i2 === length2 - 1) {
                this.wall = tmpArray;
                this.async(this.responseCallback);
              }
            }
          } else {
            this.app.dataLoading = false;
            this.isLoading = false;
            this.app.showApp();
            this.app.pageLimit = true;
          }
        }
      });
    }
  },

  artistDetails: function (event, detail, sender) {
    'use strict';
    var artist = document.getElementById("aDetails");
    this.app.dataLoading = true;
    artist.artistId = sender.attributes.ident.value;
    artist.queryData();
  },

  doAjax: function () {
    'use strict';
    this.async(function () {
      this.request = this.request || 'getAlbumList2'
      this.$.ajax.url = this.$.globals.buildUrl(this.request, this.post);
      this.$.ajax.go();
    }, null, 100);
  },

  getPodcast: function () {
    'use strict';
    this.showing = 'podcast';
    this.clearData(function podcastCallback() {
      this.app.pageLimit = false;
      this.request = 'getPodcasts';
      if (this.post.type) {
        delete this.post.type;
      }
      this.post.offset = 0;
      chrome.storage.sync.set({
        'sortType': this.post.type,
        'request': this.request,
        'mediaFolder': this.mediaFolder
      });
      this.async(this.doAjax);
    }.bind(this));
  },

  getStarred: function () {
    'use strict';
    this.showing = this.listMode;
    this.clearData(function starredCallback() {
      this.app.pageLimit = false;
      if (this.queryMethod === 'ID3') {
        this.request = 'getStarred2';
      } else {
        this.request = 'getStarred';
      }
      if (this.post.type) {
        delete this.post.type;
      }
      this.post.offset = 0;
      chrome.storage.sync.set({
        'sortType': this.post.type,
        'request': this.request,
        'mediaFolder': this.mediaFolder
      });
      this.async(this.doAjax);
    }.bind(this));
  },

  getArtist: function () {
    'use strict';
    this.clearData(function artistSearch() {
      this.app.pageLimit = false;
      this.request = 'getArtists';
      if (this.post.type) {
        delete this.post.type;
      }
      this.post.offset = 0;
      chrome.storage.sync.set({
        'sortType': this.post.type,
        'request': this.request,
        'mediaFolder': this.mediaFolder
      });
      this.showing = 'artists';
      this.async(this.doAjax);
    }.bind(this));
  },

  sortChanged: function () {
    'use strict';
    this.showing = this.listMode;
    this.clearData(function sortCallback() {
      this.app.pageLimit = false;
      if (this.queryMethod === 'ID3') {
        this.request = 'getAlbumList2';
      } else {
        this.request = 'getAlbumList';
      }
      this.post.type = this.sort;
      this.post.offset = 0;
      chrome.storage.sync.set({
        'sortType': this.post.type,
        'request': this.request,
        'mediaFolder': this.mediaFolder
      });
      this.async(this.doAjax);
    }.bind(this));
  },

  errorChanged: function () {
    'use strict';
    if (this.error) {
      console.error(this.error);
      this.app.doToast(chrome.i18n.getMessage("connectionError"));
    }
  },

  loadMore: function () {
    'use strict';
    this.$.threshold.clearLower();
    if (!this.isLoading && this.request !== 'getStarred2' && this.request !== 'getPodcasts' && this.request !== 'getArtists' && !this.app.pageLimit && this.app.page === 0) {
      this.isLoading = true;
      console.count('lazy load');
      this.post.offset = parseInt(this.post.offset, 10) + parseInt(this.post.size, 10);
      this.async(this.doAjax);
    }
  },

  querySizeChanged: function () {
    'use strict';
    this.post.size = this.querySize;
  },

  listModeChanged: function () {
    'use strict';
    this.async(function () {
      if (this.listMode) {
        if (this.request !== 'getArtists' && this.request !== 'getPodcasts') {
          if (this.listMode === 'cover') {
            this.showing = 'cover';
          } else {
            this.showing = 'list';
          }
          this.app.dataLoading = false;
        }
      }
    });
  },

  getPaletteFromDb: function (id, callback) {
    'use strict';
    this.app.getDbItem(id + '-palette', function (e) {
      callback(e.target.result);
    }.bind(this));
  },

  doPlay: function (obj) {
    'use strict';
    this.app.playlist = [obj];
    if (this.app.playing === 0) {
      this.app.$.player.playAudio(this.app.playlist[0]);
    } else {
      this.app.playing = 0;
    }
    this.app.dataLoading = false;
  },

  mouseIn: function (event, detail, sender) {
    sender.setZ(2);
  },

  mouseOut: function (event, detail, sender) {
    sender.setZ(1);
  },

  playChoice: function (event, detail, sender) {
    this.$.playbackConfirm.open();
    this.bookMark = {
      id: sender.attributes.streamId.value,
      title: sender.attributes.trackTitle.value,
      bookmarkPosition: sender.attributes.bookmark.value,
      cover: sender.attributes.cover.value
    };
    this.bookmarkTime = this.app.secondsToMins(sender.attributes.bookmark.value / 1000);
  },

  playPodcast: function (event, detial, sender) {
    'use strict';
    this.app.dataLoading = true;
    var imgURL,
      obj = {
        id: sender.attributes.streamId.value,
        artist: '',
        title: sender.attributes.trackTitle.value,
      };
    if (sender.attributes.bookmark) {
      obj.bookmarkPosition = sender.attributes.bookmark.value;
    }
    if (sender.attributes.cover.value) {
      this.app.getDbItem(sender.attributes.cover.value, function (ev) {
        if (ev.target.result) {
          var imgFile = ev.target.result;
          obj.cover = window.URL.createObjectURL(imgFile);
          this.app.$.player.getImageForPlayer(imgURL, function () {
            this.getPaletteFromDb(sender.attributes.cover.value, function (palette) {
              obj.palette = palette;
              this.app.setFabColor(obj);
              this.doPlay(obj);
            }.bind(this));
          }.bind(this));
        } else {
          this.app.getImageFile(
            this.app.buildUrl('getCoverArt', {
              id: sender.attributes.cover.value
            }), sender.attributes.cover.value, function (ev) {
            obj.cover = window.URL.createObjectURL(ev.target.result);
            this.app.$.player.getImageForPlayer(obj.cover, function () {
              this.app.colorThiefHandler(obj.cover, sender.attributes.cover.value, function (colorArray) {
                obj.palette = colorArray;
                this.app.setFabColor(obj);
                this.doPlay(obj);
              }.bind(this));
            }.bind(this));
          }.bind(this));
        }
      }.bind(this));
    } else {
      obj.cover = '../../../images/default-cover-art.png';
      this.app.$.player.getImageForPlayer(obj.cover);
      this.doPlay(obj);
      this.app.page = 1;
    }
  },

  conBookDel: function (event) {
    this.delID = event.path[0].dataset.id;
    this.$.bookmarkConfirm.open();
  },

  deleteBookmark: function (event) {
    this.app.doXhr(
      this.app.buildUrl('deleteBookmark', {
        id: this.delID
      }), 'json', function (e) {
      if (e.target.response['subsonic-response'].status === 'ok') {
        this.refreshContent();
      } else {
        this.app.doToast(e.target.response['subsonic-response'].error.message);
      }
    }.bind(this));
  },

  add2Playlist: function (event, detial, sender) {
    'use strict';
    var imgURL,
      obj = {
        id: sender.attributes.streamId.value,
        artist: '',
        title: sender.attributes.trackTitle.value,
      };
    this.app.dataLoading = true;
    if (sender.attributes.cover.value) {
      this.app.getDbItem(sender.attributes.cover.value, function (ev) {
        if (ev.target.result) {
          imgURL = window.URL.createObjectURL(ev.target.result);
          obj.cover = imgURL;
          this.getPaletteFromDb(sender.attributes.cover.value, function (palette) {
            obj.palette = palette;
            if (this.audio && this.audio.paused) {
              this.app.$.player.getImageForPlayer(imgURL, function () {
                this.app.setFabColor(obj);
                this.doPlay(obj);
                this.app.dataLoading = false;
                this.app.doToast(chrome.i18n.getMessage("added2Queue"));
              }.bind(this));
            } else {
              this.app.dataLoading = false;
              this.app.playlist.push(obj);
              this.app.doToast(chrome.i18n.getMessage("added2Queue"));
            }
          }.bind(this));
        } else {
          this.app.getImageFile(
            this.app.buildUrl('getCoverArt', {
              id: sender.attributes.cover.value
            }), sender.attributes.cover.value, function (ev) {
            imgURL = window.URL.createObjectURL(ev.target.result);
            obj.cover = imgURL;
            this.app.colorThiefHandler(imgURL, sender.attributes.cover.value, function (colorArray) {
              obj.palette = colorArray;
            });
            if (this.audio && this.audio.paused) {
              this.app.$.player.getImageForPlayer(imgURL, function () {
                this.app.dataLoading = false;
                this.app.setFabColor(obj);
                this.doPlay(obj);
                this.app.doToast(chrome.i18n.getMessage("added2Queue"));
              }.bind(this));
            } else {
              this.app.dataLoading = false;
              this.app.playlist.push(obj);
              this.app.doToast(chrome.i18n.getMessage("added2Queue"));
            }
          }.bind(this));
        }
      }.bind(this));
    } else {
      imgURL = '../../../images/default-cover-art.png';
      if (this.audio && this.audio.paused) {
        obj.cover = imgURL;
        this.app.$.player.getImageForPlayer(imgURL);
        this.doPlay(obj);
      } else {
        obj.cover = imgURL;
        this.app.playlist.push(obj);
        this.app.doToast(chrome.i18n.getMessage("added2Queue"));
      }
    }
  },

  showingChanged: function () {
    'use strict';
    var fab = document.getElementById('fab');
    if (this.showing === 'podcast') {
      fab.state = 'podcast';
    } else {
      fab.state = "off";
    }
  },

  topOfPage: function () {
    'use strict';
    this.scrollTarget.scrollTop = 0;
  },

  deleteDialog: function (event, detail, sender) {
    'use strict';
    this.app.delID = sender.attributes.ident.value;
    this.app.$.confirmDelete.open();
  },

  deleteChannel: function (id) {
    'use strict';
    this.app.doXhr(this.app.buildUrl('deletePodcastChannel', {
      id: id
    }), 'json', function (e) {
      if (e.target.response['subsonic-response'].status === 'ok') {
        this.clearData(function () {
          this.doAjax();
        }.bind(this));
      }
    }.bind(this));
  },

  refreshContent: function () {
    'use strict';
    if (this.post.offset !== 0) {
      this.post.offset = 0;
    }
    this.clearData(this.doAjax);
  },

  downloadEpisode: function (event, detail, sender) {
    'use strict';
    this.app.doXhr(
      this.app.buildUrl('downloadPodcastEpisode', {
        id: sender.attributes.ident.value
      }), 'json', function (e) {
      if (e.target.response['subsonic-response'].status === 'ok') {
        this.clearData(function () {
          this.doAjax();
          this.app.doToast(chrome.i18n.getMessage("downloadPodcast"));
        }.bind(this));
      }
    }.bind(this));
  },

  episodeDialog: function (event, detail, sender) {
    'use strict';
    this.app.delID = sender.attributes.ident.value;
    this.app.$.episodeConfirm.open();
  },

  deleteEpisode: function (id) {
    'use strict';
    this.app.doXhr(
      this.app.buildUrl('deletePodcastEpisode', {
        id: id
      }), 'json', function (e) {
      if (e.target.response['subsonic-response'].status === 'ok') {
        this.clearData(function () {
          this.doAjax();
        }.bind(this));
      }
    }.bind(this));
  },

  toggleCollapse: function (event, detail, sender) {
    'use strict';
    var id = '#' + sender.attributes.ident.value;
    this.$.all.querySelector(id).toggle();
  },

  playSomething: function (id, callback) {
    'use strict';
    var album = this.$.all.querySelector('#' + id);
    album.chooseOption();
    callback();
  },

  findIndexByKeyValue: function (arraytosearch, key, valuetosearch) {
    'use strict';
    var length = arraytosearch.length;
    for (var i = 0; i < length; i = i + 1) {
      if (arraytosearch[i][key] === valuetosearch) {
        return i;
      }
    }
    return null;
  },

  jumpToLetter: function (letter) {
    'use strict';
    this.$.artists.scrollToItem(this.findIndexByKeyValue(this.artist, 'name', letter));
  },

  containsObject: function (obj, list) {
    'use strict';
    var length = list.length;
    for (var i = 0; i < length; i = i + 1) {
      if (list[i].id === obj.id) {
        return true;
      }
    }
    return false;
  }
});

