(function () {
  /*
    cast API
  */
  function onRequestSessionSuccess(e) {
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
  };

  function requestSession() {
    chrome.cast.requestSession(onRequestSessionSuccess, onLaunchError);
  }




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
      storageQuota = this.diskUsed + ": " + usedQuota  + " MB, " + this.diskRemaining + ": " + remainingQuota + " " + bytes;
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
      storageQuota: storageQuota
    },
    ready: function () {
      this.service = analytics.getService('PolySonic');
      this.tracker = this.service.getTracker('UA-50154238-6');
    }
  });
}());
