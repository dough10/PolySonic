Polymer('album-wall', {
  created: function () {
    'use strict';
    chrome.storage.sync.get(function (res) {
      this.post = {
        f: 'json',
        c: 'PolySonic',
        type: res.sortType || 'newest',
        size: 20,
        offset: 0,
      };
      this.request = res.request || 'getAlbumList2';
      this.showing = this.showing || 'cover';
      this.wall = [];
      this.podcast = [];
      this.artists = [];
      this.queryMethod = this.queryMethod || 'ID3';
      if (res.request === 'getPodcasts') {
        this.showing = 'podcast';
        this.getPodcast();
      } else if (res.request === 'getStarred2') {
        this.showing = 'cover';
        this.getStarred();
      } else if (res.request === 'getArtists') {
        this.showing = 'artists';
        this.getArtist();
      }
    }.bind(this));
  },
  domReady: function () {
    'use strict';
    this.tmpl = document.getElementById("tmpl");
    this.audio = document.getElementById("audio");
    this.scrollTarget = this.tmpl.appScroller();
  },
  userChanged: function () {
    'use strict';
    this.post.u = this.user;
  },
  passChanged: function () {
    'use strict';
    this.post.p = this.pass;
  },
  versionChanged: function () {
    'use strict';
    if (this.version) {
      this.post.v = this.version;
    }
  },
  mediaFolderChanged: function () {
    if (this.mediaFolder !== 0) {
      this.post.musicFolderId = this.mediaFolder;
    } else {
      delete this.post.musicFolderId;
    }
    this.refreshContent();
  },
  clearData: function (callback) {
    'use strict';
    if (this.scrollTarget) {
      this.scrollTarget.scrollTop = 0;
    }
    this.artists = null;
    this.artists = [];
    this.wall = null;
    this.wall = [];
    this.podcast = null;
    this.podcast = [];
    callback();
  },
  responseChanged: function () {
    'use strict';
    if (this.response) {
      var wall = this.wall,
        response = this.response['subsonic-response'];

      if (response.albumList2 && response.albumList2.album) {
        Array.prototype.forEach.call(response.albumList2.album, function (e) {
          var obj = {id: e.id, coverArt: e.coverArt, artist: e.artist, name: e.name, starred: e.starred, url: this.url, user: this.user, pass: this.pass, version: this.version, bitRate: this.bitRate};
          wall.push(obj);
        }.bind(this));
      } else if (response.albumList && response.albumList.album) {
        Array.prototype.forEach.call(response.albumList.album, function (e) {
          var obj = {id: e.id, coverArt: e.coverArt, artist: e.artist, name: e.name, starred: e.starred, url: this.url, user: this.user, pass: this.pass, version: this.version, bitRate: this.bitRate};
          wall.push(obj);
        }.bind(this));
      } else if (response.starred2 && response.starred2.album) {
        Array.prototype.forEach.call(response.starred2.album, function (e) {
          var obj = {id: e.id, coverArt: e.coverArt, artist: e.artist, name: e.name, starred: e.starred, url: this.url, user: this.user, pass: this.pass, version: this.version, bitRate: this.bitRate};
          wall.push(obj);
        }.bind(this));
      } else if (response.starred && response.starred.album) {
        Array.prototype.forEach.call(response.starred.album, function (e) {
          var obj = {id: e.id, coverArt: e.coverArt, artist: e.artist, name: e.name, starred: e.starred, url: this.url, user: this.user, pass: this.pass, version: this.version, bitRate: this.bitRate};
          wall.push(obj);
        }.bind(this));
      } else if (response.podcasts && response.podcasts.channel) {
        Array.prototype.forEach.call(response.podcasts.channel, function (e) {
          var art = e.episode[0].coverArt,
            obj = {title: e.title, episode: e.episode, id: e.id, status: e.status};
          this.podcast.push(obj);
        }.bind(this));
      } else if (response.artists) {
        Array.prototype.forEach.call(response.artists.index, function (e) {
          var obj = {name: e.name, artist: e.artist};
          this.artists.push(obj);
        }.bind(this));
      } else {
        tmpl.pageLimit = true;
      }
      if (response.status === 'failed') {
        console.log(response.error.message);
        this.tmpl.doToast(response.error.message);
      }
      this.tmpl.showApp();
    }
  },
  doAjax: function () {
    'use strict';
    this.$.ajax.go();
  },
  getPodcast: function () {
    'use strict';
    this.clearData(function () {
      this.tmpl.pageLimit = false;
      this.request = 'getPodcasts';
      this.post.type = '';
      this.post.offset = 0;
      this.$.ajax.go();
      this.showing = 'podcast';
      chrome.storage.sync.set({
        'sortType': this.post.type,
        'request': this.request,
        'mediaFolder': this.mediaFolder
      });
    }.bind(this));
  },
  getStarred: function () {
    'use strict';
    this.clearData(function () {
      this.tmpl.pageLimit = false;
      if (this.queryMethod === 'ID3') {
        this.request = 'getStarred2';
      } else {
        this.request = 'getStarred';
      }
      this.post.type = '';
      this.post.offset = 0;
      this.$.ajax.go();
      this.showing = 'cover';
      chrome.storage.sync.set({
        'sortType': this.post.type,
        'request': this.request,
        'mediaFolder': this.mediaFolder
      });
    }.bind(this));
  },
  getArtist: function () {
    'use strict';
    this.clearData(function () {
      this.tmpl.pageLimit = false;
      this.request = 'getArtists';
      this.post.type = '';
      this.post.offset = 0;
      this.$.ajax.go();
      this.showing = 'artists';
      chrome.storage.sync.set({
        'sortType': this.post.type,
        'request': this.request,
        'mediaFolder': this.mediaFolder
      });
    }.bind(this));
  },
  sortChanged: function () {
    'use strict';
    this.clearData(function () {
      this.tmpl.pageLimit = false;
      if (this.queryMethod === 'ID3') {
        this.request = 'getAlbumList2';
      } else {
        this.request = 'getAlbumList';
      }
      this.post.type = this.sort;
      this.post.offset = 0;
      this.$.ajax.go();
      this.showing = 'cover';
      chrome.storage.sync.set({
        'sortType': this.post.type,
        'request': this.request,
        'mediaFolder': this.mediaFolder
      });
    }.bind(this));
  },
  resizeLists: function () {
    'use strict';
    this.$.list.updateSize();
    this.$.podcast.updateSize();
    this.$.artists.updateSize();
  },
  errorChanged: function () {
    'use strict';
    if (this.error) {
      console.log(this.error);
      this.tmpl.doToast(this.error);
    }
  },
  loadMore: function () {
    'use strict';
    this.$.threshold.clearLower();
    if (!this.isLoading && this.request !== 'getStarred2' && this.request !== 'getPodcasts' && this.request !== 'getArtists' && !this.tmpl.pageLimit && this.tmpl.page === 0) {
      this.isLoading = true;
      this.tmpl.doToast('Loading..');
      this.post.offset = parseInt(this.post.offset, 10) + parseInt(this.post.size, 10);
      this.$.ajax.go();
    }
  },
  querySizeChanged: function () {
    'use strict';
    this.post.size = this.querySize;
  },
  listModeChanged: function () {
    'use strict';
    this.$.list.updateSize();
    if (this.listMode === 'cover') {
      this.$.list.grid = true;
      this.$.list.width = '260';
      this.$.list.height = '260';
    } else {
      this.$.list.grid = false;
      this.$.list.width = '605';
      this.$.list.heioght = '65';
    }
  },
  artistDetails: function (event, detail, sender) {
    var artist = document.getElementById("aDetails");
    this.tmpl.setScrollerPos();
    artist.artistId = sender.attributes.ident.value;
    artist.queryData();
    this.tmpl.page = 4;
  },
  doPlay: function (obj, url) {
    this.tmpl.playlist = [obj];
    this.tmpl.playing = 0;
    this.tmpl.playAudio('', obj.title, url, obj.cover);
  },
  playPodcast: function (event, detial, sender) {
    'use strict';
    var artURL = this.url + "/rest/getCoverArt.view?u=" + this.user + "&p=" + this.pass + "&v=" + this.version + "&c=PolySonic&id=" + sender.attributes.cover.value,
        url = this.url + '/rest/stream.view?u=' + this.user + '&p=' + this.pass + '&v=' + this.version + '&c=PolySonic&format=raw&estimateContentLength=true&id=' + sender.attributes.streamId.value,
        imgURL,
        obj;
    if (sender.attributes.cover.value) {
      this.tmpl.checkForImage(sender.attributes.cover.value, function (e) {
        if (e.target.result === 0) {
          this.tmpl.getImageFile(artURL, sender.attributes.cover.value, function (ev) {
            var imgFile = ev.target.result;
            imgURL = window.URL.createObjectURL(imgFile);
            obj = {id: sender.attributes.streamId.value, artist: '', title: sender.attributes.title.value, cover: imgURL};
            this.tmpl.getImageForPlayer(imgURL);
            this.doPlay(obj, url);
            this.tmpl.calculateStorageSize();
          }.bind(this));
        } else {
          this.tmpl.getDbItem(sender.attributes.cover.value, function (ev) {
            var imgFile = ev.target.result;
            imgURL = window.URL.createObjectURL(imgFile);
            obj = {id: sender.attributes.streamId.value, artist: '', title: sender.attributes.title.value, cover: imgURL};
            this.tmpl.getImageForPlayer(imgURL);
            this.doPlay(obj, url);
          }.bind(this));
        }
      }.bind(this));
    } else {
      obj = {id: sender.attributes.streamId.value, artist: '', title: sender.attributes.title.value, cover: imgURL};
      this.tmpl.defaultPlayImage();
      this.doPlay(obj, url);
    }
    this.tmpl.page = 1;
  },
  add2Playlist: function (event, detial, sender) {
    'use strict';
    var artURL = this.url + "/rest/getCoverArt.view?u=" + this.user + "&p=" + this.pass + "&v=" + this.version + "&c=PolySonic&id=" + sender.attributes.cover.value,
        imgURL,
        obj,
        url = this.url + '/rest/stream.view?u=' + this.user + '&p=' + this.pass + '&v=' + this.version + '&c=PolySonic&format=raw&estimateContentLength=true&id=' + sender.attributes.streamId.value;
    if (sender.attributes.cover.value) {
      this.tmpl.checkForImage(sender.attributes.cover.value, function (e) {
        if (e.target.result === 0) {
          this.tmpl.getImageFile(artURL, sender.attributes.cover.value, function (ev) {
            var imgFile = ev.target.result;
            imgURL = window.URL.createObjectURL(imgFile);
            if (this.audio.paused) {
              obj = {id: sender.attributes.streamId.value, artist: '', title: sender.attributes.title.value, cover: imgURL};
              this.tmpl.getImageForPlayer(imgURL);
              this.doPlay(obj, url);
            } else {
              obj = {id: sender.attributes.streamId.value, artist: '', title: sender.attributes.title.value, cover: imgURL};
              this.tmpl.playlist.push(obj);
            }
          }.bind(this));
        } else {
          this.tmpl.getDbItem(sender.attributes.cover.value, function (ev) {
            var imgFile = ev.target.result;
            imgURL = window.URL.createObjectURL(imgFile);
            if (this.audio.paused) {
              obj = {id: sender.attributes.streamId.value, artist: '', title: sender.attributes.title.value, cover: imgURL};
              this.tmpl.getImageForPlayer(imgURL);
              this.doPlay(obj, url);
            } else {
              obj = {id: sender.attributes.streamId.value, artist: '', title: sender.attributes.title.value, cover: imgURL};
              this.tmpl.playlist.push(obj);
            }
          }.bind(this));
        }
      }.bind(this));
    } else {
      imgURL = 'images/default-cover-art.png';
      if (this.audio.paused) {
        obj = {id: sender.attributes.streamId.value, artist: '', title: sender.attributes.title.value, cover: imgURL};
        this.tmpl.getImageForPlayer(imgURL);
        this.doPlay(obj, url);
      } else {
        obj = {id: sender.attributes.streamId.value, artist: '', title: sender.attributes.title.value, cover: imgURL};
        this.tmpl.playlist.push(obj);
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
    this.tmpl.delID = sender.attributes.ident.value;
    this.tmpl.$.confirmDelete.open();
  },
  deleteChannel: function (id) {
    'use strict';
    var url = this.url + "/rest/deletePodcastChannel.view?u=" + this.user + "&p=" + this.pass + "&f=json&v=" + this.version + "&c=PolySonic&id=" + id;
    this.tmpl.doXhr(url, 'json', function (e) {
      if (e.target.response['subsonic-response'].status === 'ok') {
        this.clearData(function () {
          this.$.ajax.go();
        }.bind(this));
      }
    }.bind(this));
  },
  refreshContent: function () {
    if (this.post.offset !== 0) {
      this.post.offset = 0;
    }
    this.clearData(function () {
      this.$.ajax.go();
    }.bind(this));
  },
  downloadEpisode: function (event, detail, sender) {
    var url = this.url + "/rest/downloadPodcastEpisode.view?u=" + this.user + "&p=" + this.pass + "&f=json&v=" + this.version + "&c=PolySonic&id=" + sender.attributes.ident.value;
    this.tmpl.doXhr(url, 'json', function (e) {
      if (e.target.response['subsonic-response'].status === 'ok') {
        this.clearData(function () {
          this.$.ajax.go();
          this.tmpl.doToast('Downloading Episode');
        }.bind(this));
      }
    }.bind(this));
  },
  episodeDialog: function (event, detail, sender) {
    this.tmpl.delID = sender.attributes.ident.value;
    this.tmpl.$.episodeConfirm.open();
  },
  deleteEpisode: function (id) {
    'use strict';
    var url = this.url + "/rest/deletePodcastEpisode.view?u=" + this.user + "&p=" + this.pass + "&f=json&v=" + this.version + "&c=PolySonic&id=" + id;
    this.tmpl.doXhr(url, 'json', function (e) {
      if (e.target.response['subsonic-response'].status === 'ok') {
        this.clearData(function () {
          this.$.ajax.go();
        }.bind(this));
      }
    }.bind(this));
  },
  toggleCollapse: function (event, detail, sender) {
    var id = '#' + sender.attributes.ident.value;
    this.$.all.querySelector(id).toggle();
  }
});

