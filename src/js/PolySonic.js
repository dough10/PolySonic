(function () {
  var app = document.querySelector('#app');

  function _transitionElement(el, transition, transform, opacity, willChange) {
    return new Promise(function (resolve) {
      var _transitionEnd = function (_) {
        el.style.transition = 'initial';
        el.style.willChange = 'initial';
        el.removeEventListener('transitionend', _transitionEnd);
        if (el.classList.contains('js-album-hidden')) {
          el.classList.remove('js-album-hidden');
        }
        resolve();
      };
      el.style.transition = transition;
      el.style.willChange = willChange || 'transform';
      el.addEventListener('transitionend', _transitionEnd);
      requestAnimationFrame(function (_) {
        el.style.transform = transform;
        if (opacity === undefined) {
          return;
        }
        el.style.opacity = opacity;
      });
    });
  }

  function showApp() {
    return new Promise(function (resolve) {
      if (app.shown) {
        resolve();
      }
      var loader = document.querySelector('#loader');
      _transitionElement(loader, 'transform 350ms ease-out', 'translateY(-102%)').then(function (_) {
        app.shown = true;
        resolve();
      });
    });
  }

  function cascadeElements() {
    var albums = document.querySelectorAll('.js-album-hidden');
    var count = albums.length;
    for (var i = 0; i < count; i++) {
      var delay = 25 * i;
      var element = albums[i];
      _transitionElement(element, 'all 150ms ' + delay + 'ms ease-in', 'translateY(0px)', 1, 'transform opacity');
    }
  }

  function goToPage(page) {
    // configure main page animations
    switch (true) {

      // going to setting page
      case page === 3:
        app.entryAnimation = 'slide-from-bottom-animation';
        app.exitAnimation = 'fade-out-animation';
        break;

      // comming from settings page
      case app.page === 3:
        app.entryAnimation = 'fade-in-animation';
        app.exitAnimation = 'slide-down-animation';
        break;

      // app other pages
      case page < app.page:
        app.entryAnimation = 'slide-from-left-animation';
        app.exitAnimation = 'slide-right-animation';
        break;
      case page > app.page:
        app.entryAnimation = 'slide-from-right-animation';
        app.exitAnimation = 'slide-left-animation';
        break;
    }
    app.page = page;
  }

  function setRoute(hash) {
    app.requestOffset = 0;
    app.lastHash = location.hash;
    location.hash = hash;
  }

  function hashChangeCallback() {
    var hash = location.hash.split('/');
    console.log(hash);
    if (app.albums && app.albums.length) app.albums = [];
    if (app.artists && app.artists.length) app.artists = [];
    switch (hash[0]) {
      case '':
        return;
        break;
      case '#Albums':
        if (!hash[1]) {
          setRoute('#Albums/newest');
          return;
        }
        app.requestOffset = 0;
        app.request = 'getAlbumList2';
        if (['newest', 'alphabeticalByArtist', 'alphabeticalByName', 'frequent', 'recent'].indexOf(hash[1]) < 0) {
          setRoute('#Albums/newest');
          return;
        }
        app.sortType = hash[1];
        if (app.page === 0 && app.subPage === 0) app.mainPageAnimationFinished();
        app.subPage = 0;
        goToPage(0);
        break;
      case '#Artists':
        app.request = 'getArtists';
        if (app.page === 0 && app.subPage === 1) app.mainPageAnimationFinished();
        app.subPage = 1;
        goToPage(0);
        break;
      case '#Podcasts':
        app.request = 'getPodcasts';
        if (app.page === 0 && app.subPage === 2) app.mainPageAnimationFinished();
        app.subPage = 2;
        goToPage(0);
        break;
      case '#Settings':
        goToPage(3);
        break;
    }
    app.async(function (_) {
      if (!app.shown) app.mainPageAnimationFinished();
    });
    requestIdleCallback(function (deadLine) {
      simpleStorage.setSync({
        lastHash: location.hash
      });
      console.log(deadLine);
    });
  }

  /**
   * upgrade old connection config with the new needed info
   *
   * @param {Object} oldConfig
   */
  function updateConfig(oldConfig) {
    var currentConfig = oldConfig;
    if (currentConfig.url) {
      var url = new URL(currentConfig.url);
      currentConfig.ip = url.host;
      if (url.protocol === "https:") {
        currentConfig.https = true;
        if (!currentConfig.port) {
          currentConfig.port = 443;
        }
      } else {
        currentConfig.https = false;
        if (!currentConfig.port) {
          currentConfig.port = 80;
        }
      }
      delete currentConfig.url;
      if (!currentConfig.md5Auth) {
        currentConfig.md5Auth = true;
      }
    }
    if (currentConfig.pass) {
      currentConfig.password = currentConfig.pass;
      delete currentConfig.pass;
    }
    return currentConfig;
  }

  function saveConfigs(config) {
    app.configs[app.currentConfig] = config;
    simpleStorage.setSync({
      configs: app.configs
    });
  }

  function requestAlbums() {
    app.pageLimit = false;
    app.dataLoading = true;
    app.subsonic[app.request](app.sortType, app.requestSize, app.requestOffset, function () {
      if (app.mediaFolder !== 'none') {
        return app.mediaFolder;
      }
      return;
    }()).then(function (response) {
      app.dataLoading = false;
      if (response === undefined) {
        app.pageLimit = true;
        return;
      }
      app.albums = app.albums.concat(response);
      return;
    }).then(showApp).then(function (_) {
      return requestAnimationFrame(cascadeElements);
    }).catch(function (err) {
      return console.error(err);
    });
  }

  function requestArtists() {
    app.pageLimit = false;
    app.dataLoading = true;
    app.subsonic[app.request]().then(function (artists) {
      app.dataLoading = false;
      app.artists = artists;
      return;
    }).then(showApp).then(function (_) {
      return requestAnimationFrame(cascadeElements);
    }).catch(function (err) {
      return console.error(err);
    });
  }

  function requestPodcasts() {}

  app.testConnection = function (obj) {
    return new Promise(function (resolve, reject) {
      var subsonic = new SubsonicAPI(obj);
      var readyCallback = function (event) {
        document.removeEventListener('subsonicApi-ready', readyCallback);
        if (event.detail.status === 'ok') {
          resolve(subsonic);
        } else {
          reject();
        }
      };
      document.addEventListener('subsonicApi-ready', readyCallback);
    });
  };

  app.mainPageAnimationPrepare = function (e) {};

  app.mainPageAnimationFinished = function (e) {
    switch (true) {

      case app.page === 0 && app.subPage === 0:
        requestAlbums();
        break;

      case app.page === 0 && app.subPage === 1:
        requestArtists();
        break;

      case app.page === 0 && app.subPage === 2:
        requestPodcasts();
        break;
    }
  };

  app.openDrawer = function () {
    app.$.appDrawer.openDrawer();
  };

  app.newestAlbums = function () {
    app.$.appDrawer.closeDrawer();
    setRoute('#Albums/newest');
  };

  app.byArtistAlbums = function () {
    app.$.appDrawer.closeDrawer();
    setRoute('#Albums/alphabeticalByArtist');
  };

  app.byNameAlbums = function () {
    app.$.appDrawer.closeDrawer();
    setRoute('#Albums/alphabeticalByName');
  };

  app.frequestAlbums = function () {
    app.$.appDrawer.closeDrawer();
    setRoute('#Albums/frequent');
  };

  app.recentAlbums = function () {
    app.$.appDrawer.closeDrawer();
    setRoute('#Albums/recent');
  };

  app.getArtists = function () {
    app.$.appDrawer.closeDrawer();
    setRoute('#Artists');
  };

  app.settings = function () {
    app.$.appDrawer.closeDrawer();
    setRoute('#Settings');
  };

  app.back = function () {
    setRoute(app.lastHash);
  };

  window.addEventListener('hashchange', hashChangeCallback);
  app.addEventListener('dom-change', function (_) {
    app.apge = 0;
    app.subPage = 0;
    app.scrollTarget = app.$.mainPageHeader.scroller;
    app.scrollTarget.onscroll = function (e) {
      if (app.scrollTarget.scrollTop === app.scrollTarget.scrollHeight - app.scrollTarget.offsetHeight && app.page === 0 && app.subPage === 0 && !app.pageLimit) {
        app.requestOffset = app.requestOffset + app.requestSize;
        requestAlbums();
      }
    };
    simpleStorage.getSync().then(function (syncStorage) {
      app.albums = [];
      app.artists = [];
      app.shown = false;
      app.dataLoading = false;
      app.pageLimit = false;
      app.shuffleSettings = {};
      app.shuffleSizes = [20, 40, 50, 75, 100, 200];
      app.requestOffset = 0;
      app.requestSize = syncStorage.requestSize || 60;
      app.sortType = syncStorage.sortType || 'newest';
      app.request = syncStorage.request || 'getAlbumList2';
      app.mediaFolder = syncStorage.mediaFolder || 'none';
      app.configs = syncStorage.configs;
      simpleStorage.getLocal().then(function (local) {
        app.currentConfig = local.currentConfig || 0;
        app.bitRate = local.bitRate || '320';
        if (!app.configs) {
          // display login dialog
          return;
        }
        var currentConfig = updateConfig(app.configs[app.currentConfig]);

        saveConfigs(currentConfig);
        app.testConnection({
          https: currentConfig.https,
          ip: currentConfig.ip,
          port: currentConfig.port,
          user: currentConfig.user,
          password: currentConfig.password,
          appName: 'PolySonic',
          md5Auth: currentConfig.md5Auth
        }).then(function (subsonic) {
          app.subsonic = subsonic;
          simpleStorage.getSync('lastHash').then(function (lastHash) {
            console.log(lastHash);
            if (!lastHash) {
              setRoute('#Albums/newest');
              return;
            }
            setRoute(lastHash);
          });
        }, function (_) {
          console.log(currentConfig);
        });
      });
    });
  });
})();
//# sourceMappingURL=PolySonic.js.map
