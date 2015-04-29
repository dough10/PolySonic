/*global chrome, CryptoJS, console, window, document, XMLHttpRequest, setInterval, screen, analytics, Blob, navigator, Image, CoreAnimation, ColorThief, setTimeout */
(function () {
  'use strict';
  
  /*
    cast API
  */
  /*function onRequestSessionSuccess(e) {
    session = e;
    console.log(session);
  }

  function onLaunchError(e) {
    console.log(e.code);
  }

  var initializeCastApi = function() {
    var sessionRequest = new chrome.cast.SessionRequest(chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID);
    var apiConfig = new chrome.cast.ApiConfig(sessionRequest,
      sessionListener,
      receiverListener);
    chrome.cast.initialize(apiConfig, onInitSuccess, onInitError);
  };

  function receiverListener(e) {
    if( e === chrome.cast.ReceiverAvailability.AVAILABLE) {
      console.log(e);
    }
  }

  function sessionListener(e) {
    session = e;
    if (session.media.length !== 0) {
      onMediaDiscovered('onRequestSessionSuccess', session.media[0]);
    }
  }

  function onInitSuccess(e) {
    console.log('CastAPI Ready');
  }

  function onInitError(e) {
    console.log(e);
  }

  window['__onGCastApiAvailable'] = function(loaded, errorInfo) {
    if (loaded) {
      initializeCastApi();
    } else {
      console.log(errorInfo);
    }
  };*/
  
  /* polymer auto-binding template ready */
  var app = document.querySelector('#tmpl');
  app.addEventListener('template-bound', function () {

  
    /*jslint unparam: true*/
    this.fixScroller = function (event, detail, sender) {
      /*var scrollbar = this.appScroller();
      if (event.type === 'core-animated-pages-transition-prepare' && event.target.id === 'main' && scrollbar.scrollTop !== 0) {
        scrollbar.scrollTop = 0;
      }*/
    };
    /*jslint unparam: false*/
  
    this.openSearch = function () {
      this.closeDrawer(function () {
        this.$.searchDialog.toggle();
      }.bind(this));
    };

  
    this.showApp = function () {
      var loader = document.getElementById("loader"),
        visible = loader.classList.contains("hide"),
        box = document.getElementById("box");
  
      if (!visible) {
        loader.classList.add('hide');
        box.classList.add('hide');
        box.classList.add('hide');
        this.askAnalistics();
      }
    };
  
    /* request premission for analistics */
    this.askAnalistics = function () {
      chrome.storage.sync.get(function (result) {
        this.service.getConfig().addCallback(
          /** @param {!analytics.Config} config */
          function (config) {
            if (result.analistics === undefined) {
              this.askUser();
            } else {
              config.setTrackingPermitted(result.analistics);
              this.analisticsEnabled = result.analistics;
            }
            this.allowAnalistics = function () {
              this.analisticsEnabled = true;
              config.setTrackingPermitted(true);
              chrome.storage.sync.set({
                'analistics': true
              });
            };
  
            this.disAllowAnalistics = function () {
              this.analisticsEnabled = false;
              config.setTrackingPermitted(false);
              chrome.storage.sync.set({
                'analistics': false
              });
            };
          }.bind(this)
        );
      }.bind(this));
    };
  
    this.askUser = function () {
      this.$.analistics.toggle();
    };
  
    this.jumpTo = function (event, detail, sender) {
      this.$.wall.jumpToLetter(sender.attributes.it.value);
    };
  
    this.doSearch = function () {
      if (this.searchQuery) {
        this.searching = true;
        var url = this.url + '/rest/search3.view?u=' + this.user + '&p=' + this.pass + '&v=' + this.version + '&c=PolySonic&f=json&query=' + encodeURIComponent(this.searchQuery);
        this.doXhr(url, 'json', function (e) {
          if (e.target.response['subsonic-response'].status === 'ok') {
            this.searching = false;
            var response = e.target.response['subsonic-response'];
            this.searchResults = [];
            this.searchResults.artist = response.searchResult3.artist;
            this.searchResults.album = [];
            this.searchResults.song = response.searchResult3.song;
            if (response.searchResult3.album !== null && response.searchResult3.album !== undefined) {
              Array.prototype.forEach.call(response.searchResult3.album, function (e) {
                var data = {artist: e.artist, coverArt: e.coverArt, id: e.id, name: e.name, url: this.url, user: this.user, pass: this.pass, version: this.version, bitRate: this.bitRate, listMode: 'cover'};
                this.searchResults.album.push(data);
              }.bind(this));
            }
          }
        }.bind(this));
      } else {
        this.doToast(chrome.i18n.getMessage("noSearch"));
      }
    };
    
    this.openPlaylists = function () {
      this.closeDrawer(function ()  {
        this.playlistsLoading = true;
        var url = this.url + '/rest/getPlaylists.view?u=' + this.user + '&p=' + this.pass + '&v=' + this.version + '&c=PolySonic&f=json';
        this.doXhr(url, 'json', function (e) {
          this.playlistsLoading = false;
          this.playlists = e.target.response['subsonic-response'].playlists.playlist;
          this.$.playlistsDialog.open();
        }.bind(this));
      }.bind(this));
    };
    
    this.savePlayQueue = function () {
      this.$.playlistDialog.close();
      this.$.createPlaylist.open();
      this.defaultName = new Date();
    };
    
    this.savePlayQueue2Playlist = function () {
      var url = this.url + '/rest/createPlaylist.view?u=' + this.user + '&p=' + this.pass + '&v=' + this.version + '&c=PolySonic&f=json&name=' + encodeURIComponent(this.defaultName),
        hasRun = false,
        i = 0;
      this.savingPlaylist = true;
      Array.prototype.forEach.call(this.playlist, function (item) {
        url = url + '&songId=' + item.id;
        i = i + 1;
        if (i === this.playlist.length) {
          this.doXhr(url, 'json', function (e) {
            if (e.target.response['subsonic-response'].status === 'ok') {
              this.doToast(chrome.i18n.getMessage('playlistCreated'));
              this.$.createPlaylist.close();
              this.savingPlaylist = false;
            } else {
              this.doToast(chrome.i18n.getMessage('playlistError'));
              this.savingPlaylist = false;
            }
          }.bind(this));
        }
      }.bind(this));
    };
    
    this.closePlaylistSaver = function () {
      this.$.createPlaylist.close();
    };

    this.reallyDelete = function (event, detail, sender) {
      this.delID =  sender.attributes.ident.value;
      this.$.playlistsDialog.close();
      this.$.playlistConfirm.open();
    };
  
    this.deletePlaylist = function (event, detail, sender) {
      var url = this.url + '/rest/deletePlaylist.view?u=' + this.user + '&p=' + this.pass + '&v=' + this.version + '&c=PolySonic&f=json&id=' + sender.attributes.ident.value,
        url2 = this.url + '/rest/getPlaylists.view?u=' + this.user + '&p=' + this.pass + '&v=' + this.version + '&c=PolySonic&f=json';
      this.doXhr(url, 'json', function (e) {
        if (e.target.response['subsonic-response'].status === 'ok') {
          this.playlistsLoading = true;
          this.doXhr(url2, 'json', function (e) {
            this.playlistsLoading = false;
            this.playlists = e.target.response['subsonic-response'].playlists.playlist;
            this.$.playlistsDialog.open();
          }.bind(this));
        } else {
          this.doToast(chrome.i18n.getMessage('deleteError'));
        }
      }.bind(this));
    };
    
    this.closePlaylists = function () {
      this.$.playlistsDialog.close();
    };
  
    this.shuffleSize = this.shuffleSize || '50';
  
    this.shuffleOptions = function () {
      this.async(function () {
        var url = this.url + '/rest/getGenres.view?u=' + this.user + '&p=' + this.pass + '&v=' + this.version + '&c=PolySonic&f=json';
        this.closeDrawer(function () {
          this.doXhr(url, 'json', function (e) {
            this.genres = e.target.response['subsonic-response'].genres.genre;
            this.$.shuffleOptions.open();
          }.bind(this));
        }.bind(this));
      });
    };
    
    this.closeShuffleOptions = function () {
      this.$.shuffleOptions.close();
    };

    
    this.closePodcastDialog = function () {
      this.$.addPodcast.close();
    };

  
    this.fixCoverArtForShuffle = function (obj, callback) {
      var artId = obj.cover,
        img = this.url + '/rest/getCoverArt.view?u=' + this.user + '&p=' + this.pass + '&v=' + this.version + '&c=PolySonic&f=json&id=' + artId;
          
      this.getDbItem(artId, function (ev) {
        if (ev.target.result) {
          var raw = ev.target.result,
            imgURL = window.URL.createObjectURL(raw);
          obj.cover = imgURL;
          this.getDbItem(artId + '-palette', function (ev) {
            obj.palette = ev.target.result;
            this.playlist.push(obj);
            this.async(callback);
          }.bind(this));
        } else {
          this.getImageFile(img, artId, function (ev) {
            var raw = ev.target.result,
              imgURL = window.URL.createObjectURL(raw);
            obj.cover = imgURL;
            this.colorThiefHandler(imgURL, artId, function (colorArray) {
              this.async(function () {
                obj.palette = colorArray;
                this.playlist.push(obj);
                this.async(callback);
              });
            }.bind(this));
          }.bind(this));
        }
      }.bind(this));
    };
    
    this.setFabColor = function (obj) {
      if (this.colorThiefEnabled && obj.palette) {
        this.colorThiefFab = obj.palette[0];
        this.colorThiefFabOff = obj.palette[1];
        this.colorThiefBuffered = obj.palette[2];
        this.colorThiefProgBg = obj.palette[3];
      }
    };

    this.doAction = function (event, detail, sender) {
      this.async(function () {
        var scroller = this.appScroller(),
          wall = this.$.wall,
          animation = new CoreAnimation();
        animation.duration = 1000;
        animation.iterations = 'Infinity';
        animation.keyframes = [
          {opacity: 1},
          {opacity: 0}
        ];
        animation.target = sender;
        if (this.page === 0 && scroller.scrollTop !== 0 && wall.showing !== 'podcast' && this.$.fab.state === 'bottom') {
          this.async(function () {
            scroller.scrollTop = 0;
          });
        }
        if (this.page === 0 && wall.showing === 'podcast') {
          this.$.addPodcast.open();
        }
        if (this.page === 1) {
          this.showPlaylist();
        }
        if (this.page === 0 && this.$.fab.state === 'mid') {
          animation.play();
          this.$.wall.playSomething(sender.ident, function () {
            animation.cancel();
          });
        }
        if (this.page === 3) {
          animation.play();
          this.$.aDetails.playSomething(sender.ident, function () {
            animation.cancel();
          });
        }
      });
    };

  
    this.sizePlayer = function () {
      var height = (window.innerHeight - 256) + 'px',
        width = window.innerWidth + 'px',
        art = this.$.coverArt;
  
      art.style.width = width;
      art.style.height = height;
      art.style.backgroundSize = width;
    };

    this.closeSearch = function () {
      this.$.searchDialog.close();
    };
  
    this.closePlaylist = function () {
      this.$.playlistDialog.close();
    };

    this.toggleWall = function () {
      this.dataLoading = true;
      this.async(function () {
        var wall = this.$.wall;
        if (wall.listMode === 'cover') {
          wall.listMode = 'list';
          chrome.storage.sync.set({
            'listMode': 'list'
          });
        } else {
          wall.listMode = 'cover';
          chrome.storage.sync.set({
            'listMode': 'cover'
          });
        }
        this.tracker.sendEvent('ListMode Changed', wall.listMode);
      });
    };


    this.requestSession = function () {
      chrome.cast.requestSession(onRequestSessionSuccess, onLaunchError);
    };
  
    this.back2List = function () {
      this.async(function () {
        this.dataLoading = true;
        this.page = 0;
        this.async(function () {
          this.dataLoading = false;
        });
      });
    };
  
    this.nowPlaying = function () {
      this.async(function () {
        this.page = 1;
      });
    };

    this.progressClick = function (event) {
      var audio = this.$.audio,
        clicked = (event.x / window.innerWidth),
        sum = audio.duration - (audio.duration - (audio.duration * clicked)),
        bar = this.$.progress;
      bar.value = clicked * 100;
      audio.currentTime = sum;
    };
  
    /*jslint unparam: true*/
    this.selectAction = function (event, detail, sender) {
      var wall = this.$.wall;
      this.async(function () {
        this.closeDrawer(function () {
          this.async(function () {
            if (wall.sort === sender.attributes.i.value) {
              this.pageLimit = false;
              if (this.queryMethod === 'ID3') {
                wall.request = 'getAlbumList2';
              } else {
                wall.request = 'getAlbumList';
              }
              wall.post.type = sender.attributes.i.value;
              wall.refreshContent();
              wall.showing = this.listMode;
              wall.$.threshold.clearLower();
            }
            wall.sort = sender.attributes.i.value;
          });
        }.bind(this));
      });
    };
    /*jslint unparam: false*/
  
    this.getPodcast = function () {
      var wall = this.$.wall;
      this.async(function () {
        this.closeDrawer(function () {
          this.async(function () {
            wall.getPodcast();
          });
        }.bind(this));
      });
    };
  
    this.getStarred = function () {
      var wall = this.$.wall;
      this.async(function () {
        this.closeDrawer(function () {
          this.async(function () {
            wall.getStarred();
          });
        }.bind(this));
      });
    };
  
    this.getArtist = function () {
      var wall = this.$.wall;
      this.async(function () {
        this.closeDrawer(function () {
          this.async(function () {
            wall.getArtist();
          });
        }.bind(this));
      });
    };
  

  
    this.showPlaylist = function () {
      var dialog = this.$.playlistDialog;
      dialog.toggle();
    };
  
    this.setFolder = function (event, detail, sender) {
      this.async(function () {
        var value = parseInt(sender.attributes.i.value, 10);
        this.folder = value;
        chrome.storage.sync.set({
          'mediaFolder': value
        });
      });
    };

    this.gotoSettings = function () {
      this.closeDrawer(function () {
        this.async(function () {
          this.page = 2;
        });
      }.bind(this));
    };

    this.refreshPodcast = function (event, detail, sender) {
      this.async(function () {
        var animation = new CoreAnimation(),
          url;
        animation.duration = 1000;
        animation.iterations = 'Infinity';
        animation.keyframes = [
          {opacity: 1},
          {opacity: 0}
        ];
        animation.target = sender;
        animation.play();
        url = this.url + "/rest/refreshPodcasts.view?u=" + this.user + "&p=" + this.pass + "&f=json&v=" + this.version + "&c=PolySonic";
        this.doXhr(url, 'json', function (e) {
          if (e.target.response['subsonic-response'].status === 'ok') {
            animation.cancel();
            this.$.wall.refreshContent();
            this.doToast(chrome.i18n.getMessage("podcastCheck"));
          }
        }.bind(this));
      });
    };
  
    this.addChannel = function () {
      this.async(function () {
        if (!this.castURL) {
          this.doToast(this.urlError);
        }
        if (!this.invalidURL) {
          this.addingChannel = true;
          var url = this.url + "/rest/createPodcastChannel.view?u=" + this.user + "&p=" + this.pass + "&f=json&v=" + this.version + "&c=PolySonic&url=" + encodeURIComponent(this.castURL);
          this.doXhr(url, 'json', function (e) {
            if (e.target.response['subsonic-response'].status === 'ok') {
              this.addingChannel = false;
              this.$.addPodcast.close();
              this.$.wall.refreshContent();
              this.doToast(chrome.i18n.getMessage("channelAdded"));
              this.castURL = '';
            } else {
              this.doToast(chrome.i18n.getMessage("podcastError"));
            }
          }.bind(this));
        }
      });
    };
  
    this.doDelete = function (event, detail, sender) {
      this.$.wall.deleteChannel(sender.attributes.ident.value);
    };
    
    this.deleteEpisode = function (event, detail, sender) {
      this.$.wall.deleteEpisode(sender.attributes.ident.value);
    };

  
    this.dataLoading = false;
    this.sizePlayer();
    this.calculateStorageSize();

    /* load app settings from local storage */
    chrome.storage.sync.get(function (result) {
      if (result.url === undefined) {
        this.$.firstRun.open();
      }
      this.url = result.url;
      this.user = result.user;
      this.pass = result.pass;
      this.listMode = result.listMode || 'cover';
      this.bitRate = result.bitRate || 320;
      this.version = '1.11.0';
      this.querySize = 30;
      this.volume = result.volume || 100;
      this.queryMethod = result.queryMethod || 'ID3';
      this.colorThiefEnabled = true;
      if (this.url && this.user && this.pass && this.version) {
        var url = this.url + '/rest/ping.view?u=' + this.user + '&p=' + this.pass + '&v=' + this.version + '&c=PolySonic&f=json',
          url2;
        this.doXhr(url, 'json', function (e) {
          if (e.target.status === 200) {
            var response = e.target.response['subsonic-response'];
            this.version = response.version;
            url2 = this.url + "/rest/getMusicFolders.view?u=" + this.user + "&p=" + this.pass + "&f=json&v=" + this.version + "&c=PolySonic";
            if (response.status === 'ok') {
              console.log('Connected to Subconic loading data');
              this.doXhr(url2, 'json', function (e) {
                this.mediaFolders = e.target.response['subsonic-response'].musicFolders.musicFolder;
                /* setting mediaFolder causes a ajax call to get album wall data */
                this.folder = result.mediaFolder || 0;
                if (!e.target.response['subsonic-response'].musicFolders.musicFolder[1]) {
                  this.$.sortBox.style.display = 'none';
                }
                this.tracker.sendAppView('Album Wall');
              }.bind(this));
            } else {
              this.tracker.sendEvent('Connection Error', response.error.meessage);
              this.$.firstRun.toggle();
              this.doToast(response.error.meessage);
            }
          } else {
            this.tracker.sendEvent('Connection Error', e.target.response['subsonic-response'].error.meessage);
            this.$.firstRun.toggle();
            this.doToast(e.target.response['subsonic-response'].error.meessage);
          }
        }.bind(this));
      }
    }.bind(this));

    /* listeners and event handlers */
    var scroller = this.appScroller(),
      audio = this.$.audio,
      maximized = chrome.app.window.current().isMaximized(),
      button = this.$.max,
      timer;

    if (maximized) {
      button.icon = 'check-box-outline-blank';
    } else {
      button.icon = 'flip-to-back';
    }

    scroller.onscroll = function () {
      var fab = this.$.fab,
        wall = this.$.wall;

      if (this.page === 0 && fab.state !== 'off' && scroller.scrollTop < this.position && wall.showing !== 'podcast') {
        fab.state = 'off';
      } else if (this.page === 0 && fab.state !== 'bottom' && scroller.scrollTop > this.position && wall.showing !== 'podcast') {
        fab.state = 'bottom';
      }
      this.position = scroller.scrollTop;
    }.bind(this);

    /*
      only needed if fullscreen enabled

    */
    //window.onresize = this.sizePlayer.bind(this);

    audio.onwaiting = this.playerProgress.bind(this);

    audio.onstalled = function (e) {
      if (timer) {
        clearInterval(timer);
      }
      timer = setInterval(function () {
        this.playerProgress();
      }.bind(this), 250);
    }.bind(this);

    audio.onplay = function (e) {
      if (timer) {
        clearInterval(timer);
      }
    };

    audio.onpause = function (e) {
      if (timer) {
        clearInterval(timer);
      }
      timer = setInterval(function () {
        this.playerProgress();
      }.bind(this), 250);
    }.bind(this);

    audio.ontimeupdate = this.playerProgress.bind(this);

    audio.onended = this.nextTrack.bind(this);

    audio.onerror = function (e) {
      app.page = 0;
      console.error('audio playback error ', e);
      this.doToast('Audio Playback Error');
      this.tracker.sendEvent('Audio Playback Error', e.target);
    }.bind(this);

    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
      if (request.command == "play") {
        this.playPause();
        sendResponse({farewell: "Command Sent"});
      }
    }.bind(this));
  });

  /*
    begin analistics on window load
  */
  window.onload = function () {
    app.service = analytics.getService('PolySonic');
    app.tracker = app.service.getTracker('UA-50154238-6');  // Supply your GA Tracking ID.
  };


  /*
    locale settings
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


  /*
    query size for shuffle options
  */
  app.shuffleSizes = [
    20,
    40,
    50,
    75,
    100,
    200
  ];


  /*
    sort catagoies
  */
  app.sortTypes = [
    {sort: 'newest', name: chrome.i18n.getMessage("newButton")},
    {sort: 'alphabeticalByArtist', name: chrome.i18n.getMessage("byArtistButton")},
    {sort: 'alphabeticalByName', name: chrome.i18n.getMessage("titleButton")},
    {sort: 'frequent', name: chrome.i18n.getMessage("frequentButton")},
    {sort: 'recent', name: chrome.i18n.getMessage("recentButton")}
  ];


  /*
    indexeddb
  */
  app.indexedDB = window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB || window.OIndexedDB || window.msIndexedDB;

  app.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.OIDBTransaction || window.msIDBTransaction;

  app.dbVersion = 1.0;

  app.request = app.indexedDB.open("albumInfo", app.dbVersion);

  app.request.onerror = function () {
    console.log("Error creating/accessing IndexedDB database");
  };

  app.request.onsuccess = function () {
    console.log("Success creating/accessing IndexedDB database");
    app.db = app.request.result;

    // Interim solution for Google Chrome to create an objectStore. Will be deprecated
    if (app.db.setVersion) {
      if (app.db.version !== app.dbVersion) {
        var setVersion = app.db.setVersion(this.dbVersion);
        setVersion.onsuccess = function () {
          app.createObjectStore(this.db);
        };
      }
    }
  };

  app.request.onupgradeneeded = function (event) {
    app.createObjectStore(event.target.result);
  };

  app.createObjectStore = function (dataBase) {
    console.log("Creating objectStore");
    dataBase.createObjectStore("albumInfo");
  };

  app.dbErrorHandler = function (e) {
    console.error(e);
  };

  /* pull image from server */
  app.getImageFile = function (url, id, callback) {
    app.doXhr(url, 'blob', function (e) {
      var blob = new Blob([e.target.response], {type: 'image/jpeg'});
      app.putInDb(blob, id, callback);
      console.log('Image Added to indexedDB ' + id);
    });
  };

  app.putInDb = function (data, id, callback) {
    var transaction = app.db.transaction(["albumInfo"], "readwrite");
    if (id) {
      transaction.objectStore("albumInfo").put(data, id);
      transaction.objectStore("albumInfo").get(id).onsuccess = callback;
    }
  };

  app.calculateStorageSize = function () {
    navigator.webkitTemporaryStorage.queryUsageAndQuota(function (used, remaining) {
      var usedQuota = Math.round(10 * (((used / 1000) / 1000))) / 10,
        remainingQuota = Math.round(10 * ((remaining / 1000) / 1000)) / 10,
        bytes = 'MB';
      if (remainingQuota > 1000) {
        remainingQuota = Math.round(10 * (((remaining / 1000) / 1000) / 1000)) / 10;
        bytes = 'GB';
      }
      app.storageQuota = app.diskUsed + ": " + usedQuota  + " MB, " + app.diskRemaining + ": " + remainingQuota + " " + bytes;
    }, function (e) {
      console.log('Error', e);
    });
  };

  app.getDbItem = function (id, callback) {
    if (id) {
      var transaction = app.db.transaction(["albumInfo"], "readwrite"),
        request = transaction.objectStore("albumInfo").get(id);
      request.onsuccess = callback;
      request.onerror = app.dbErrorHandler;
    }
  };


  /*
    app xhr commands
  */
  app.xhrError = function (e) {
    app.dataLoading = false;
    console.log(e);
    app.doToast(chrome.i18n.getMessage("connectionError"));
  }.bind(this);

  app.doXhr = function (url, dataType, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.responseType = dataType;
    xhr.onload = callback;
    xhr.onerror = app.xhrError;
    xhr.send();
  };



  app.playlist = [];

  app.page = app.page || 0;

  app.pageLimit = false;

  /*
    app window commands
  */
  app.reloadApp = function () {
    chrome.runtime.reload();
  };

  app.minimize = function () {
    chrome.app.window.current().minimize();
  };

  app.maximize = function () {
    var maximized = chrome.app.window.current().isMaximized(),
      button = this.$.max;
    if (maximized) {
      button.icon = 'check-box-outline-blank';
      chrome.app.window.current().restore();
    } else {
      button.icon = 'flip-to-back';
      chrome.app.window.current().maximize();
    }
  };

  app.close = function () {
    window.close();
  };

  /*
    close menu drawer
  */
  app.closeDrawer = function (callback) {
    var panel = app.$.panel;
    panel.closeDrawer();
    callback();
  };

  /*
    open menu drawer
  */
  app.openPanel = function () {
    var panel = app.$.panel;
    panel.openDrawer();
  };

  /*
    get the scrollable element
  */
  app.appScroller = function () {
    return app.$.headerPanel.scroller;
  };

  /*
    call a toast
  */
  app.doToast = function (text) {
    var toast = app.$.toast;
    toast.text = text;
    toast.show();
  };


  /*
    color thief functions
  */
  app.getColor = function (image) {
    var colorThief = new ColorThief();
    return colorThief.getPalette(image, 4);
  };

  app.getContrast50  = function (hexcolor) {
    return (parseInt(hexcolor, 16) > 0xffffff / 2) ? 'black' : 'white';
  };

  app.componentToHex = function (c) {
    var hex = c.toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };

  app.rgbToHex = function (r, g, b) {
    return app.componentToHex(r) + app.componentToHex(g) + app.componentToHex(b);
  };

  /*
    colorArray[0] fab color

    colorArray[1] fab contrasting color

    colorArray[2] progress bar buffering color

    colorArray[3] progress bar background
  */
  app.colorThiefHandler = function (imgURL, artId, callback) {
    var imgElement = new Image();
    imgElement.src = imgURL;
    imgElement.onload = function () {
      var color = app.getColor(imgElement),
        colorArray = [],
        r = color[1][0],
        g = color[1][1],
        b = color[1][2],
        hex = app.rgbToHex(r, g, b);
      colorArray[0] = 'rgb(' + r + ',' + g + ',' + b + ');';
      colorArray[1] = app.getContrast50(hex);
      colorArray[2] = 'rgba(' + r + ',' + g + ',' + b + ',0.5);';
      if (colorArray[1] !== 'white') {
        colorArray[3] = '#444444';
      } else {
        colorArray[3] = '#c8c8c8';
      }
      app.putInDb(colorArray, artId + '-palette', function () {
        callback(colorArray);
        console.log('Color palette saved ' + artId);
      });
    };
  };


  /*
    play functions
  */
  app.playAudio = function (artist, title, src, image, id) {
    var audio = this.$.audio,
      note = this.$.playNotify,
      time = new Date(),
      now = time.getTime(),
      url = this.url + '/rest/scrobble.view?u=' + this.user + '&p=' + this.pass + '&v=' + this.version + '&c=PolySonic&f=json&id=' + id + '&time=' + now;
    if (artist === '') {
      this.currentPlaying = title;
      note.title = title;
    } else {
      this.currentPlaying = artist + ' - ' + title;
      note.title = artist + ' - ' + title;
    }
    this.doXhr(url, 'json', function (e) {
      if (e.target.response['subsonic-response'].status === 'failed') {
        console.log('Last FM submission: ' + e.target.response['subsonic-response'].status);
        this.tracker.sendEvent('Last FM submission', 'Failed');
      }
    }.bind(this));
    audio.src = src;
    audio.play();
    note.icon = image;
    note.show();
    this.tracker.sendEvent('Audio', 'Playing');
  };

  app.playNext = function (next) {
    var audio = app.$.audio;
    if (app.playlist[next]) {
      app.playing = next;
    } else {
      audio.pause();
      app.clearPlaylist();
    }
  };

  app.nextTrack = function () {
    var next = app.playing + 1;
    app.playNext(next);
  };

  app.lastTrack = function () {
    var next = app.playing - 1;
    app.playNext(next);
  };

  app.playThis = function () {
    app.setFabColor(this.playlist[this.playing]);
    var url;
    if (app.playlist[app.playing].artist === '') {
      // is a podcast
      url = this.url + '/rest/stream.view?u=' + app.user + '&p=' + app.pass + '&v=' + app.version + '&c=PolySonic&format=raw&estimateContentLength=true&id=' + app.playlist[this.playing].id;
    } else {
      // normal trascoded file type
      url = this.url + '/rest/stream.view?u=' + app.user + '&p=' + app.pass + '&v=' + app.version + '&c=PolySonic&maxBitRate=' + app.bitRate + '&id=' + app.playlist[this.playing].id;
    }
    app.playAudio(app.playlist[app.playing].artist, app.playlist[app.playing].title, url, app.playlist[app.playing].cover, app.playlist[app.playing].id);
    if (app.playlist[app.playing].cover) {
      app.getImageForPlayer(app.playlist[app.playing].cover, function () {});
    } else {
      app.defaultPlayImage();
    }
  };

  app.playPause = function () {
    var audio = app.$.audio;
    if (!audio.paused) {
      audio.pause();
    } else {
      audio.play();
    }
  };

  app.playPlaylist = function (event, detail, sender) {
    var url = app.url + '/rest/getPlaylist.view?u=' + app.user + '&p=' + app.pass + '&v=' + app.version + '&c=PolySonic&f=json&id=' + sender.attributes.ident.value,
      tracks,
      mins,
      seconds,
      artId,
      obj,
      timeString,
      i = 0;
    app.dataLoading = true;
    app.playlist = null;
    app.playlist = [];
    app.$.audio.pause();
    app.doXhr(url, 'json', function (e) {
      tracks = e.target.response['subsonic-response'].playlist.entry;
      Array.prototype.forEach.call(tracks, function (item) {
        mins = Math.floor(item.duration / 60);
        seconds = Math.floor(item.duration - (mins * 60));
        timeString = mins + ':' + ('0' + seconds).slice(-2);
        artId = "al-" + item.albumId;
        obj = {id: item.id, artist: item.artist, title: item.title, duration: timeString, cover: artId};
        app.fixCoverArtForShuffle(obj, function () {
          i = i + 1;
          if (i === tracks.length) {
            app.doShufflePlayback();
            app.dataLoading = false;
            app.closePlaylists();
          }
        });
      });
    });
  };

  app.shufflePlay = function () {
    app.dataLoading = true;
    app.shuffleLoading = true;
    app.playlist = null;
    app.playlist = [];
    var url,
      imgURL,
      artId,
      obj,
      mins,
      seconds,
      timeString,
      i = 0;

    if (!app.startYearInvalid && !app.endYearInvalid) {
      app.$.audio.pause();
      if (app.endingYear && app.startingYear && app.genreFilter) {
        url = app.url + '/rest/getRandomSongs.view?u=' + app.user + '&p=' + app.pass + '&v=' + app.version + '&c=PolySonic&f=json&size=' + app.shuffleSize + '&genre=' + encodeURIComponent(app.genreFilter) + '&fromYear=' + app.startingYear + '&toYear=' + app.endingYear;
      } else if (app.endingYear && app.startingYear) {
        url = app.url + '/rest/getRandomSongs.view?u=' + app.user + '&p=' + app.pass + '&v=' + app.version + '&c=PolySonic&f=json&size=' + app.shuffleSize + '&fromYear=' + app.startingYear + '&toYear=' + app.endingYear;
      } else if (app.endingYear && app.genreFilter) {
        url = app.url + '/rest/getRandomSongs.view?u=' + app.user + '&p=' + app.pass + '&v=' + app.version + '&c=PolySonic&f=json&size=' + app.shuffleSize + '&genre=' + encodeURIComponent(app.genreFilter) + '&toYear=' + app.endingYear;
      } else if (app.startingYear && app.genreFilter) {
        url = app.url + '/rest/getRandomSongs.view?u=' + app.user + '&p=' + app.pass + '&v=' + app.version + '&c=PolySonic&f=json&size=' + app.shuffleSize + '&genre=' + encodeURIComponent(app.genreFilter) + '&fromYear=' + app.startingYear;
      } else if (app.genreFilter) {
        url = app.url + '/rest/getRandomSongs.view?u=' + app.user + '&p=' + app.pass + '&v=' + app.version + '&c=PolySonic&f=json&size=' + app.shuffleSize + '&genre=' + encodeURIComponent(app.genreFilter);
      } else if (app.startingYear) {
        url = app.url + '/rest/getRandomSongs.view?u=' + app.user + '&p=' + app.pass + '&v=' + app.version + '&c=PolySonic&f=json&size=' + app.shuffleSize + '&fromYear=' + app.startingYear;
      } else if (app.endingYear) {
        url = app.url + '/rest/getRandomSongs.view?u=' + app.user + '&p=' + app.pass + '&v=' + app.version + '&c=PolySonic&f=json&size=' + app.shuffleSize + '&toYear=' + app.endingYear;
      } else {
        url = app.url + '/rest/getRandomSongs.view?u=' + app.user + '&p=' + app.pass + '&v=' + app.version + '&c=PolySonic&f=json&size=' + app.shuffleSize;
      }
      app.doXhr(url, 'json', function (event) {
        var data = event.target.response['subsonic-response'];
        if (data.randomSongs.song) {
          Array.prototype.forEach.call(data.randomSongs.song, function (item) {
            mins = Math.floor(item.duration / 60);
            seconds = Math.floor(item.duration - (mins * 60));
            timeString = mins + ':' + ('0' + seconds).slice(-2);
            artId = "al-" + item.albumId;
            obj = {id: item.id, artist: item.artist, title: item.title, duration: timeString, cover: artId};
            app.fixCoverArtForShuffle(obj, function () {
              i = i + 1;
              if (i === data.randomSongs.song.length) {
                app.doShufflePlayback();
                app.dataLoading = false;
              }
            });
          });
        } else {
          app.doToast(chrome.i18n.getMessage("noMatch"));
          app.shuffleLoading = false;
        }
      });
    } else {
      app.shuffleLoading = false;
      app.doToast(chrome.i18n.getMessage("invalidEntry"));
    }
  };

  app.doShufflePlayback = function () {
    if (app.$.audio.paused) {
      var art = app.url + '/rest/stream.view?u=' + app.user + '&p=' + app.pass + '&v=' + app.version + '&c=PolySonic&maxBitRate=' + app.bitRate + '&id=' + app.playlist[0].id;
      app.playing = 0;
      app.playAudio(app.playlist[0].artist, app.playlist[0].title, art, app.playlist[0].cover, app.playlist[0].id);
      app.getImageForPlayer(app.playlist[0].cover, function () {
        app.page = 1;
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
    app.$.audio.pause();
    app.$.playlistDialog.close();
    app.page = 0;
    app.playlist = null;
    app.playlist = [];
  };


  /*
    volume controls
  */
  app.toggleVolume = function () {
    var dialog = app.$.volumeDialog;
    dialog.open();
  };

  app.closeVolume = function () {
    var dialog = app.$.volumeDialog;
    dialog.close();
  };

  app.volUp = function () {
    if (app.volume < 100) {
      app.volume = app.volume + 2;
    }
  };

  app.volDown = function () {
    if (app.volume > 0) {
      app.volume = app.volume - 2;
    }
  };



  /*
    handle image for player background
  */
  app.getImageForPlayer = function (url, callback) {
    var art = app.$.coverArt,
      note = app.$.playNotify;
    art.style.backgroundImage = "url('" + url + "')";
    note.icon = url;
    callback();
  };

  app.defaultPlayImage = function () {
    var art = app.$.coverArt,
      note = app.$.playNotify;
    art.style.backgroundImage =  "url('images/default-cover-art.png')";
    note.icon = 'images/default-cover-art.png';
  };

  /*
    player UI control
  */
  app.playerProgress = function (e) {
    var audio, button, progress, currentMins, currentSecs, totalMins, totalSecs;
    if (e) {
      if (e.type === 'waiting') {
        app.waitingToPlay = true;
      } else if (e.type === 'timeupdate') {
        app.waitingToPlay = false;
      }
      audio = e.srcElement;
    } else {
      audio = app.$.audio;
    }
    button = app.$.avIcon;
    progress = Math.round((audio.currentTime / audio.duration * 100) * 100) / 100;
    currentMins = Math.floor(audio.currentTime / 60);
    currentSecs = Math.floor(audio.currentTime - (currentMins * 60));
    totalMins = Math.floor(audio.duration / 60);
    totalSecs = Math.floor(audio.duration - (totalMins * 60));
    if (audio.duration) {
      app.buffer = (audio.buffered.end(0) / audio.duration) * 100;
    } else {
      app.buffer = 0;
    }

    if (!audio.paused) {
      button.icon = "av:pause";
      app.isNowPlaying = true;
      if (!audio.duration) {
        app.contentLoading = true;
        app.playTime = currentMins + ':' + ('0' + currentSecs).slice(-2) + ' / ?:??';
        app.progress = 0;
      } else {
        app.contentLoading = false;
        app.playTime = currentMins + ':' + ('0' + currentSecs).slice(-2) + ' / ' + totalMins + ':' + ('0' + totalSecs).slice(-2);
        app.progress = progress;
      }
    } else {
      app.isNowPlaying = false;
      button.icon = "av:play-arrow";
    }
  };
}());
