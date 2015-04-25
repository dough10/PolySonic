/*global Polymer, console, chrome, document, Blob, window, Image, CoreAnimation */
Polymer('album-wall', {
  created: function () {
    'use strict';
    chrome.storage.sync.get(function (res) {
      this.post = {
        f: 'json',
        c: 'PolySonic',
        type: res.sortType || 'newest',
        size: 20,
        offset: 0
      };
      this.request = res.request || 'getAlbumList2';
      this.showing = this.showing || 'cover';
      this.wall = [];
      this.podcast = [];
      this.artists = [];
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
  
  ready: function () {
    /* locale settings */
    'use strict';
    this.noFavoriteHeader = chrome.i18n.getMessage("noFavoriteHeader");
    this.noFavoriteMessage = chrome.i18n.getMessage("noFavoriteMessage");
    this.addContent = chrome.i18n.getMessage("addContent");
    this.addAlbums = chrome.i18n.getMessage("addAlbums");
    this.addPodcast = chrome.i18n.getMessage("addPodcast");
    this.foundHere = chrome.i18n.getMessage("foundHere");
    this.deleteLabel = chrome.i18n.getMessage("deleteLabel");
    this.$.cover.grid = true;
    this.$.cover.width = '260';
    this.$.cover.height = '260';
    this.$.list.grid = false;
    this.$.list.width = '605';
    this.$.list.heioght = '65';
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
    'use strict';
    if (this.mediaFolder !== 0) {
      this.post.musicFolderId = this.mediaFolder;
    } else {
      delete this.post.musicFolderId;
    }
    this.refreshContent();
    this.tmpl.pageLimit = false;
    this.$.threshold.clearLower();
    this.tmpl.closeDrawer();
  },
  
  clearData: function (callback) {
    'use strict';
    this.isLoading = true;
    this.tmpl.dataLoading = true;
    if (this.scrollTarget) {
      this.scrollTarget.scrollTop = 0;
    }
    this.artists = null;
    this.artists = [];
    this.wall = null;
    this.wall = [];
    this.podcast = null;
    this.podcast = [];
    this.async(function () {
      callback();
    });
  },
  
  responseChanged: function () {
    'use strict';
    var callback = function () {
        this.async(function () {
          this.tmpl.dataLoading = false;
          this.tmpl.showApp();
        });
      }.bind(this),
      i = 0,
      wall = this.wall,
      response;
    if (this.response) {
      response = this.response['subsonic-response'];
      if (response.status === 'failed') {
        console.log(response.error.message);
        this.tmpl.doToast(response.error.message);
      } else {
        this.async(function () {
          if (response.albumList2 && response.albumList2.album) {
            Array.prototype.forEach.call(response.albumList2.album, function (e) {
              var obj = {id: e.id, coverArt: e.coverArt, artist: e.artist, name: e.name, starred: e.starred, url: this.url, user: this.user, pass: this.pass, version: this.version, bitRate: this.bitRate};
              wall.push(obj);
              i = i + 1;
              if (i === response.albumList2.album.length) {
                callback();
              }
            }.bind(this));
          } else if (response.albumList && response.albumList.album) {
            Array.prototype.forEach.call(response.albumList.album, function (e) {
              var obj = {id: e.id, coverArt: e.coverArt, artist: e.artist, name: e.name, starred: e.starred, url: this.url, user: this.user, pass: this.pass, version: this.version, bitRate: this.bitRate};
              wall.push(obj);
              i = i + 1;
              if (i === response.albumList.album.length) {
                callback();
              }
            }.bind(this));
          } else if (response.starred2 && response.starred2.album) {
            Array.prototype.forEach.call(response.starred2.album, function (e) {
              var obj = {id: e.id, coverArt: e.coverArt, artist: e.artist, name: e.name, starred: e.starred, url: this.url, user: this.user, pass: this.pass, version: this.version, bitRate: this.bitRate};
              wall.push(obj);
              i = i + 1;
              if (i === response.starred2.album.length) {
                callback();
              }
            }.bind(this));
          } else if (response.starred && response.starred.album) {
            Array.prototype.forEach.call(response.starred.album, function (e) {
              var obj = {id: e.id, coverArt: e.coverArt, artist: e.artist, name: e.name, starred: e.starred, url: this.url, user: this.user, pass: this.pass, version: this.version, bitRate: this.bitRate};
              wall.push(obj);
              i = i + 1;
              if (i === response.starred.album.length) {
                callback();
              }
            }.bind(this));
          } else if (response.podcasts && response.podcasts.channel) {
            Array.prototype.forEach.call(response.podcasts.channel, function (e) {
              var art = e.episode[0].coverArt,
                obj = {title: e.title, episode: e.episode, id: e.id, status: e.status};
              this.podcast.push(obj);
              i = i + 1;
              if (i === response.podcasts.channel.length) {
                callback();
              }
            }.bind(this));
          } else if (response.artists) {
            Array.prototype.forEach.call(response.artists.index, function (e) {
              var obj = {name: e.name, artist: e.artist};
              this.artists.push(obj);
              i = i + 1;
              if (i === response.artists.index.length) {
                callback();
              }
            }.bind(this));
          } else {
            this.tmpl.pageLimit = true;
          }
        });
      }
    }
  },
  
  artistDetails: function (event, detail, sender) {
    'use strict';
    var artist = document.getElementById("aDetails");
    this.tmpl.dataLoading = true;
    artist.artistId = sender.attributes.ident.value;
    artist.queryData();
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
      this.showing = 'podcast';
      chrome.storage.sync.set({
        'sortType': this.post.type,
        'request': this.request,
        'mediaFolder': this.mediaFolder
      });
      this.async(function () {
        this.$.ajax.go();
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
      this.showing = this.listMode;
      chrome.storage.sync.set({
        'sortType': this.post.type,
        'request': this.request,
        'mediaFolder': this.mediaFolder
      });
      this.async(function () {
        this.$.ajax.go();
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
      this.showing = 'artists';
      chrome.storage.sync.set({
        'sortType': this.post.type,
        'request': this.request,
        'mediaFolder': this.mediaFolder
      });
      this.async(function () {
        this.$.ajax.go();
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
      this.showing = this.listMode;
      chrome.storage.sync.set({
        'sortType': this.post.type,
        'request': this.request,
        'mediaFolder': this.mediaFolder
      });
      this.async(function () {
        this.$.ajax.go();
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
      this.tmpl.doToast(chrome.i18n.getMessage("connectionError"));
    }
  },
  
  loadMore: function () {
    'use strict';
    this.async(function () {
      this.$.threshold.clearLower();
      if (!this.isLoading && this.request !== 'getStarred2' && this.request !== 'getPodcasts' && this.request !== 'getArtists' && !this.tmpl.pageLimit && this.tmpl.page === 0) {
        this.isLoading = true;
        this.post.offset = parseInt(this.post.offset, 10) + parseInt(this.post.size, 10);
        this.$.ajax.go();
      }
    });
  },
  
  querySizeChanged: function () {
    'use strict';
    this.post.size = this.querySize;
  },
  
  listModeChanged: function () {
    'use strict';
    if (this.listMode) {
      this.async(function () {
        if (this.request !== 'getArtists' && this.request !== 'getPodcasts') {
          if (this.listMode === 'cover') {
            this.showing = 'cover';
          } else {
            this.showing = 'list';
          }
          this.tmpl.dataLoading = false;
        }
      });
    }
  },
  
  getPaletteFromDb: function (id, callback) {
    'use strict';
    this.tmpl.getDbItem(id + '-palette', function (e) {
      callback(e.target.result);
    }.bind(this));
  },

  doPlay: function (obj, url) {
    'use strict';
    this.tmpl.playlist = [obj];
    this.tmpl.playing = 0;
    this.tmpl.playAudio('', obj.title, url, obj.cover, obj.id);
  },
  
  playPodcast: function (event, detial, sender) {
    'use strict';
    this.async(function () {
      var artURL = this.url + "/rest/getCoverArt.view?u=" + this.user + "&p=" + this.pass + "&v=" + this.version + "&c=PolySonic&id=" + sender.attributes.cover.value,
        url = this.url + '/rest/stream.view?u=' + this.user + '&p=' + this.pass + '&v=' + this.version + '&c=PolySonic&format=raw&estimateContentLength=true&id=' + sender.attributes.streamId.value,
        imgURL,
        obj;

      if (sender.attributes.cover.value) {
        /* look for image in indexeddb */
        this.tmpl.getDbItem(sender.attributes.cover.value, function (ev) {
          if (ev.target.result) {
            var imgFile = ev.target.result;
            imgURL = window.URL.createObjectURL(imgFile);
            obj = {id: sender.attributes.streamId.value, artist: '', title: sender.attributes.title.value, cover: imgURL};
            this.tmpl.getImageForPlayer(imgURL, function () {
              this.getPaletteFromDb(sender.attributes.cover.value, function (palette) {
                obj.palette = palette;
                this.setFabColor(palette);
                this.doPlay(obj, url);
              }.bind(this));
            }.bind(this));
          } else {
            this.tmpl.getImageFile(artURL, sender.attributes.cover.value, function (ev) {
              var imgFile = ev.target.result;
              imgURL = window.URL.createObjectURL(imgFile);
              obj = {id: sender.attributes.streamId.value, artist: '', title: sender.attributes.title.value, cover: imgURL};
              this.tmpl.getImageForPlayer(imgURL, function () {
                this.getColorPalette(sender.attributes.cover.value, imgURL, function (array) {
                  obj.palette = array;
                  this.setFabColor(array);
                  this.doPlay(obj, url);
                }.bind(this));
              }.bind(this));
            }.bind(this));
          }
        }.bind(this));
      } else {
        imgURL = '../../../images/default-cover-art.png';
        obj = {id: sender.attributes.streamId.value, artist: '', title: sender.attributes.title.value, cover: imgURL};
        this.tmpl.getImageForPlayer(imgURL);
        this.doPlay(obj, url);
      }
      this.tmpl.page = 1;
    });
  },
  
  getColorPalette: function (id, imgURL, callback) {
    'use strict';
    var imgElement = new Image();
    imgElement.src = imgURL;
    imgElement.onload = function () {
      var color = this.tmpl.getColor(imgElement),
        array = [],
        r = color[1][0],
        g = color[1][1],
        b = color[1][2],
        hex = this.tmpl.rgbToHex(r, g, b);

      /*
        array[0] fab color

        array[1] fab contrasting color

        array[2] progress bar buffering color

        array[3] progress bar background
      */
      array[0] = 'rgb(' + r + ',' + g + ',' + b + ');';
      array[1] = this.tmpl.getContrast50(hex);
      array[2] = 'rgba(' + r + ',' + g + ',' + b + ',0.5);';
      if (array[1] !== 'white') {
        array[3] = '#444444';
      } else {
        array[3] = '#c8c8c8';
      }
      this.tmpl.putInDb(array, id + '-palette', function () {
        callback(array);
        console.log('Color palette saved ' + id);
      }.bind(this));
    }.bind(this);
  },

  setFabColor: function (array) {
    'use strict';
    if (this.colorThiefEnabled && array) {
      this.tmpl.colorThiefFab = array[0];
      this.tmpl.colorThiefFabOff = array[1];
      this.tmpl.colorThiefBuffered = array[2];
      this.tmpl.colorThiefProgBg = array[3];
    }
  },

  add2Playlist: function (event, detial, sender) {
    'use strict';
    var artURL = this.url + "/rest/getCoverArt.view?u=" + this.user + "&p=" + this.pass + "&v=" + this.version + "&c=PolySonic&id=" + sender.attributes.cover.value,
      imgURL,
      obj,
      url = this.url + '/rest/stream.view?u=' + this.user + '&p=' + this.pass + '&v=' + this.version + '&c=PolySonic&format=raw&estimateContentLength=true&id=' + sender.attributes.streamId.value;

    if (sender.attributes.cover.value) {
      /* look for image in indexeddb */
      this.tmpl.getDbItem(sender.attributes.cover.value, function (ev) {
        if (ev.target.result) {
          var imgFile = ev.target.result;
          imgURL = window.URL.createObjectURL(imgFile);
          obj = {id: sender.attributes.streamId.value, artist: '', title: sender.attributes.title.value, cover: imgURL};
          this.getPaletteFromDb(sender.attributes.cover.value, function (palette) {
            obj.palette = palette;
          }.bind(this));
          if (this.audio.paused) {
            this.tmpl.getImageForPlayer(imgURL, function () {
              this.setFabColor(obj.palette);
              this.doPlay(obj, url);
            }.bind(this));
          } else {
            this.tmpl.playlist.push(obj);
            this.tmpl.doToast(chrome.i18n.getMessage("added2Queue"));
          }
        } else {
          this.tmpl.getImageFile(artURL, sender.attributes.cover.value, function (ev) {
            var imgFile = ev.target.result;
            imgURL = window.URL.createObjectURL(imgFile);
            obj = {id: sender.attributes.streamId.value, artist: '', title: sender.attributes.title.value, cover: imgURL};
            this.getColorPalette(sender.attributes.cover.value, imgURL, function (array) {
              obj.palette = array;
            }.bind(this));
            if (this.audio.paused) {
              this.tmpl.getImageForPlayer(imgURL, function () {
                this.setFabColor(obj.palette);
                this.doPlay(obj, url);
              }.bind(this));
            } else {
              this.tmpl.playlist.push(obj);
              this.tmpl.doToast(chrome.i18n.getMessage("added2Queue"));
            }
          }.bind(this));
        }
      }.bind(this));
    } else {
      imgURL = '../../../images/default-cover-art.png';
      if (this.audio.paused) {
        obj = {id: sender.attributes.streamId.value, artist: '', title: sender.attributes.title.value, cover: imgURL};
        this.tmpl.getImageForPlayer(imgURL);
        this.doPlay(obj, url);
      } else {
        obj = {id: sender.attributes.streamId.value, artist: '', title: sender.attributes.title.value, cover: imgURL};
        this.tmpl.playlist.push(obj);
        this.tmpl.doToast(chrome.i18n.getMessage("added2Queue"));
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
    this.async(function () {
      this.scrollTarget.scrollTop = 0;
    });
  },
  
  deleteDialog: function (event, detail, sender) {
    'use strict';
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
    'use strict';
    if (this.post.offset !== 0) {
      this.post.offset = 0;
    }
    this.clearData(function () {
      this.$.ajax.go();
    }.bind(this));
  },
  
  downloadEpisode: function (event, detail, sender) {
    'use strict';
    var url = this.url + "/rest/downloadPodcastEpisode.view?u=" + this.user + "&p=" + this.pass + "&f=json&v=" + this.version + "&c=PolySonic&id=" + sender.attributes.ident.value;
    this.tmpl.doXhr(url, 'json', function (e) {
      if (e.target.response['subsonic-response'].status === 'ok') {
        this.clearData(function () {
          this.$.ajax.go();
          this.tmpl.doToast(chrome.i18n.getMessage("downloadPodcast"));
        }.bind(this));
      }
    }.bind(this));
  },
  
  episodeDialog: function (event, detail, sender) {
    'use strict';
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
    'use strict';
    var id = '#' + sender.attributes.ident.value;
    this.$.all.querySelector(id).toggle();
  },
  
  playSomething: function (id, callback) {
    'use strict';
    var album = this.$.all.querySelector('#' + id);
    album.doPlayback();
    this.async(function () {
      callback();
    });
  },
  
  jumpToLetter: function (letter) {
    'use strict';
    var i, item, findIndexByKeyValue = function (arraytosearch, key, valuetosearch) {
      for (i = 0; i < arraytosearch.length; i = i + 1) {
        if (arraytosearch[i][key] === valuetosearch) {
          return i;
        }
      }
      return null;
    };
    item = findIndexByKeyValue(this.artists, 'name', letter);
    this.$.artists.scrollToItem(item);
  }
});

