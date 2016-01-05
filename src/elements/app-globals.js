(function () {
  'use strict';

  var app = document.querySelector('#tmpl');

  /**
   * return chrome localization string
   */
  function getMessage(id) {
    return chrome.i18n.getMessage(id);
  }

  /**
   * default xhr error
   * @param {Error} e
   */
  function xhrError(e) {
    app.dataLoading = false;
    app.doToast(getMessage("connectionError"));
    console.error(e);
    if (!document.querySelector('#loader').classList.contains("hide")) {
      app.$.firstRun.open();
    }
  }

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

  /**
   * use colorthief to get palette from cover art
   * @param {image element} image
   */
  function getColor(image) {
    var colorThief = new ColorThief();
    return colorThief.getPalette(image, 4);
  }
  /**
   * get contrasting color
   * @param {String} hexcolor
   */
  function getContrast50(hexcolor) {
    return (parseInt(hexcolor, 16) > 0xffffff / 2) ? 'black' : 'white';
  }

  /**
   * convert component to hex value
   */
  function componentToHex(c) {
    var hex = c.toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  }

  /**
   * convert rgb values to hex color
   * @param {Number} r
   * @param {Number} g
   * @param {Number} b
   */
  function rgbToHex(r, g, b) {
    return componentToHex(r) + componentToHex(g) + componentToHex(b);
  }

  var texts = {
    fromStart: getMessage('fromStart'),
    playFrom: getMessage('playFrom'),
    hasBookmark: getMessage('hasBookmark'),
    moreLikeThis: getMessage("moreLikeThis"),
    backButton: getMessage("backButton"),
    playTrackLabel: getMessage("playTrack"),
    moreOptionsLabel: getMessage("moreOptionsLabel"),
    closeLabel: getMessage("closeLabel"),
    add2PlayQueue: getMessage("add2PlayQueue"),
    favoriteAlbum: getMessage("favoriteAlbum"),
    downloadButton: getMessage("downloadButton"),
    albumTracklist: getMessage("albumTracklist"),
    deletebookMarkConfirm: getMessage('deletebookMarkConfirm'),
    accept: getMessage("accept"),
    decline: getMessage("decline"),
    added2Queue: chrome.i18n.getMessage("added2Queue"),
    noResults: chrome.i18n.getMessage("noResults")
  };

  /**
   *  polymer things
   */
  Polymer('app-globals', {
    ready: function () {
      this.texts = texts;
    },

    /**
     * convert seconds to readable form
     * @param {Number} sec
     */
    secondsToMins: function (sec) {
      var mins = Math.floor(sec / 60);
      return mins + ':' + ('0' + Math.floor(sec - (mins * 60))).slice(-2);
    },


    /**
     * attach opacity animation to give element
     * @param {Element} el - dom element to attach animation to
     */
    attachAnimation: function (el) {
      var animation = new CoreAnimation();
      animation.duration = 1000;
      animation.iterations = 'Infinity';
      animation.keyframes = [
        {
          opacity: 1
        }, {
          opacity: 0
        }
      ];
      animation.target = el;
      return animation;
    },

    /**
     * display toast message to user
     * @param {String} text
     */
    makeToast: function (text) {
      var toast = app.$.toast;
      toast.text = text;
      toast.show();
    },



    /**
     * xhr
     * @param {String} url
     * @param {String} dataType
     * @param {Function} callback
     */
    doXhr: function (url, dataType) {
      return new Promise((resolve, reject) => {
        var xhr = new XMLHttpRequest();
        xhr.open("GET", url, true);
        xhr.responseType = dataType;
        xhr.onload = resolve;
        xhr.onerror = xhrError;
        xhr.send();
      });
    },


    /**
     * store object in indexeddb
     * @param {Object} data
     * @param {String} id
     * @param {Function} callback
     */
    putInDb: function (data, id) {
      return new Promise((resolve, reject) => {
        var transaction = app.db.transaction(["albumInfo"], "readwrite");
        if (id) {
          transaction.objectStore("albumInfo").put(data, id);
          transaction.objectStore("albumInfo").get(id).onsuccess = resolve;
        }
      });
    },


    /**
     * fetch a item from indexeddb
     * @param {String} id
     * @param {Function} callback
     */
    getDbItem: function (id) {
      return new Promise((resolve, reject) => {
        if (id) {
          var transaction = app.db.transaction(["albumInfo"], "readwrite"),
            request = transaction.objectStore("albumInfo").get(id);
          request.onsuccess = resolve;
          request.onerror = reject;
        }
      });
    },


    /**
     * Fetch image from subsonic server and store it in indexeddb
     * @param {String} url
     * @param {String} id
     * @param {Function} callback
     */
    getImageFile: function (url, id) {
      return new Promise((resolve, reject) => {
        this.doXhr(url, 'blob').then((e) => {
          this.putInDb(
            new Blob([ e.target.response ], { type: 'image/jpeg' }), id
          ).then((e) => {
            resolve(e);
          });
        });
      });
    },


    /**
     * capture color palette from image and store in indexeddb
     * @param {String} imgURL
     * @param {String} artId
     * @param {Function} callback - returns an array of colors
     */
    stealColor: function (imgURL, artId) {
      return new Promise((resolve, reject) => {
        var imgElement = new Image();
        imgElement.src = imgURL;
        imgElement.onload = () => {
          var color = getColor(imgElement);
          var colorArray = [];
          var r = color[1][0];
          var g = color[1][1];
          var b = color[1][2];
          colorArray[0] = 'rgb(' + r + ',' + g + ',' + b + ');';
          colorArray[1] = getContrast50(rgbToHex(r, g, b));
          colorArray[2] = 'rgba(' + r + ',' + g + ',' + b + ',0.4);';
          if (colorArray[1] !== 'white') {
            colorArray[3] = '#444444';
          } else {
            colorArray[3] = '#c8c8c8';
          }
          this.putInDb(colorArray, artId + '-palette', function () {
            resolve(colorArray);
          });
        };
      });
    },

    /**
     * generate a subsonic url string
     * @param {String} method
     * @param {Object} options
     */
    buildUrl: function(method, options) {
      if (options !== null && typeof options === 'object') {
        options = '&' + toQueryString(options);
      }
      if (app.user !== app.params.u) {
        app.params.u = app.user;
      }
      if (app.version !== app.params.v) {
        app.params.v = app.version;
      }
      if (versionCompare(app.version, '1.13.0') >= 0 && app.md5Auth) {
        if (app.params.p) {
          delete app.params.p;
        }
        app.params.s = makeSalt(16);
        app.params.t = md5(app.pass + app.params.s);
        return app.url + '/rest/' + method + '.view?' + toQueryString(app.params) + options;
      } else {
        if (app.params.t) {
          delete app.params.t;
          delete app.params.s;
        }
        app.params.p = app.pass.hexEncode();
        return app.url + '/rest/' + method + '.view?' + toQueryString(app.params) + options;
      }
    }
  });

})();
