(function () {
  const app = document.querySelector('#app');

  function _transitionElement(el, transition, transform, opacity, willChange) {
    return new Promise(resolve => {
      const _transitionEnd = _ => {
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
      requestAnimationFrame(_ => {
        el.style.transform = transform;
        if (opacity === undefined) {
          return;
        }
        el.style.opacity = opacity;
      });
    });
  }


  function showApp() {
    return new Promise(resolve => {
      const loader = document.querySelector('#loader');
      _transitionElement(loader, 'transform 350ms ease-out', 'translateY(-102%)').then(resolve);
    });
  }


  function cascadeElements() {
    const albums = document.querySelectorAll('.js-album-hidden');
    const count = albums.length;
    for (var i = 0; i < count; i++) {
      var delay = 30 * i;
      var element = albums[i];
      _transitionElement(
        element,
        'all 150ms ' + delay + 'ms ease-in',
        'translateY(0px)',
        1,
        'transform opacity'
      );
    }
  }

  function goToPage(page) {
    // configure main page animations
    switch (true) {

      // going to setting page
      case (page === 3):
        app.entryAnimation = 'slide-from-bottom-animation';
        app.exitAnimation = 'fade-out-animation';
        break;

      // comming from settings page
      case (app.page === 3):
        app.entryAnimation = 'fade-in-animation';
        app.exitAnimation = 'slide-down-animation';
        break;

      // app other pages
      case (page < app.page):
        app.entryAnimation = 'slide-from-left-animation';
        app.exitAnimation = 'slide-right-animation';
        break;
      case (page > app.page):
        app.entryAnimation = 'slide-from-right-animation';
        app.exitAnimation = 'slide-left-animation';
        break;
    }
    app.page = page;
  }

  function setRoute(hash) {
    app.lastHash = location.hash;
    location.hash = hash;
  }

  function hashChangeCallback() {
    const hash = location.hash.split('/');
    switch (hash[0]) {
      case '':
        setRoute('#Albums');
        return;
        break;
      case '#Albums':
        goToPage(0);
        app.subPage = 0;
        break;
      case '#Artists':
        goToPage(0);
        app.subPage = 1;
        break;
      case '#Podcasts':
        goToPage(0);
        app.subPage = 2;
        break;
      case '#Settings':
        goToPage(3)
        break;
    }
  }

  function testConnection(obj) {
    return new Promise((resolve, reject) => {
      var subsonic = new SubsonicAPI(obj);
      const readyCallback = function (event) {
        document.removeEventListener('subsonicApi-ready', readyCallback);
        if (event.detail.status === 'ok') {
          resolve(subsonic);
        } else {
          reject();
        }
      };
      document.addEventListener('subsonicApi-ready', readyCallback);
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
    return currentConfig;
  }

  function saveConfigs(config) {
    app.configs[app.currentConfig] = config;
    simpleStorage.setSync({
      configs: app.configs
    });
  }

  function mainPageAnimationFinished() {
    if (!app.page === 0 && app.subPage === 0) {
      app.subsonic[app.request](app.sortType , 30, 0, (function () {
        if (app.mediaFolder !== 'none') {
          return app.mediaFolder;
        }
        return;
      })()).then(response => {
        app.albums = response;
        return;
      }).then(cascadeElements).catch(err => console.error(err));
    }

  }

  app.openDrawer = function () {
    app.$.appDrawer.openDrawer();
  };

  app.settings = function () {
    app.$.appDrawer.closeDrawer();
    setRoute('#Settings');
  };

  app.back = function () {
    setRoute(app.lastHash);
  };

  window.addEventListener('hashchange', hashChangeCallback);
  hashChangeCallback();
  app.addEventListener('dom-change', _ => {
    simpleStorage.getSync().then(syncStorage => {
      app.dataLoading = false;
      app.sortType = syncStorage.sortType;
      app.request = syncStorage.request;
      app.mediaFolder = syncStorage.mediaFolder;
      app.configs = syncStorage.configs;
      simpleStorage.getLocal().then(local => {
        app.currentConfig = local.currentConfig || 0;
        app.bitRate = local.bitRate || '320';
        if (!app.configs) {
          // display login dialog
          return;
        }
        const currentConfig = updateConfig(app.configs[app.currentConfig]);

        saveConfigs(currentConfig);
        app.async(_ => {
          testConnection({
            https: currentConfig.https,
            ip: currentConfig.ip,
            port: currentConfig.port,
            user: currentConfig.user,
            password: currentConfig.pass,
            appName: 'PolySonic',
            md5Auth: currentConfig.md5Auth
          }).then(subsonic => {
            app.subsonic = subsonic;

            // make first request
            app.subsonic[app.request](app.sortType , 30, 0, (function () {
              if (app.mediaFolder !== 'none') {
                return app.mediaFolder;
              }
              return;
            })()).then(response => {
              app.albums = response;
              return;
            }).then(showApp).then(cascadeElements).catch(err => console.error(err));
          }).catch(_ => {
            console.log(currentConfig)
          });
        });

      });

    });
  });


})();
