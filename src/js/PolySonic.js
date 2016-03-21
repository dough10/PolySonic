/*global chrome, CryptoJS, console, window, document, XMLHttpRequest, setInterval, screen, analytics, Blob, navigator, Image, CoreAnimation, ColorThief, setTimeout */
(function () {
  'use strict';

  var app = document.querySelector('#tmpl');

  app.scrolling = false;

  // object for shuffle option
  app.shuffleSettings = {};

  // app playlist array
  app.playlist = [];

  // default page
  app.page = app.page || 0;

  // if true lazy load trigger will not needlessly call xhr
  app.pageLimit = false;

  // shuffle size options
  app.shuffleSizes = [
    20,
    40,
    50,
    75,
    100,
    200
  ];

  // menu album sort options
  app.sortTypes = [
    {
      sort: 'newest',
      name: chrome.i18n.getMessage("newButton")
    }, {
      sort: 'alphabeticalByArtist',
      name: chrome.i18n.getMessage("byArtistButton")
    }, {
      sort: 'alphabeticalByName',
      name: chrome.i18n.getMessage("titleButton")
    }, {
      sort: 'frequent',
      name: chrome.i18n.getMessage("frequentButton")
    }, {
      sort: 'recent',
      name: chrome.i18n.getMessage("recentButton")
    }
  ];

  /**
   * convert bytes to a readable form
   * @param {Number} bytes
   */
  function formatBytes(bytes) {
    if (bytes < 1024) return bytes + ' Bytes';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(2) + ' KB';
    else if (bytes < 1073741824) return (bytes / 1048576).toFixed(2) + ' MB';
    else return (bytes / 1073741824).toFixed(2) + ' GB';
  }

  /**
   * display currently used storage on settings menu
   */
  app.calculateStorageSize = function () {
    navigator.webkitPersistentStorage.queryUsageAndQuota(function (used, remaining) {
      app.storageQuota = app.$.globals.texts.diskUsed + ": " + formatBytes(used) + ', ' + app.$.globals.texts.diskRemaining + ": " + formatBytes(remaining);
    }, function (e) {
      console.log('Error', e);
    });
  };

  /**
   * reload the app
   */
  app.reloadApp = function () {
    chrome.runtime.reload();
  };

  /**
   * open download dialog
   */
  app.openDownloads = function () {
    app.$.downloadDialog.open();
  };

  /**
   * close downloads dialog
   */
  app.closeDownloads = function () {
    app.$.downloadDialog.close();
  };


  /**
   * open the app drawer
   */
  app.openPanel = function () {
    app.$.panel.openDrawer();
  };

  /**
   * returns the apps main content scrolling element
   */
  app.appScroller = function () {
    return app.$.headerPanel.scroller;
  };


  /**
   * shuffle the order of a given array
   * @param {Array} array
   */
  function _shuffleArray(array) {
    var currentIndex = array.length, temporaryValue, randomIndex;
    while (0 !== currentIndex) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;
      temporaryValue = array[currentIndex];
      array[currentIndex] = array[randomIndex];
      array[randomIndex] = temporaryValue;
    }
    return array;
  }

  /**
   * shuffle app playlist
   */
  app.shufflePlaylist = function () {
    app.tracker.sendEvent('Playlist Shuffled', new Date());
    var temp = app.playlist[app.playing];
    app.playlist.splice(app.playing, 1);
    _shuffleArray(app.playlist);
    app.playlist.unshift(temp);
    if (app.playing !== 0) {
      app.alreadyPlaying = true; // tell player this track is already playing other wise will start play over again
      app.playing = 0;
    }
  };

  /**
   * open bookmarks dialog
   */
  app.openBookmarks = function () {
    app.$.globals.closeDrawer().then(function () {
      app.$.globals.doXhr(app.$.globals.buildUrl('getBookmarks', ''), 'json').then(function (e) {
        if (e.target.response['subsonic-response'].status === 'ok') {
          app.allBookmarks = e.target.response['subsonic-response'].bookmarks.bookmark;
          app.dataLoading = false;
          app.$.showBookmarks.open();
        } else {
          app.dataLoading = false;
          app.$.globals.makeToast(e.target.response['subsonic-response'].error.message);
        }
      });
    });
  };

  /**
   * que a bookmark
   * @param {Event} event
   */
  app.queBookmark = function (event) {
    var resumePos = event.path[0].dataset.pos;
    app.dataLoading = true;
    var url = app.$.globals.buildUrl('getSong', {
      id: event.path[0].dataset.id
    });
    app.$.globals.doXhr(url, 'json').then(function (e) {
      app.$.showBookmarks.close();
      var song = e.target.response['subsonic-response'].song;
      var obj = {};
      var artId;
      if (song.type === 'music') {
        obj.duration = app.$.globals.secondsToMins(song.duration);
        artId = 'al-' + song.albumId;
      } else {
        artId = song.coverArt;
      }
      obj.id = song.id;
      obj.album = song.album;
      obj.title = decodeURIComponent(song.title);
      obj.artist = (function () {
        if (song.artist === 'Podcast') {
           return '';
        } else {
          return song.artist;
        }
      })();
      obj.bookmarkPosition = song.bookmarkPosition;
      app.$.globals.fetchImage(artId).then(function (imgURL) {
        obj.cover = imgURL;
        app.$.globals.getDbItem(artId + '-palette').then(function (palette) {
          obj.palette = palette.target.result;
          app.dataLoading = false;
          app.playlist = [obj];
          app.$.globals.playListIndex(0);
        });
      });
    });
  };

  /**
   * open bookmark deleting confirmation dialog
   */
  app.conBookDel = function (event) {
    app.$.showBookmarks.close();
    app.delID = event.path[0].dataset.id;
    app.$.bookmarkConfirm.open();
  };

  /**
   * delete a bookmark
   * @param {Event} event
   */
  app.deleteBookmark = function (event) {
    var url = app.$.globals.buildUrl('deleteBookmark', {
      id: app.delID
    });
    app.$.globals.doXhr(url, 'json').then(function (e) {
      if (e.target.response['subsonic-response'].status === 'ok') {
        app.dataLoading = true;
        var refreshUrl = app.$.globals.buildUrl('getBookmarks');
        app.$.globals.doXhr(refreshUrl, 'json').then(function (ev) {
          app.$.showBookmarks.open();
          app.allBookmarks = ev.target.response['subsonic-response'].bookmarks.bookmark;
          app.dataLoading = false;
        });
      } else {
        console.log(e.target.response['subsonic-response']);
        app.$.globals.makeToast(e.target.response['subsonic-response'].error.message);
      }
    });
  };

  /**
   * confirm that the user really does want to delete all bookmarks
   */
  app.confirmDeleteAll = function () {
    if (app.allBookmarks && app.allBookmarks.length) {
      app.$.showBookmarks.close();
      app.$.bookmarkConfirmAll.open();
    }
  };

  /**
   * delete all bookmarks
   */
  app.deleteAllBookmarks = function () {
    for (var i = 0; i < app.allBookmarks.length; i++) {
      (function (id, end) {
        var url = app.$.globals.buildUrl('deleteBookmark', {
          id: id
        });
        app.$.globals.doXhr(url, 'json').then(function (e) {
          if (end) {
            app.dataLoading = true;
            var refreshUrl = app.$.globals.buildUrl('getBookmarks');
            app.$.globals.doXhr(refreshUrl, 'json').then(function (ev) {
              app.$.showBookmarks.open();
              app.allBookmarks = ev.target.response['subsonic-response'].bookmarks.bookmark;
              app.dataLoading = false;
            });
          }
        });
      })(app.allBookmarks[i].entry.id, Boolean(i === app.allBookmarks.length - 1));
    }
  };

  /**
   * close bookmarks dialog
   */
  app.closeBookmarks = function () {
    app.$.showBookmarks.close();
  };

  /**
   * close dialog creation dialog?
   */
  app.closeBookmark = function () {
    app.$.bookmarkDialog.close();
  };

  /**
   * open bookmark creation dialog
   */
  app.createBookmark = function () {
    app.$.player.createBookmark();
  };

  /**
   * submit a bookmark to the server
   */
  app.submitBookmark = function () {
    app.$.player.submitBookmark();
  };

  /**
   * ques playback of a subsonic playlist
   * @param {Event} event
   * @param {Object} detail
   * @param {Object} sender
   */
  app.playPlaylist = function (event, detail, sender) {
    var id = sender.attributes.ident.value;
    app.dataLoading = true;
    app.playlist = null;
    app.playlist = [];
    var playing = false;
    if (app.$.player.audio) {
      app.$.player.audio.pause();
    }
    var url = app.$.globals.buildUrl('getPlaylist', {
      id: id
    });
    app.$.globals.doXhr(url, 'json').then(function (e) {
      var tracks = e.target.response['subsonic-response'].playlist.entry;
      tracks.forEach(function (item) {
        var obj = {
          id: item.id,
          artist: item.artist,
          title: item.title,
          duration: app.$.globals.secondsToMins(item.duration)
        };
        var artId = 'al-' + item.albumId;
        app.$.globals.fetchImage(artId).then(function (imgURL) {
          obj.cover = imgURL;
          app.async(function () {
            app.$.globals.getDbItem(artId + '-palette').then(function (e) {
              obj.palette = e.target.result;
              app.playlist.push(obj);
              if (!playing) {
                playing = true;
                app.dataLoading = false;
                app.closePlaylists();
                app.dataLoading = false;
                app.$.globals.playListIndex(0);
              }
            });
          }, null, 200);
        });
      });
    });
  };

  /**
   * que shuffle playback
   */
  app.shufflePlay = function () {
    app.tracker.sendEvent('Shuffle From Menu', new Date());
    app.dataLoading = true;
    app.shuffleLoading = true;
    app.playlist.length = 0;
    var playing = false;
    if (!app.startYearInvalid && !app.endYearInvalid) {
      if (app.$.player.audio && !app.$.player.audio.paused) {
        app.$.player.audio.pause();
      }
      if (app.shuffleSettings.genre === 0) {
        delete app.shuffleSettings.genre;
      }
      var url = app.$.globals.buildUrl('getRandomSongs', app.shuffleSettings);
      app.$.globals.doXhr(url, 'json').then(function (event) {
        var data = event.target.response['subsonic-response'].randomSongs.song || [];
        if (data.length) {
          data.forEach(function (item) {
            var obj = {
              id: item.id,
              artist: item.artist,
              title: item.title,
              duration: app.$.globals.secondsToMins(item.duration)
            };
            var artId = 'al-' + item.albumId;
            app.$.globals.fetchImage(artId).then(function (imgURL) {
              obj.cover = imgURL;
              app.$.globals.getDbItem(artId + '-palette').then(function (e) {
                obj.palette = e.target.result;
                app.playlist.push(obj);
                if (!playing) {
                  playing = true;
                  console.count('shuffle play');
                  app.dataLoading = false;
                  app.shuffleLoading = false;
                  app.$.shuffleOptions.close();
                  app.$.globals.playListIndex(0);
                }
              });
            });
          });
        } else {
          app.$.globals.makeToast(chrome.i18n.getMessage("noMatch"));
          app.shuffleLoading = false;
          app.dataLoading = false;
        }
      });
    } else {
      app.shuffleLoading = false;
      app.$.globals.makeToast(chrome.i18n.getMessage("invalidEntry"));
    }
  };

  /*
    clear playlist
  */
  app.clearPlaylist = function () {
    app.tracker.sendEvent('Clear Playlist', new Date());
    if (app.$.player.audio && !app.$.player.audio.paused) {
      app.$.player.audio.pause();
    }
    app.$.playlistDialog.close();
    app.page = 0;
    app.playlist = null;
    app.playlist = [];
  };


  /**
   * open volume dialog
  */
  app.toggleVolume = function () {
    app.$.volumeDialog.open();
  };

  /**
   * close volume dialog
   */
  app.closeVolume = function () {
    app.$.volumeDialog.close();
  };

  /**
   * toggle playlist looping
   */
  app.toggleRepeat = function () {
    app.$.player.toggleRepeat();
  };

  /**
   * hide loading screen
   */
  app.showApp = function () {
    var loader = document.getElementById("loader");
    var box = document.getElementById("box");
    if (!loader.classList.contains("hide")) {
      loader.classList.add('hide');
      box.classList.add('hide');
      box.classList.add('hide');
      app.askAnalistics();
    }
  };

  /**
   * request premission for analistics
   */
  app.askAnalistics = function () {
    simpleStorage.getSync().then(function (result) {
      app.service.getConfig().addCallback(
        /** @param {!analytics.Config} config */
        function (config) {
          if (result.analistics === undefined) {
            app.$.analistics.open();
            app.allowAnalistics = function () {
              app.analisticsEnabled = true;
              config.setTrackingPermitted(true);
              simpleStorage.setSync({
                'analistics': true
              });
            };
            app.disAllowAnalistics = function () {
              app.analisticsEnabled = false;
              config.setTrackingPermitted(false);
              simpleStorage.setSync({
                'analistics': false
              });
            };
          } else {
            config.setTrackingPermitted(result.analistics);
            app.analisticsEnabled = result.analistics;
          }
        }
      );
    });
  };

  /**
   * scroll to letter section on artist list
   */
  app.jumpTo = function (event, detail, sender) {
    app.$.wall.jumpToLetter(sender.attributes.it.value);
  };

  /**
   * click handler for items in folder filter list
   * @param {Event} event
   * @param {Object} detail
   * @param {Object} sender
   */
  app.setFolder = function (event, detail, sender) {
    app.folder = sender.attributes.i.value;
    simpleStorage.setSync({
      'mediaFolder': app.folder
    });
  };


  /**
   * open playlist save dialog  set default name to curent time & date
   */
  app.savePlayQueue = function () {
    app.$.playlistDialog.close();
    app.$.createPlaylist.open();
    app.defaultName = new Date().toString();
  };


  /**
   * save a playlist
   */
  app.savePlayQueue2Playlist = function () {
    var url = app.$.globals.buildUrl('createPlaylist', {name: app.defaultName});
    var plength = app.playlist.length;
    app.savingPlaylist = true;
    for (var i = 0; i < plength; i++) {
      url = url + '&songId=' + app.playlist[i].id;
    }
    app.$.globals.doXhr(url, 'json').then(function (e) {
      if (e.target.response['subsonic-response'].status === 'ok') {
        app.$.globals.makeToast(chrome.i18n.getMessage('playlistCreated'));
        app.$.createPlaylist.close();
        app.savingPlaylist = false;
      } else {
        app.$.globals.makeToast(chrome.i18n.getMessage('playlistError'));
        app.savingPlaylist = false;
      }
    });
  };

  /**
   * close playlist creaton dialog
   */
  app.closePlaylistSaver = function () {
    app.$.createPlaylist.close();
  };

  /**
   * FAB click handler
   * @param {Event} event
   * @param {Object} detail
   * @param {Object} sender
   */
  app.doAction = function (event, detail, sender) {
    var scroller = app.appScroller(),
        wall = app.$.wall,
        animation = app.$.globals.attachAnimation(sender);
    if (app.page === 0 && scroller.scrollTop !== 0 && wall.showing !== 'podcast' && app.$.fab.state === 'bottom') {
      scroller.scrollTop = 0;
    }
    if (app.page === 0 && wall.showing === 'podcast') {
      app.$.addPodcast.open();
    }
    if (app.page === 1) {
      app.showPlaylist();
    }
    if (app.page === 0 && app.$.fab.state === 'mid') {
      animation.play();
      wall.playSomething(sender.ident, function () {
        animation.cancel();
      });
    }
    if (app.page === 3) {
      animation.play();
      app.$.aDetails.playSomething(sender.ident, function () {
        animation.cancel();
      });
    }
  };

  /**
   * check key press to see if we should start searching
   */
  app.searchCheck = function (e) {
    if (e.keyIdentifier === "Enter") {
      e.target.blur();
      app.doSearch();
    }
  };

  /**
   * run the search & display results
   */
  app.doSearch = function () {
    if (app.searchQuery) {
      app.$.globals.closeDrawer().then(function () {
        var url = app.$.globals.buildUrl((function () {
          if (app.queryMethod === 'ID3') {
            return'search3';
          } else {
            return 'search2';
          }
        })(), {
          query: encodeURIComponent(app.searchQuery),
          albumCount: 200
        });
        app.$.globals.doXhr(url, 'json').then(function (e) {
          app.dataLoading = true;
          if (e.target.response['subsonic-response'].status === 'ok') {
            app.searchQuery = '';
            var response = e.target.response;
            var resTrimmed = response['subsonic-response'];
            if (resTrimmed.hasOwnProperty('searchResult3') && resTrimmed.searchResult3.album) {
              app.page = 0;
              app.$.wall.response = response;
              app.showing = 'wall';
              app.pageLimit = true;
            } else if (resTrimmed.hasOwnProperty('searchResult2') && resTrimmed.searchResult2.album) {
              app.page = 0;
              app.$.wall.response = response;
              app.showing = 'wall';
              app.pageLimit = true;
            } else {
              app.dataLoading = false;
              app.$.globals.makeToast(chrome.i18n.getMessage('noResults'));
            }
          }
        });
      });
    } else {
      app.$.globals.makeToast(chrome.i18n.getMessage("noSearch"));
    }
  };

  /**
   * open the playlist / play que dialog
   * @param {String} p - just a small string I send with the click to set animation
   */
  app.showPlaylist = function (p) {
    app.$.playlistDialog.transition = (function () {
      if (p) {
        return "core-transition-bottom";
      } else {
        return "core-transition-top";
      }
    })();
    app.$.playlistDialog.toggle();
  };

  /**
   * close the playlist / play que dialog
   */
  app.closePlaylist = function () {
    app.$.playlistDialog.close();
  };

  /**
   * open subsonic playlists dialog
   */
  app.openPlaylists = function () {
    app.$.globals.closeDrawer().then(function ()  {
      app.dataLoading = false;
      app.playlistsLoading = true;
      app.$.globals.doXhr(app.$.globals.buildUrl('getPlaylists', ''), 'json').then(function (e) {
        app.playlistsLoading = false;
        app.playlists = e.target.response['subsonic-response'].playlists.playlist;
        app.$.playlistsDialog.open();
      });
    });
  };

  /**
   * close sudsonic playlists dialog
   */
  app.closePlaylists = function () {
    app.$.playlistsDialog.close();
  };

  /**
   * open playlist delete confirmation dialog
   */
  app.reallyDelete = function (event, detail, sender) {
    app.delID =  sender.attributes.ident.value;
    app.$.playlistsDialog.close();
    app.$.playlistConfirm.open();
  };

  /**
   * send playlist delete command to server
   */
  app.deletePlaylist = function (event, detail, sender) {
    var url = app.$.globals.buildUrl('deletePlaylist', {
      id: sender.attributes.ident.value
    });
    app.$.globals.doXhr(url, 'json').then(function (e) {
      if (e.target.response['subsonic-response'].status === 'ok') {
        app.playlistsLoading = true;
        app.$.globals.doXhr(app.$.globals.buildUrl('getPlaylists', ''), 'json').then(function (e) {
          app.playlistsLoading = false;
          app.playlists = e.target.response['subsonic-response'].playlists.playlist;
          app.$.playlistsDialog.open();
        });
      } else {
        app.$.globals.makeToast(chrome.i18n.getMessage('deleteError'));
      }
    });
  };

  /**
   * close shuffle options dialog
   */
  app.closeShuffleOptions = function () {
    app.$.shuffleOptions.close();
  };

  /**
   * open shuffle options dialog
   */
  app.shuffleOptions = function () {
    app.$.globals.closeDrawer().then(function () {
      var url = app.$.globals.buildUrl('getGenres', '');
      app.$.globals.doXhr(url, 'json').then(function (e) {
        app.genres = e.target.response['subsonic-response'].genres.genre;
        app.genres.sort(function(a, b){
          if(a.value < b.value) return -1;
          if(a.value > b.value) return 1;
          return 0;
        });
        app.dataLoading = false;
        app.$.shuffleOptions.open();
      });
    });
  };

  /**
   * close podcast add dialog
   */
  app.closePodcastDialog = function () {
    app.$.addPodcast.close();
  };

  app.toggleWall = function (e , detail, sender) {
    app.listMode = (function () {
      if (app.listMode === 'cover') {
        return 'list';
      } else {
        return 'cover';
      }
    })();
    simpleStorage.setSync({
      'listMode': app.listMode
    });
    app.tracker.sendEvent('ListMode Changed', app.listMode);
    if (app.page === 3) {
      var id = app.$.aDetails.artistId;
      app.$.aDetails.queryData(id);
    }
    var wallToggles = document.querySelectorAll('.wallToggle');
    for (var i = 0; i < wallToggles.length; i++) {
      if (app.listMode === 'cover') {
        wallToggles[i].icon = 'view-stream';
      } else {
        wallToggles[i].icon = 'view-module';
      }
    }
  };

  /**
   * navigate back to albumd list
   */
  app.back2List = function () {
    app.page = 0;
  };

  /**
   * navigate to now playing page
   */
  app.nowPlaying = function () {
    app.page = 1;
  };

  /**
   * app menu sort option click handler
   * @param {Event} event
   * @param {Object} detail
   * @param {Object} sender
   */
  app.selectAction = function (event, detail, sender) {
    var wall = app.$.wall;
    app.tracker.sendEvent('Sorting By ' + wall.sort, new Date());
    app.$.globals.closeDrawer().then(function () {
      if (wall.sort === sender.attributes.i.value) {
        app.pageLimit = false;
        wall.request = (function () {
          if (app.queryMethod === 'ID3') {
            return 'getAlbumList2';
          } else {
            return 'getAlbumList';
          }
        })();
        wall.post.type = sender.attributes.i.value;
        wall.refreshContent();
        wall.showing = app.listMode;
        wall.$.threshold.clearLower();
      }
      wall.sort = sender.attributes.i.value;
    });
  };

  /**
   * fetch podcasts
   */
  app.getPodcast = function () {
    app.tracker.sendEvent('Showing Podcast', new Date());
    app.page = 0;
    app.$.globals.closeDrawer().then(app.$.wall.getPodcast());
  };

  /**
   * fetch starred albums
   */
  app.getStarred = function () {
    app.tracker.sendEvent('Showing Favorites', new Date());
    app.page = 0;
    app.$.globals.closeDrawer().then(app.$.wall.getStarred());
  };

  /**
   * fetch artist list
   */
  app.getArtist = function () {
    app.tracker.sendEvent('Showing Artist List', new Date());
    app.page = 0;
    app.$.globals.closeDrawer().then(app.$.wall.getArtist());
  };

  /**
   * navigate to settings page
   */
  app.gotoSettings = function () {
    app.tracker.sendEvent('Settings Page', new Date());
    app.$.panel.closeDrawer();
    app.page = 2;
  };

  /**
   * refersh the podcast list
   * @param {Event} event
   * @param {Object} detail
   * @param {Object} sender
   */
  app.refreshPodcast = function (event, detail, sender) {
    var animation = app.$.globals.attachAnimation(sender);
    var url = app.$.globals.buildUrl('refreshPodcasts');
    animation.play();
    app.$.globals.doXhr(url, 'json').then(function (e) {
      animation.cancel();
      if (e.target.response['subsonic-response'].status === 'ok') {
        app.$.wall.refreshContent();
        app.$.globals.makeToast(chrome.i18n.getMessage("podcastCheck"));
      }
    });
  };

  /**
   * add a podcast channel
   */
  app.addChannel = function () {
    app.tracker.sendEvent('Adding Podcast', new Date());
    if (!app.castURL) {
      app.$.globals.makeToast(app.urlError);
    }
    //console.log(app.castURL);
    if (!app.invalidURL) {
      app.addingChannel = true;
      var url = app.$.globals.buildUrl('createPodcastChannel', {
        url: app.castURL
      });
      app.$.globals.doXhr(url, 'json').then(function (e) {
        if (e.target.response['subsonic-response'].status === 'ok') {
          app.addingChannel = false;
          app.$.addPodcast.close();
          app.$.wall.refreshContent();
          app.$.globals.makeToast(chrome.i18n.getMessage("channelAdded"));
          app.castURL = '';
        } else {
          app.$.globals.makeToast(chrome.i18n.getMessage("podcastError"));
        }
      });
    }
  };

  /**
   * delete a podcast channel
   */
  app.doDelete = function (event, detail, sender) {
    app.$.wall.deleteChannel(sender.attributes.ident.value);
  };

  /**
   * delete a podcast episode
   */
  app.deleteEpisode = function (event, detail, sender) {
    app.$.wall.deleteEpisode(sender.attributes.ident.value);
  };

  /**
   * display user license info dialog
   */
  app.getLicense = function (callback) {
    var url = app.$.globals.buildUrl('getLicense');
    app.$.globals.doXhr(url, 'json').then(function (e) {
      var response = e.target.response['subsonic-response'];
      if (response.status === 'ok') {
        if (versionCompare(app.version, '1.13.0') >= 0) {
          app.serverLicense = response.license
          app.timeLeft = moment(response.license.licenseExpires, 'YYYYMMDD').fromNow();
          app.$.licenseDialog.open();
          app.async(callback);
        } else {
          app.serverLicense = response.license;
          var nextYear = moment(response.license.date, 'YYYYMMDD').add(1, 'years').calendar();
          app.timeLeft = moment(nextYear, 'YYYYMMDD').fromNow();
          app.$.licenseDialog.open();
          app.async(callback);
        }
      }
    });
  };

  /**
   * close license dialog
   */
  app.licenseDialogClose = function () {
    app.$.licenseDialog.close();
  };

  /**
   * fetch and set user account details
   * used to set flags for access restrictions
   */
  app.userDetails = function () {
    return new Promise(function (resolve, reject) {
      var url = app.$.globals.buildUrl('getUser', {
        username: app.user
      });
      app.$.globals.doXhr(url, 'json').then(function (e) {
        var response = e.target.response['subsonic-response'];
        resolve(response);
        if (response.status === 'ok') {
          app.activeUser = response.user;
        } else {
          app.async(app.userDetails, null, 1000);
          console.error('Error getting User details');
        }
      });
    });
  };

  app._animationPrapare = function () {
    app._animation = true;
  };

  app._animationEnd = function (e) {
    app._animation = false;
    if (app.page === 3) {
      app.$.aDetails.resize();
      app.$.aDetails._animationEnd();
    }
  };

  app._resumePlaylist = function () {
    app.$.resumePlaylist.open();
  };

  app.resumeLast = function () {
    app.playlist = app.lastPlaylist;
    app.playing = app.lastPlaying;
  };

  app.clearLastPlaylist = function () {
    simpleStorage.setSync({
      lastPlaying: undefined
    });
    app.$.globals._putInDb([], 'playlist');
    app.lastPlaylist = undefined;
    app.lastPlaying = undefined;
  };


  /**
   * key binding listener
   */
  chrome.commands.onCommand.addListener(function(command) {
    var player = app.$.player;
    if (command === 'mediaPlay') {
      player.playPause();
    } else if (command === 'mediaStop') {
      app.clearPlaylist();
    } else if (command === 'mediaForward') {
      player.nextTrack();
    } else if (command === 'mediaBack') {
      player.lastTrack();
    } else if (command === 'volumeUp' && app.volume !== 100) {
      app.volume = Math.abs(app.volume + 1);
    } else if (command === 'volumeDown' && app.volume !== 0) {
      app.volume = Math.abs(app.volume - 1);
    }
  });

  /**
   * elements stamped to template & ready to use
   */
  app.addEventListener('template-bound', function () {
    app.$.player.resize();
    app.$.globals.openIndexedDB().then(function () {
      // get account synced settings
      simpleStorage.getSync().then(function (result) {
        app.dataLoading = false;
        app.configs = result.configs || [];

        // update config storage method to 0.2.9 method
        if (!app.configs.length && 'url' in result && 'user' in result && 'pass' in result) {
          // default md5 auth true
          if (result.md5Auth === undefined) {
            result.md5Auth = true;
          }
          app.configs.push({
            name: 'Config1',
            url: result.url,
            user: result.user,
            pass: result.pass,
            md5Auth: result.md5Auth,
            version: result.version
          });
          chrome.storage.sync.remove('url');
          chrome.storage.sync.remove('user');
          chrome.storage.sync.remove('pass');
          chrome.storage.sync.remove('version');
          chrome.storage.sync.remove('md5Auth');
          simpleStorage.setSync({
            configs: app.configs
          });
          simpleStorage.setLocal({
            currentConfig: 0
          });
        }
        app.lastPlaying = result.lastPlaying;
        app.autoBookmark = result.autoBookmark;
        app.gapless = result.gapless;
        app.shuffleSettings.size = 50;
        app.querySize = result.querySize || 60;
        app.volume = result.volume || 100;
        app.queryMethod = result.queryMethod || 'ID3';
        app.repeatPlaylist = false;
        // configure album wall first request
        app.$.wall.post = {
          type: result.sortType || 'newest',
          size: 60,
          offset: 0
        };
        app.$.wall.request = result.request || 'getAlbumList2';

        // set up some default texts / styles for repeat buttons
        app.repeatText = chrome.i18n.getMessage('playlistRepeatOff');
        app.repeatState = chrome.i18n.getMessage('disabled');
        app.$.repeatButton.style.color = '#db4437';

        // get install specific settings
        simpleStorage.getLocal().then(function (resultLocal) {
          app.bitRate = resultLocal.bitRate || 320;
          app.currentConfig = resultLocal.currentConfig || 0;
          var using = app.configs[app.currentConfig];
          if (using) {
            for (var key in using) {
              app[key] = using[key];
            }
          } else {
            app.version = '1.11.0';
            app.md5Auth = result.md5Auth || true;
          }

          // default params sent with every request
          app.params = {
            u: app.user,
            v: app.version,
            c: 'PolySonic',
            f: 'json'
          };

          // set up the wall list method
          app.listMode = result.listMode || 'cover';
          var wallToggles = document.querySelectorAll('.wallToggle');
          for (var i = 0; i < wallToggles.length; i++) {
            if (app.listMode === 'cover') {
              wallToggles[i].icon = 'view-stream';
            } else {
              wallToggles[i].icon = 'view-module';
            }
          }

          if (app.url && app.user && app.pass) {
            app.$.globals.initFS().then(function () {
              var firstPing = app.$.globals.buildUrl('ping');
              app.$.globals.doXhr(firstPing, 'json').then(function (e) {
                var json = e.target.response['subsonic-response'];
                if (e.target.status === 200) {

                  // update api version if it has changed
                  if (versionCompare(json.version, app.version) > 0) {
                    app.version = json.version;
                    simpleStorage.getSync('configs').then(function (configs) {
                      configs[app.currentConfig].version = app.version;
                      simpleStorage.setSync({
                        configs: configs
                      });
                    });
                  }
                  // begin fetching Subsonic data
                  if (json.status === 'ok') {
                    console.log('Connected to Subconic loading data');
                    app.userDetails().then(function () {
                      var foldersURL = app.$.globals.buildUrl('getMusicFolders');

                      // get list of folders from Subsonic
                      app.$.globals.doXhr(foldersURL, 'json').then(function (e) {
                        app.mediaFolders = e.target.response['subsonic-response'].musicFolders.musicFolder;

                        /* setting mediaFolder causes a ajax call to get album wall data */

                        // set the currently used folder
                        app.folder = result.mediaFolder || 'none';
                        if (app.mediaFolders === undefined || !app.mediaFolders[1]) {
                          app.$.sortBox.style.display = 'none';
                        }

                        // analistics
                        app.tracker.sendAppView('Album Wall');

                        // if saved playlist give user the option to resume it
                        app.$.globals.getDbItem('playlist').then(function (e) {
                          app.lastPlaylist = e.target.result;
                          if (app.lastPlaylist && app.lastPlaylist.length) app.async(app._resumePlaylist, null, 1000);
                        });
                      });
                    });
                  } else {
                    // open first run dialog & alert user of the reason for the connection error
                    app.$.firstRun.open();
                    app.$.globals.makeToast(e.target.response['subsonic-response'].error.meessage);
                  }

                } else {
                  app.$.firstRun.open();
                  app.$.globals.makeToast('Error connection to Subsonic');
                }
              }).catch(function () {
                app.$.firstRun.open();
              });
            });

          } else {
            app.$.firstRun.open();
          }
        });
      });
    });

    // set main content scrolling callback
    app.appScroller().onscroll = function () {
      var fab = app.$.fab;
      var wall = app.$.wall;
      var scroller = app.appScroller();
      var timer = 0;

      if (app.page === 0 && fab.state !== 'off' && scroller.scrollTop < app.position && wall.showing !== 'podcast') {
        fab.state = 'off';
      } else if (app.page === 0 && fab.state !== 'bottom' && scroller.scrollTop > app.position && wall.showing !== 'podcast') {
        fab.state = 'bottom';
      } else if (app.page === 3 && fab.state !== 'off' && scroller.scrollTop < app.position) {
        fab.state = 'off';
      } else if (app.page === 3 && fab.state !== 'bottom' && scroller.scrollTop > app.position) {
        fab.state = 'bottom';
      }
      app.position = scroller.scrollTop;
      app.scrolling = true;
      app.job('scroll', function () {
        app.scrolling = false;
      }, 100);
    };

    // app resize callback
    window.onresize = function () {
      app.$.aDetails.resize();
      app.$.fab.setPos();
      app.$.player.resize();
      app.$.fab.resize();
      app.$.albumDialog._resized();
      if (chrome.app.window.current().innerBounds.width < 571) {
        chrome.app.window.current().innerBounds.height = 761;
      }
    };

    window.addEventListener('keyup', function (e) {
      if (e.keyCode === 32 && app.page === 1 && app.$.player.hasOwnProperty('audio')) {
        app.$.player.playPause();
      }
    });

    // analistics
    app.service = analytics.getService('PolySonic');
    app.tracker = app.service.getTracker('UA-50154238-6');  // Supply your GA Tracking ID.
  });

}());
