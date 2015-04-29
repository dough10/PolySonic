(function () {

  /*
    indexeddb
  */
  var indexedDB = window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB || window.OIndexedDB || window.msIndexedDB;

  var IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.OIDBTransaction || window.msIDBTransaction;

  var dbVersion = 1.0;

  var request = indexedDB.open("albumInfo", dbVersion);

  request.onerror = function () {
    console.log("Error creating/accessing IndexedDB database");
  };

  request.onsuccess = function () {
    console.log("Success creating/accessing IndexedDB database");
    var db = request.result;

    // Interim solution for Google Chrome to create an objectStore. Will be deprecated
    if (db.setVersion) {
      if (db.version !== dbVersion) {
        var setVersion = db.setVersion(dbVersion);
        setVersion.onsuccess = function () {
          this.createObjectStore(db);
        };
      }
    }
  };

  request.onupgradeneeded = function (event) {
    createObjectStore(event.target.result);
  };

  function createObjectStore(dataBase) {
    console.log("Creating objectStore");
    dataBase.createObjectStore("albumInfo");
  }

  function getImageFile(url, id, callback) {
    doXhr(url, 'blob', function (e) {
      var blob = new Blob([e.target.response], {type: 'image/jpeg'});
      putInDb(blob, id, callback);
      console.log('Image Added to indexedDB ' + id);
    });
  }

  function putInDb(data, id, callback) {
    var transaction = db.transaction(["albumInfo"], "readwrite");
    if (id) {
      transaction.objectStore("albumInfo").put(data, id);
      transaction.objectStore("albumInfo").get(id).onsuccess = callback;
    }
  }

  var storageQuota;

  function calculateStorageSize() {
    navigator.webkitTemporaryStorage.queryUsageAndQuota(function (used, remaining) {
      var usedQuota = Math.round(10 * (((used / 1000) / 1000))) / 10,
        remainingQuota = Math.round(10 * ((remaining / 1000) / 1000)) / 10,
        bytes = 'MB';
      if (remainingQuota > 1000) {
        remainingQuota = Math.round(10 * (((remaining / 1000) / 1000) / 1000)) / 10;
        bytes = 'GB';
      }
      storageQuota = chrome.i18n.getMessage("diskused") + ": " + usedQuota  + " MB, " + chrome.i18n.getMessage("diskRemaining") + ": " + remainingQuota + " " + bytes;
    }, function (e) {
      console.log('Error', e);
    });
  }
  calculateStorageSize();

  function dbErrorHandler(e) {
    console.error(e);
  }

  function getDbItem(id, callback) {
    if (id) {
      var transaction = db.transaction(["albumInfo"], "readwrite"),
        request = transaction.objectStore("albumInfo").get(id);
      request.onsuccess = callback;
      request.onerror = dbErrorHandler;
    }
  }

  /*
    XML HTTP Request
  */
  function xhrError(e) {
    var app = document.getElementById('tmpl');
    app.dataLoading = false;
    console.log(e);
    doToast(chrome.i18n.getMessage("connectionError"));
  }

  function doXhr(url, dataType, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.responseType = dataType;
    xhr.onload = callback;
    xhr.onerror = xhrError;
    xhr.send();
  }

  Polymer('app-globals', {
    publish: {
      storageQuota: '',
      tracker: '',
      service: ''
    },
    ready: function () {
      console.log('globals Ready');
      this.service = analytics.getService('PolySonic');
      this.tracker = this.service.getTracker('UA-50154238-6');
      this.storageQuota  = storageQuota;
    }
  });
}());
