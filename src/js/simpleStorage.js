/**
 * title: simpleStorage
 * author: Jimmy Doughten
 * version: 0.1
 * 2015
 *
 * a simple storage wrapper that will give 1 api for dealing with saving / getting settings in web apps.
 * intended to make it easy to code for 1 api then use in either a chrome packaged app or on the web.
 *
 * a chrome packaged app will use the chome.storage api while non chrome apps will fallback to localStorage
 *
 *
 */
window.simpleStorage = (function () {
  var simpleStorage = {

    /**
     * feature detect chrome app features
     */
    isChromeApp: 'chrome' in window && 'storage' in chrome,

    /**
     * feature detect localStorage
     */
    hasLocalStorage: 'localStorage' in window,

    /**
     * chrome.storage.sync api if avaliable fallback to localStorage
     * saves are synced to chrome account and shared between sessions
     * returns a promise with a data object
     *
     * @param {String} item - optional* key to look up
     *
     * @example
     * simpleStorage.getSync().then(function (data) {
     *   console.log(data);
     * });
     *
     * get one
     * simpleStorage.getSync('thing').then(function (data) {
     *   // data will be the value of localStorage.thing or chrome.storage equivilant
     *   console.log(data);
     * });
     */
    getSync: function (item) {
      return new Promise(function (resolve, reject) {
        if (this.isChromeApp) {
          chrome.storage.sync.get(function (cStorage) {
            var thing;
            if (item && item in cStorage) {
              thing = cStorage[item];
            } else if (item) {
              thing = undefined;
            } else if (!item) {
              thing = cStorage;
            }
            resolve(thing);
          });
        } else if (this.hasLocalStorage) {
          if (item) {
            try {
              var data = JSON.parse(localStorage[item]);
              if (data.type === typeof data.value) {
                resolve(data.value);
              }
            } catch(e) {
              resolve(localStorage[item]);
            }
          } else {
            var newObj = {};
            for (var key in localStorage) {
              try {
                var singleData = JSON.parse(localStorage[key]);
                if (singleData.type === typeof singleData.value) {
                  newObj[key] = singleData.value;
                }
              } catch(e) {
                newObj[key] = localStorage[key];
              }
            }
            resolve(newObj);
          }
        } else {
          console.warn('localStorage is not supported in your browser');
        }
      }.bind(this));
    },

    /**
     * chrome.storage.local api if avaliable fallback to localStorage
     * saves are local only
     * returns a promise with a data object
     *
     * @param {String} item - optional* key to look up
     *
     * @example
     * get all items
     * simpleStorage.getLocal().then(function (data) {
     *   console.log(data);
     * });
     *
     * get one
     * simpleStorage.getLocal('thing').then(function (data) {
     *   // data will be the value of localStorage.thing or chrome.storage equivilant
     *   console.log(data);
     * });
     */
    getLocal: function (item) {
      return new Promise(function (resolve, reject) {
        if (this.isChromeApp) {
          chrome.storage.local.get(function (cStorage) {
            var thing;
            if (item && item in cStorage) {
              thing = cStorage[item];
            } else if (item) {
              thing = undefined;
            } else if (!item) {
              thing = cStorage;
            }
            resolve(thing);
          });
        } else if (this.hasLocalStorage) {
          if (item) {
            try {
              var singleData = JSON.parse(localStorage[item]);
              if (singleData.type === typeof singleData.value) {
                resolve(singleData.value);
              }
            } catch(e) {
              resolve(localStorage[item]);
            }
          } else {
            var newObj = {};
            for (var key in localStorage) {
              try {
                var data = JSON.parse(localStorage[key]);
                if (data.type === typeof data.value) {
                  newObj[key] = data.value;
                }
              } catch(e) {
                newObj[key] = localStorage[key];
              }
            }
            resolve(newObj);
          }
        } else {
          console.warn('localStorage is not supported in your browser');
        }
      }.bind(this));
    },

    /**
     * chrome.storage.sync api if avaliable fallback to localStorage
     * saves are synced to chrome account and shared between sessions
     * @param {Object} object - data to save in storage
     *
     * @example
     * simpleStorage.setSync({
     *   key: value,
     *   Key2: value
     * });
     */
    setSync: function (object) {
      if (object && typeof object === 'object') {
        if (this.isChromeApp) {
          chrome.storage.sync.set(object);
        } else if (this.hasLocalStorage) {
          for (var key in object) {
            localStorage[key] = JSON.stringify({
              value: object[key],
              type: typeof object[key]
            });
          }
        } else {
          console.warn('localStorage is not supported in your browser');
        }
      } else {
        throw new Error('data must be an object');
      }
    },

    /**
     * chrome.storage.local api if avaliable fallback to localStorage
     * saves are local only
     * @param {Object} object - data to save in storage
     *
     * @example
     * simpleStorage.setLocal({
     *   key: value,
     *   Key2: value
     * });
     */
    setLocal: function (object) {
      if (object && typeof object === 'object') {
        if (this.isChromeApp) {
          chrome.storage.local.set(object);
        } else if (this.hasLocalStorage) {
          for (var key in object) {
            localStorage[key] = JSON.stringify({
              value: object[key],
              type: typeof object[key]
            });
          }
        } else {
          console.warn('localStorage is not supported in your browser');
        }
      } else {
        throw new Error('data must be an object');
      }
    }
  };

  return simpleStorage;
}());
