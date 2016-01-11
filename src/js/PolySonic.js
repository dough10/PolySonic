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

  /**
   * elements stamped to template & ready to use
   */
  app.addEventListener('template-bound', function () {
    app.$.player.resize();
    // bitrate
    simpleStorage.getLocal().then(function (result) {
      app.bitRate = result.bitRate || 320;
    });
    // all synced settings
    simpleStorage.getSync().then(function (result) {
      app.url = result.url;
      app.user = result.user;
      app.pass = result.pass;
      app.md5Auth = result.md5Auth;
      app.autoBookmark = result.autoBookmark;
      app.gapless = result.gapless;
      app.shuffleSettings.size = '50';
      app.version = result.version || '1.11.0';
      app.querySize = 50;
      app.listMode = result.listMode || 'cover';
      app.volume = result.volume || 100;
      app.queryMethod = result.queryMethod || 'ID3';
      app.repeatPlaylist = false;
      app.repeatText = chrome.i18n.getMessage('playlistRepeatOff');
      app.repeatState = chrome.i18n.getMessage('disabled');
      app.$.repeatButton.style.color = '#db4437';
      app.dataLoading = false;
      app.params = {
        u: app.user,
        v: app.version,
        c: 'PolySonic',
        f: 'json'
      };
      var wallToggles = document.querySelectorAll('.wallToggle');
      for (var i = 0; i < wallToggles.length; i++) {
        if (app.listMode === 'cover') {
          wallToggles[i].icon = 'view-stream';
        } else {
          wallToggles[i].icon = 'view-module';
        }
      }
      if (app.md5Auth === undefined) {
        app.md5Auth = true;
      }
      if (app.url && app.user && app.pass) {
        var firstPing = app.$.globals.buildUrl('ping', '');
        app.$.globals.doXhr(firstPing, 'json').then(function (e) {
          if (e.target.status === 200) {

            if (versionCompare(e.target.response['subsonic-response'].version, app.version) >= 0) {
              app.version = e.target.response['subsonic-response'].version;
              simpleStorage.setSync({
                version: app.version
              });
            }

            if (e.target.response['subsonic-response'].status === 'ok') {
              app.userDetails();
              console.log('Connected to Subconic loading data');
              var folders = app.$.globals.buildUrl('getMusicFolders', '');
              app.$.globals.doXhr(folders, 'json').then(function (e) {
                app.mediaFolders = e.target.response['subsonic-response'].musicFolders.musicFolder;
                /* setting mediaFolder causes a ajax call to get album wall data */
                app.folder = result.mediaFolder || 0;
                if (e.target.response['subsonic-response'].musicFolders.musicFolder === undefined
                || !e.target.response['subsonic-response'].musicFolders.musicFolder[1]) {
                  app.$.sortBox.style.display = 'none';
                }
                app.tracker.sendAppView('Album Wall');
              });
            } else {
              app.tracker.sendEvent('Connection Error', e.target.response['subsonic-response'].error.meessage);
              app.$.firstRun.open();
              app.$.globals.makeToast(e.target.response['subsonic-response'].error.meessage);
            }

          } else {
            app.tracker.sendEvent('Connection Error', e.target.response['subsonic-response'].error.meessage);
            app.$.firstRun.open();
            app.$.globals.makeToast(e.target.response['subsonic-response'].error.meessage);
          }
        });

      } else {
        app.$.firstRun.open();
      }
    });

    // set main content scrolling callback
    app.appScroller().onscroll = app.scrollCallback;

    // app resize callback
    window.onresize = function () {
      app.$.fab.setPos();
      app.$.player.resize();
      app.$.fab.resize();
      if (chrome.app.window.current().innerBounds.width < 571) {
        chrome.app.window.current().innerBounds.height = 761;
      }
    };

    // analistics
    app.service = analytics.getService('PolySonic');
    app.tracker = app.service.getTracker('UA-50154238-6');  // Supply your GA Tracking ID.
  });

  /**
   * internationalization
   */
  app.appName = chrome.i18n.getMessage("appName");
  app.appDesc = chrome.i18n.getMessage("appDesc");
  app.folderSelector = chrome.i18n.getMessage("folderSelector");
  app.shuffleButton = chrome.i18n.getMessage("shuffleButton");
  app.artistButton = chrome.i18n.getMessage("artistButton");
  app.podcastButton = chrome.i18n.getMessage("podcastButton");
  app.favoritesButton = chrome.i18n.getMessage("favoritesButton");
  app.searchButton = chrome.i18n.getMessage("searchButton");
  app.settingsButton = chrome.i18n.getMessage("settingsButton");
  app.nowPlayingLabel = chrome.i18n.getMessage("nowPlayingLabel");
  app.folderSelectorLabel = chrome.i18n.getMessage("folderSelectorLabel");
  app.clearQueue = chrome.i18n.getMessage("clearQueue");
  app.volumeLabel = chrome.i18n.getMessage("volumeLabel");
  app.analistics = chrome.i18n.getMessage("analistics");
  app.accept = chrome.i18n.getMessage("accept");
  app.decline = chrome.i18n.getMessage("decline");
  app.shuffleOptionsLabel = chrome.i18n.getMessage("shuffleOptionsLabel");
  app.optional = chrome.i18n.getMessage("optional");
  app.artistLabel = chrome.i18n.getMessage("artistLabel");
  app.albumLabel = chrome.i18n.getMessage("albumLabel");
  app.genreLabel = chrome.i18n.getMessage("genreLabel");
  app.songReturn = chrome.i18n.getMessage("songReturn");
  app.playButton = chrome.i18n.getMessage("playButton");
  app.yearError = chrome.i18n.getMessage("yearError");
  app.releasedAfter = chrome.i18n.getMessage("releasedAfter");
  app.releasedBefore = chrome.i18n.getMessage("releasedBefore");
  app.submitButton = chrome.i18n.getMessage("submitButton");
  app.deleteConfirm = chrome.i18n.getMessage("deleteConfirm");
  app.noResults = chrome.i18n.getMessage("noResults");
  app.urlError = chrome.i18n.getMessage("urlError");
  app.podcastSubmissionLabel = chrome.i18n.getMessage("podcastSubmissionLabel");
  app.diskUsed = chrome.i18n.getMessage("diskused");
  app.diskRemaining = chrome.i18n.getMessage("diskRemaining");
  app.playlistsButton = chrome.i18n.getMessage("playlistsButton");
  app.createPlaylistLabel = chrome.i18n.getMessage("createPlaylistLabel");
  app.playlistLabel = chrome.i18n.getMessage("playlistLabel");
  app.reloadAppLabel = chrome.i18n.getMessage("reloadApp");
  app.settingsDeleted = chrome.i18n.getMessage("settingsDeleted");
  app.recommendReload = chrome.i18n.getMessage("recommendReload");
  app.jumpToLabel = chrome.i18n.getMessage("jumpToLabel");
  app.closeLabel = chrome.i18n.getMessage("closeLabel");
  app.moreOptionsLabel = chrome.i18n.getMessage("moreOptionsLabel");
  app.refreshPodcastLabel = chrome.i18n.getMessage("refreshPodcast");
  app.registeredEmail = chrome.i18n.getMessage("registeredEmail");
  app.licenseKey = chrome.i18n.getMessage("licenseKey");
  app.keyDate = chrome.i18n.getMessage("keyDate");
  app.validLicense = chrome.i18n.getMessage("validLicense");
  app.invalidLicense = chrome.i18n.getMessage("invalidLicense");
  app.adjustVolumeLabel = chrome.i18n.getMessage("adjustVolumeLabel");
  app.showDownloads = chrome.i18n.getMessage('showDownloads');
  app.shuffleList = chrome.i18n.getMessage('shuffleList');
  app.randomized = chrome.i18n.getMessage('randomized');
  app.markCreated = chrome.i18n.getMessage('markCreated');
  app.bookmarks = chrome.i18n.getMessage('bookmarks');
  app.createBookmarkText = chrome.i18n.getMessage('createBookmark');
  app.deletebookMarkConfirm = chrome.i18n.getMessage('deletebookMarkConfirm');

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
    navigator.webkitTemporaryStorage.queryUsageAndQuota(function (used, remaining) {
      app.storageQuota = app.diskUsed + ": " + formatBytes(used) + ', ' + app.diskRemaining + ": " + formatBytes(remaining);
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
   * scrolling callback
   */
  app.scrollCallback = function () {
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
    }, 50);
  };

  /**
   * callback for shuffle playback
   */
  function endLoop() {
    app.doShufflePlayback();
    app.dataLoading = false;
    app.closePlaylists();
  }

  /**
   * shuffle the order of a given array
   * @param {Array} array
   */
  function shuffleArray(array) {
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
    shuffleArray(app.playlist);
    app.playlist.unshift(temp);
    app.$.globals.makeToast(app.randomized);
    if (app.playing !== 0) {
      app.alreadyPlaying = true; // tell player this track is already playing other wise will start play over again
      app.async(function () {
        app.playing = 0;
      });
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

  // playback handler for bookmarks
  function handlePlay(obj) {
    app.dataLoading = false;
    app.playlist = [obj];
    if (app.playing === 0) {
      app.$.player.playAudio(obj);
    } else {
      app.playing = 0;
    }
    app.setFabColor(obj);
  }

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
      var song = e.target.response['subsonic-response'].song,
        obj = {},
        artId;
      if (song.type === 'music') {
        obj.duration = app.secondsToMins(song.duration);
        artId = 'al-' + song.albumId;
      } else {
        artId = song.coverArt;
      }
      obj.id = song.id;
      obj.album = song.album;
      obj.title = decodeURIComponent(song.title);
      if (song.artist === 'Podcast') {
        obj.artist = '';
      } else {
        obj.artist = song.artist;
      }
      obj.bookmarkPosition = song.bookmarkPosition;
      app.$.globals.fetchImage(artId).then(function (imgURL) {
        obj.cover = imgURL;
        app.$.globals.getDbItem(artId + '-palette').then(function (palette) {
          obj.palette = palette.target.result;
          handlePlay(obj);
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
    app.$.globals.doXhr(
      app.$.globals.buildUrl('deleteBookmark', {
        id: app.delID
      }), 'json', function (e) {
      if (e.target.response['subsonic-response'].status === 'ok') {
        app.dataLoading = true;
        app.$.globals.doXhr(app.$.globals.buildUrl('getBookmarks', ''), 'json').then(function (ev) {
          app.allBookmarks = ev.target.response['subsonic-response'].bookmarks.bookmark;
          app.$.showBookmarks.open();
          app.dataLoading = false;
        });
      } else {
        app.$.globals.makeToast(e.target.response['subsonic-response'].error.message);
      }
    });
  };

  /**
   * convert seconds to readable form
   * @param {Number} sec
   */
  app.secondsToMins = function (sec) {
    var mins = Math.floor(sec / 60);
    return mins + ':' + ('0' + Math.floor(sec - (mins * 60))).slice(-2);
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
    app.dataLoading = true;
    app.playlist = null;
    app.playlist = [];
    if (app.$.player.audio) {
      app.$.player.audio.pause();
    }
    var url = app.$.globals.buildUrl('getPlaylist', {id: sender.attributes.ident.value});
    app.$.globals.doXhr(url, 'json').then(function (e) {
      var tracks = e.target.response['subsonic-response'].playlist.entry;
      var length = tracks.length;
      for (var i = 0; i < length; i++) {
        var obj = {
          id: tracks[i].id,
          artist: tracks[i].artist,
          title: tracks[i].title,
          duration: app.secondsToMins(tracks[i].duration),
          cover: "al-" + tracks[i].albumId
        };
        app.fixCoverArtForShuffle(obj, endLoop);
      }
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
    if (!app.startYearInvalid && !app.endYearInvalid) {
      if (app.$.player.audio && !app.$.player.audio.paused) {
        app.$.player.audio.pause();
      }
      if (app.shuffleSettings.genre === 0) {
        delete app.shuffleSettings.genre;
      }
      var url = app.$.globals.buildUrl('getRandomSongs', app.shuffleSettings);
      app.$.globals.doXhr(url, 'json').then(function (event) {
        var data = event.target.response['subsonic-response'].randomSongs.song;
        if (data) {
          var length = data.length;
          for (var i = 0; i < length; i++) {
            var obj = {
              id: data[i].id,
              artist: data[i].artist,
              title: data[i].title,
              duration: app.secondsToMins(data[i].duration),
              cover: "al-" + data[i].albumId
            };
            app.fixCoverArtForShuffle(obj, endLoop);
          }
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

  /**
   * start shuffle playback
   */
  app.doShufflePlayback = function () {
    if (app.$.player.audio && app.$.player.audio.paused) {
      if (app.playing === 0) {
        app.$.player.playAudio(app.playlist[0]);
      } else {
        app.playing = 0;
      }
      app.$.player.getImageForPlayer(app.playlist[0].cover, function () {
        app.setFabColor(app.playlist[0]);
        app.$.shuffleOptions.close();
        app.shuffleLoading = false;
      });
    } else if (!app.$.player.audio) {
      if (app.playing === 0) {
        app.$.player.playAudio(app.playlist[0]);
      } else {
        app.playing = 0;
      }
      app.$.player.getImageForPlayer(app.playlist[0].cover, function () {
        app.setFabColor(app.playlist[0]);
        app.$.shuffleOptions.close();
        app.shuffleLoading = false;
      });
    }
  };

  /*
    clear playlist
  */
  app.clearPlaylist = function () {
    app.tracker.sendEvent('Clear Playlist', new Date());
    app.$.player.audio.pause();
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
    var loader = document.getElementById("loader"),
      box = document.getElementById("box");

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
          } else {
            config.setTrackingPermitted(result.analistics);
            app.analisticsEnabled = result.analistics;
          }
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
    app.folder = parseInt(sender.attributes.i.value, 10);
    simpleStorage.setSync({
      'mediaFolder': app.folder
    });
  };

  /**
   * attach image object url to a playlist item object
   * @param {Object} obj
   * @param {Function} callback
   */
  app.fixCoverArtForShuffle = function (obj, callback) {
    var artId = obj.cover;
    app.$.globals.getDbItem(artId).then(function (ev) {
      if (ev.target.result) {
        var imgURL = window.URL.createObjectURL(ev.target.result);
        obj.cover = imgURL;
        app.$.globals.getDbItem(artId + '-palette').then(function (ev) {
          obj.palette = ev.target.result;
          app.playlist.push(obj);
          app.async(callback);
        });
      } else {
        var url = app.$.globals.buildUrl('getCoverArt', {id: artId});
        app.$.globals.getImageFile(url, artId).then(function (ev) {
          var imgURL = window.URL.createObjectURL(ev.target.result);
          obj.cover = imgURL;
          app.$.globals.stealColor(imgURL, artId).then(function (colorArray) {
            obj.palette = colorArray;
            app.playlist.push(obj);
            app.async(callback);
          });
        });
      }
    });
  };

  /**
   * set color of accent colors in player
   * @param {Array} array
   */
  app.setFabColor = function (array) {
    if (array.palette) {
      app.colorThiefFab = array.palette[0];
      app.colorThiefFabOff = array.palette[1];
      app.colorThiefBuffered = array.palette[2];
      app.colorThiefProgBg = array.palette[3];
    }
  };

  /**
   * open playlist save dialog  set default name to curent time & date
   */
  app.savePlayQueue = function () {
    app.$.playlistDialog.close();
    app.$.createPlaylist.open();
    app.defaultName = new Date().toLocalString();
  };

  /**
   * callback for saving a playlist
   */
  function save2PlayQueueCallback (e) {
    if (e.target.response['subsonic-response'].status === 'ok') {
      app.$.globals.makeToast(chrome.i18n.getMessage('playlistCreated'));
      app.$.createPlaylist.close();
      app.savingPlaylist = false;
    } else {
      app.$.globals.makeToast(chrome.i18n.getMessage('playlistError'));
      app.savingPlaylist = false;
    }
  }

  /**
   * save a playlist
   */
  app.savePlayQueue2Playlist = function () {
    var url = app.$.globals.buildUrl('createPlaylist', {name: app.defaultName}),
      length = app.playlist.length;
    app.savingPlaylist = true;
    for (var i = 0; i < length; i++) {
      url = url + '&songId=' + app.playlist[i].id;
      if (i === length - 1) {
        app.$.globals.doXhr(url, 'json').then(save2PlayQueueCallback);
      }
    }
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
      animation = new CoreAnimation();
    animation.duration = 1000;
    animation.iterations = 'Infinity';
    animation.keyframes = [
      {
        opacity: 1
      }, {
        opacity: 0
      }
    ];
    animation.target = sender;
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
      app.$.wall.playSomething(sender.ident, function () {
        animation.cancel();
        app.$.fab.state = 'bottom';
      });
    }
    if (app.page === 3) {
      animation.play();
      app.$.aDetails.playSomething(sender.ident, function () {
        animation.cancel();
        app.$.fab.state = 'bottom';
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
      app.async(function () {
        app.$.globals.closeDrawer().then(function () {
          app.async(function () {
            var url = app.$.globals.buildUrl('search3', {
              query: encodeURIComponent(app.searchQuery)
            });
            app.$.globals.doXhr(url, 'json').then(function (e) {
              app.dataLoading = true;
              if (e.target.response['subsonic-response'].status === 'ok') {
                app.searchQuery = '';
                var response = e.target.response;
                if (response['subsonic-response'].searchResult3.album) {
                  app.async(function () {
                    if (!app.narrow && app.page !== 0) {
                      app.page = 0;
                      app.async(function () {
                        app.$.wall.response = response;
                        app.showing = app.listMode;
                      }, null, 550);
                    } else if (app.narrow) {
                      app.$.wall.response = response;
                      app.showing = app.listMode;
                    } else {
                      app.$.wall.clearData(function () {
                        app.$.wall.response = response;
                        app.showing = app.listMode;
                        app.pageLimit = true;
                      });
                    }
                  });
                } else {
                  app.dataLoading = false;
                  app.$.globals.makeToast(chrome.i18n.getMessage('noResults'));
                }
              }
            });
          });
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
    if (p) {
      app.$.playlistDialog.transition = "core-transition-bottom";
    } else {
      app.$.playlistDialog.transition = "core-transition-top";
    }
    app.async(function () {
      app.$.playlistDialog.toggle();
    });
  };

  /**
   * close the playlist / play que dialog
   */
  app.closePlaylist = function () {
    app.async(function () {
      app.$.playlistDialog.close();
    });
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
        app.async(function () {
          app.$.playlistsDialog.open();
        });
      });
    });
  };

  /**
   * close sudsonic playlists dialog
   */
  app.closePlaylists = function () {
    app.async(function () {
      app.$.playlistsDialog.close();
    });
  };

  /**
   * open playlist delete confirmation dialog
   */
  app.reallyDelete = function (event, detail, sender) {
    app.delID =  sender.attributes.ident.value;
    app.async(function () {
      app.$.playlistsDialog.close();
      app.$.playlistConfirm.open();
    });
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
          app.async(app.$.playlistsDialog.open);
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
    app.async(function () {
      app.$.shuffleOptions.close();
    });
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
        app.async(function () {
          app.$.shuffleOptions.open();
        });
      });
    });
  };

  /**
   * close podcast add dialog
   */
  app.closePodcastDialog = function () {
    app.async(function () {
      app.$.addPodcast.close();
    });
  };

  app.toggleWall = function (e , detail, sender) {
    if (app.listMode === 'cover') {
      app.listMode = 'list';
      simpleStorage.setSync({
        'listMode': 'list'
      });
    } else {
      app.listMode = 'cover';
      simpleStorage.setSync({
        'listMode': 'cover'
      });
    }
    app.tracker.sendEvent('ListMode Changed', app.listMode);
    if (app.page === 3) {
      app.$.aDetails.queryData();
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
    app.async(function () {
      app.page = 0;
    });
  };

  /**
   * navigate to now playing page
   */
  app.nowPlaying = function () {
    app.async(function () {
      app.page = 1;
    });
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
    if (!app.narrow && app.page !== 0) {
      app.page = 0;
      app.async(function () {
        if (wall.sort === sender.attributes.i.value) {
          app.pageLimit = false;
          if (app.queryMethod === 'ID3') {
            wall.request = 'getAlbumList2';
          } else {
            wall.request = 'getAlbumList';
          }
          wall.post.type = sender.attributes.i.value;
          wall.refreshContent();
          wall.showing = app.listMode;
          wall.$.threshold.clearLower();
        }
        wall.sort = sender.attributes.i.value;
      }, null, 550);
    } else if (!app.narrow) {
      if (wall.sort === sender.attributes.i.value) {
        app.pageLimit = false;
        if (app.queryMethod === 'ID3') {
          wall.request = 'getAlbumList2';
        } else {
          wall.request = 'getAlbumList';
        }
        wall.post.type = sender.attributes.i.value;
        wall.refreshContent();
        wall.showing = app.listMode;
        wall.$.threshold.clearLower();
      }
      wall.sort = sender.attributes.i.value;
    } else {
      app.$.globals.closeDrawer().then(function () {
        if (wall.sort === sender.attributes.i.value) {
          app.pageLimit = false;
          if (app.queryMethod === 'ID3') {
            wall.request = 'getAlbumList2';
          } else {
            wall.request = 'getAlbumList';
          }
          wall.post.type = sender.attributes.i.value;
          wall.refreshContent();
          wall.showing = app.listMode;
          wall.$.threshold.clearLower();
        }
        wall.sort = sender.attributes.i.value;
      });
    }
  };

  /**
   * fetch podcasts
   */
  app.getPodcast = function () {
    app.tracker.sendEvent('Showing Podcast', new Date());
    if (!app.narrow && app.page !== 0) {
      app.page = 0;
      app.async(function () {
        app.$.wall.getPodcast();
      }, null, 550);
    } else if (!app.narrow) {
      app.$.wall.getPodcast();
    } else {
      app.$.globals.closeDrawer().then(function () {
        app.$.wall.getPodcast();
      });
    }
  };

  /**
   * fetch starred albums
   */
  app.getStarred = function () {
    app.tracker.sendEvent('Showing Favorites', new Date());
    if (!app.narrow && app.page !== 0) {
      app.page = 0;
      app.async(function () {
        app.$.wall.getStarred();
      }, null, 550);
    } else if (!app.narrow) {
      app.$.wall.getStarred();
    } else {
      app.$.globals.closeDrawer().then(function () {
        app.$.wall.getStarred();
      });
    }
  };

  /**
   * fetch artist list
   */
  app.getArtist = function () {
    app.tracker.sendEvent('Showing Artist List', new Date());
    if (!app.narrow && app.page !== 0) {
      app.page = 0;
      app.async(function () {
        app.$.wall.getArtist();
      }, null, 550);
    } else if (!app.narrow) {
      app.$.wall.getArtist();
    } else {
      app.$.globals.closeDrawer().then(function () {
        app.$.wall.getArtist();
      });
    }
  };

  /**
   * navigate to settings page
   */
  app.gotoSettings = function () {
    app.tracker.sendEvent('Settings Page', new Date());
    app.async(function () {
      app.$.panel.closeDrawer();
      app.page = 2;
    });
  };

  /**
   * refersh the podcast list
   * @param {Event} event
   * @param {Object} detail
   * @param {Object} sender
   */
  app.refreshPodcast = function (event, detail, sender) {
    var animation = app.$.globals.attachAnimation(sender);
    animation.play();
    var url = app.$.globals.buildUrl('refreshPodcasts', '');
    app.$.globals.doXhr(url, 'json').then(function (e) {
      if (e.target.response['subsonic-response'].status === 'ok') {
        animation.cancel();
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
    if (!app.invalidURL) {
      app.addingChannel = true;
      var url = app.$.globals.buildUrl('createPodcastChannel', {url: encodeURIComponent(app.castURL)});
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
    var url = app.$.globals.buildUrl('getLicense', '');
    app.$.globals.doXhr(url, 'json').then(function (e) {
      var response = e.target.response['subsonic-response'];
      if (response.status === 'ok') {
        app.serverLicense = response.license;
        var fromServer = new Date(app.serverLicense.date);
        var nextYear = Math.abs(fromServer.getFullYear() + 1);
        var expires;
        if (app.serverLicense.trialExpires) {
          expires = new Date(app.serverLicense.trialExpires);
        } else {
          expires = new Date(fromServer.setFullYear(nextYear));
        }
        var now = new Date();
        var minute = 1000 * 60;
        var hour = minute * 60;
        var day = hour * 24;
        var daysLeft = Math.ceil((expires.getTime() - now.getTime())/(day));
        var hoursLeft = Math.ceil((expires.getTime() - now.getTime())/(hour));
        if (daysLeft > 0) {
          app.serverLicense.daysLeft = daysLeft + ' days';
        } else {
          app.serverLicense.daysLeft = hoursLeft + 'hours';
        }
        app.$.licenseDialog.open();
        app.async(callback);
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
    app.async(function () {
      var url = app.$.globals.buildUrl('getUser', {
        username: app.user
      });
      app.$.globals.doXhr(url, 'json').then(function (e) {
        var response = e.target.response['subsonic-response'];
        if (response.status === 'ok') {
          app.activeUser = response.user;
        } else {
          console.error('Error getting User details');
        }
      });
    });
  };

  /**
   * convert object a query string
   * @param {Object} params
   */
  function toQueryString(params) {
    var r = [];
    for (var n in params) {
      n = encodeURIComponent(n);
      r.push(params[n] === null ? n : (n + '=' + encodeURIComponent(params[n])));
    }
    return r.join('&');
  }

  /**
   * hex encode a text string
   */
  String.prototype.hexEncode = function () {
    var r = '';
    var i = 0;
    var h;
    while (i<this.length) {
      h = this.charCodeAt(i++).toString(16);
      while (h.length<2) {
        h = h;
      }
      r += h;
    }
    return 'enc:'+r;
  };

  /**
   * create a random string of a given length
   * @param {number} length
   */
  function makeSalt(length) {
    var text = "";
    var possible = "ABCD/EFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for( var i=0; i < length; i++ )
      text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
  }

//  /**
//   * generate a subsonic url string
//   * @param {String} method
//   * @param {Object} options
//   */
//  app.$.globals.buildUrl = function(method, options) {
//    if (options !== null && typeof options === 'object') {
//      options = '&' + toQueryString(options);
//    }
//    if (app.user !== app.params.u) {
//      app.params.u = app.user;
//    }
//    if (app.version !== app.params.v) {
//      app.params.v = app.version;
//    }
//    if (versionCompare(app.version, '1.13.0') >= 0 && app.md5Auth) {
//      if (app.params.p) {
//        delete app.params.p;
//      }
//      app.params.s = makeSalt(16);
//      app.params.t = md5(app.pass + app.params.s);
//      return app.url + '/rest/' + method + '.view?' + toQueryString(app.params) + options;
//    } else {
//      if (app.params.t) {
//        delete app.params.t;
//        delete app.params.s;
//      }
//      app.params.p = app.pass.hexEncode();
//      return app.url + '/rest/' + method + '.view?' + toQueryString(app.params) + options;
//    }
//  };

  /**
   * key binding listener
   */
  chrome.commands.onCommand.addListener(function(command) {
    var player = document.querySelector('music-player');
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

}());
