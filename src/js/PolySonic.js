(function () {

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
      var loader = document.querySelector('#loader');
      _transitionElement(loader, 'transform 350ms ease-out', 'translateY(-102%)').then(resolve);
    });
  }

  function cascadeElements() {
    var albums = document.querySelectorAll('.js-album-hidden');
    var count = albums.length;
    for (var i = 0; i < count; i++) {
      var delay = 30 * i;
      var element = albums[i];
      _transitionElement(element, 'all 200ms ' + delay + 'ms ease-in', 'translateY(0px)', 1, 'transform opacity');
    }
  }

  function setRoute(hash) {
    location.hash = hash;
  }

  function hashChangeCallback() {
    var hash = location.hash.split('/');
    console.log(hash);
    // switch (hash[0]) {
    //
    // }
  }

  window.addEventListener('hashchange', hashChangeCallback);

  window.onload = function (_) {
    var app = document.querySelector('#app');
    app.page = 0;
    app.albums = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
    setTimeout(function (_) {
      return showApp().then(cascadeElements);
    }, 1000);
  };
})();
//# sourceMappingURL=PolySonic.js.map
