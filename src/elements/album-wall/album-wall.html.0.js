/*global Polymer, console, chrome, document, Blob, window, Image, CoreAnimation */
(function () {
  'use strict';

  var app = document.getElementById("tmpl");

  Polymer('album-wall', {
    wall: [],
    podcast: [],
    artist: [],

    ready: function () {
      this.showing = this.showing || 'wall';
      this.queryMethod = this.queryMethod || 'ID3';
    },

    _attemptRefresh: function () {
      this.async(this._attemptRefresh, null, 120000);
      if (this.showing === 'podcast') {
        var url = this.$.globals.buildUrl('getPodcasts');
        this.$.globals.doXhr(url, 'json').then(function (e) {
          this.response = e.target.response;
        }.bind(this));
      }
    },

    domReady: function () {
      this.app = app;
      this.audio = this.app.$.player.audio;
      this.scrollTarget = this.app.appScroller();
      this._attemptRefresh();
    },

    mediaFolderChanged: function (oldVal, newVal) {
      this.async(function () {
        this.$.globals.closeDrawer().then(function () {
          if (newVal === 'none') {
            delete this.post.musicFolderId;
          } else {
            this.post.musicFolderId = Number(newVal);
          }
          this.app.pageLimit = false;
          this.$.threshold.clearLower();
          this.async(this.refreshContent);
        }.bind(this));
      });
    },

    clearData: function (callback) {
      this.wall = [];
      this.artist = [];
      this.podcast = [];
      this.app.pageLimit = false;
      this.isLoading = true;
      this.app.dataLoading = true;
      this.async(function () {
        this.$.list.updateSize();
        this.$.podcast.updateSize();
        this.$.artists.updateSize();
      });
      this.async(callback, null, 200);
    },

    responseCallback: function () {
      this.app.dataLoading = false;
      this.isLoading = false;
      this.app.showApp();
    },

    responseChanged: function () {
      if (this.response && 'subsonic-response' in this.response) {
        this.async(function responseCallback() {
          var response = this.response['subsonic-response'];
          if (response.status === 'failed') {
            console.log(response.error.message);
            this.$.globals.makeToast(response.error.message);
          } else {
            if (response.albumList2 && response.albumList2.album) {
              this.wall = this.wall.concat(response.albumList2.album);
              for (var i = 0; i < this.wall.length; i++) {
                this.wall[i].listMode = this.listMode;
              }
              this.showing = 'wall';
              this.async(this.responseCallback);
            } else if (response.albumList && response.albumList.album) {
              this.wall = this.wall.concat(response.albumList.album);
              for (var i = 0; i < this.wall.length; i++) {
                this.wall[i].listMode = this.listMode;
              }
              this.showing = 'wall';
              this.async(this.responseCallback);
            } else if (response.starred2 && response.starred2.album) {
              this.wall = this.wall.concat(response.starred2.album);
              for (var i = 0; i < this.wall.length; i++) {
                this.wall[i].listMode = this.listMode;
              }
              this.showing = 'wall';
              this.async(this.responseCallback);
            } else if (response.starred && response.starred.album) {
              this.wall = this.wall.concat(response.starred.album);
              for (var i = 0; i < this.wall.length; i++) {
                this.wall[i].listMode = this.listMode;
              }
              this.showing = 'wall';
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
              }
              this.podcast = podcasts;
              this.async(this.responseCallback);
              this.showing = 'podcast';
            } else if (response.artists && response.artists.index) {
              this.artist = response.artists.index;
              this.showing = 'artists';
              this.async(this.responseCallback);
            } else if (response.searchResult3 && response.searchResult3.album) {
              /* filter out duplicate albums from response array */
              var data = response.searchResult3.album;
              var length2 = data.length;
              var tmpArray = [];
              for  (var i = 0; i < length2; i++) {
                if (!this.containsObject(data[i], tmpArray)) {
                  tmpArray.push(data[i]);
                }
              }
              this.wall = tmpArray;
              for (var i = 0; i < this.wall.length; i++) {
                this.wall[i].listMode = this.listMode;
              }
              this.showing = 'wall';
              this.async(this.responseCallback);
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
      var artist = document.getElementById("aDetails");
      this.app.dataLoading = true;
      artist.artistId = sender.attributes.ident.value;
      artist.queryData();
    },

    listModeChanged: function () {
      this.async(function () {
        if (this.listMode) {
          if (this.request !== 'getArtists' && this.request !== 'getPodcasts') {
            this.app.dataLoading = true;
            for (var i = 0; i < this.wall.length; i++) {
              this.wall[i].listMode = this.listMode;
            }
            switch (this.listMode) {
              case 'cover':
                this.$.list.width = '260';
                this.$.list.grid = true;
                this.$.list.height = '260';
                break;
              case 'list':
                this.$.list.grid = false;
                this.$.list.width = chrome.app.window.current().innerBounds.width;
                this.$.list.height = '60';
                break;
            }
            this.app.dataLoading = false;
          }
        }
      });
    },

    doAjax: function () {
      this.async(function () {
        this.request = this.request || 'getAlbumList2';
        this.post = this.post || {
          type: 'newest',
          size: 60,
          offset: 0
        };
        this.$.ajax.url = this.$.globals.buildUrl(this.request, this.post);
        this.$.ajax.go();
      });
    },

    getPodcast: function () {
      this.showing = 'podcast';
      this.clearData(function podcastCallback() {
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
      this.showing = 'wall';
      this.clearData(function starredCallback() {
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
      this.clearData(function artistSearch() {
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
      this.showing = 'wall';
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
      if (this.error) {
        console.error(this.error);
        this.$.globals.makeToast(chrome.i18n.getMessage("connectionError"));
      }
    },

    loadMore: function () {
      this.$.threshold.clearLower();
      if (!this.isLoading && this.request !== 'getStarred2' && this.request !== 'getPodcasts' && this.request !== 'getArtists' && !this.app.pageLimit && this.app.page === 0) {
        this.isLoading = true;
        console.count('lazy load');
        this.post.offset = parseInt(this.post.offset, 10) + parseInt(this.post.size, 10);
        this.async(this.doAjax);
      }
    },

    querySizeChanged: function () {
      this.post.size = this.querySize;
    },

    getPaletteFromDb: function (id, callback) {
      this.app.getDbItem(id + '-palette', function (e) {
        callback(e.target.result);
      }.bind(this));
    },

    doPlay: function (obj) {
      this.app.playlist = [obj];
      this.app.dataLoading = false;
      this.$.globals.playListIndex(0);
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
      this.bookmarkTime = this.$.globals.secondsToMins(sender.attributes.bookmark.value / 1000);
    },

    playPodcast: function (event, detial, sender) {
      this.app.dataLoading = true;
      var imgURL,
        obj = {
          id: sender.attributes.streamId.value,
          artist: '',
          artist: '',
          title: sender.attributes.trackTitle.value,
        };
      if (sender.attributes.bookmark) {
        obj.bookmarkPosition = sender.attributes.bookmark.value;
      }
      var artId = sender.attributes.cover.value;
      if (artId) {
        this.$.globals.fetchImage(artId).then(function (imgURL) {
          this.async(function () {
            this.$.globals.getDbItem(artId + '-palette').then(function (e) {
              obj.cover = imgURL;
              obj.palette = e.target.result;
              this.doPlay(obj);
            }.bind(this));
          }, null, 200);
        }.bind(this));
      } else {
        obj.cover = '../../../images/default-cover-art.png';
        this.doPlay(obj);
      }
    },

    _openSubsonic: function () {
      window.open(this.app.url);
    },

    conBookDel: function (event) {
      this.delID = event.path[0].dataset.id;
      this.$.bookmarkConfirm.open();
    },

    deleteBookmark: function (event) {
      this.$.globals.doXhr(
        this.$.globals.buildUrl('deleteBookmark', {
          id: this.delID
        }), 'json').then(function (e) {
        if (e.target.response['subsonic-response'].status === 'ok') {
          this.refreshContent();
        } else {
          this.$.globals.makeToast(e.target.response['subsonic-response'].error.message);
        }
      }.bind(this));
    },

    add2Playlist: function (event, detial, sender) {
      var imgURL,
        obj = {
          id: sender.attributes.streamId.value,
          artist: '',
          title: sender.attributes.trackTitle.value,
        };
      this.app.dataLoading = true;
      var artId = sender.attributes.cover.value;
      if (artId) {
        this.$.globals.fetchImage(artId).then(function (imgURL) {
          this.async(function () {
            this.$.globals.getDbItem(artId + '-palette').then(function (e) {
              obj.cover = imgURL;
              obj.palette = e.target.result;
              if ('audio' in this.app.$.player && !this.app.$.player.audio.paused) {
                this.app.dataLoading = false;
                this.app.playlist.push(obj);
                this.$.globals.makeToast(chrome.i18n.getMessage("added2Queue"));
              } else {
                this.app.dataLoading = false;
                this.doPlay(obj);
                this.$.globals.makeToast(chrome.i18n.getMessage("added2Queue"));
              }
            }.bind(this));
          }, null, 200);
        }.bind(this));
      } else {
        imgURL = '../../../images/default-cover-art.png';
        if ('audio' in this.app.$.player && !this.app.$.player.audio.paused) {
          obj.cover = imgURL;
          this.app.playlist.push(obj);
          this.$.globals.makeToast(chrome.i18n.getMessage("added2Queue"));
        } else {
          obj.cover = imgURL;
          this.doPlay(obj);
          this.$.globals.makeToast(chrome.i18n.getMessage("added2Queue"));
        }
      }
    },

    showingChanged: function () {
      var fab = document.getElementById('fab');
      if (this.showing === 'podcast') {
        fab.state = 'podcast';
      } else {
        fab.state = "off";
      }
    },

    topOfPage: function () {
      this.scrollTarget.scrollTop = 0;
    },

    deleteDialog: function (event, detail, sender) {
      this.app.delID = sender.attributes.ident.value;
      this.app.$.confirmDelete.open();
    },

    deleteChannel: function (id) {
      this.$.globals.doXhr(this.$.globals.buildUrl('deletePodcastChannel', {
        id: id
      }), 'json').then(function (e) {
        if (e.target.response['subsonic-response'].status === 'ok') {
          this.clearData(this.doAjax);
        }
      }.bind(this));
    },

    refreshContent: function () {
      if (this.post.offset !== 0) {
        this.post.offset = 0;
      }
      this.clearData(this.doAjax);
    },

    downloadEpisode: function (event, detail, sender) {
      var url = this.$.globals.buildUrl('downloadPodcastEpisode', {
        id: sender.attributes.ident.value
      });
      this.$.globals.doXhr(url, 'json').then(function (e) {
        if (e.target.response['subsonic-response'].status === 'ok') {
          this.clearData(function () {
            this.doAjax();
            this.$.globals.makeToast(chrome.i18n.getMessage("downloadPodcast"));
          }.bind(this));
        }
      }.bind(this));
    },

    episodeDialog: function (event, detail, sender) {
      this.app.delID = sender.attributes.ident.value;
      this.app.$.episodeConfirm.open();
    },

    deleteEpisode: function (id) {
      var url = this.$.globals.buildUrl('deletePodcastEpisode', {
        id: id
      });
      this.$.globals.doXhr(url, 'json').then(function (e) {
        if (e.target.response['subsonic-response'].status === 'ok') {
          this.clearData(this.doAjax);
        }
      }.bind(this));
    },

    toggleCollapse: function (event, detail, sender) {
      var id = '#' + sender.attributes.ident.value;
      this.$.all.querySelector(id).toggle();
    },

    playSomething: function (id, callback) {
      var album = this.$.all.querySelector('#' + id);
      album.chooseOption();
      callback();
    },

    findIndexByKeyValue: function (arraytosearch, key, valuetosearch) {
      var length = arraytosearch.length;
      for (var i = 0; i < length; i = i + 1) {
        if (arraytosearch[i][key] === valuetosearch) {
          return i;
        }
      }
      return null;
    },

    jumpToLetter: function (letter) {
      var item = this.findIndexByKeyValue(this.artist, 'name', letter);
      this.$.artists.scrollToItem(item);
    },

    containsObject: function (obj, list) {
      var length = list.length;
      for (var i = 0; i < length; i = i + 1) {
        if (list[i].id === obj.id) {
          return true;
        }
      }
      return false;
    }
  });
})();

