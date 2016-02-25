(function () {
  'use strict';

  function _errorHandler(e) {
    console.error(e);
  }
  
  Polymer('download-manager', {
  
    _app: document.querySelector('#tmpl'),
    
    _isDownloading: false,
  
    hasSaved: false,
  
    _removeThis: function () {
      this.parentNode.removeChild(this);
      this.async(function () {
        if (this._app.$.downloads.childElementCount === 0) {
          this._app.isDownloading = false;
        }
      }, null, 100);
    },
  
    _doXhr: function (url, dataType) {
      return new Promise(function (resolve, reject) {
        var xhr = new XMLHttpRequest();
        xhr.open("GET", url, true);
        xhr.responseType = dataType;
        xhr.onload = resolve;
        xhr.onerror = _errorHandler;
        xhr.onprogress = this._xhrProgress.bind(this);
        xhr.send();
        this._request = xhr;
      }.bind(this));
    },
  
    _xhrProgress: function (e) {
      this._progress = Math.floor((e.loaded / this._downloadSize) *  100);
      var now = new Date().getTime();
      var bits = e.loaded * 8;
      var timeElapsed = Math.abs((now - this._start) / 1000);
      var Bps = Math.abs(bits / timeElapsed);
      var Kbps = Math.abs(Bps / 1024).toFixed(2);
      var Mbps = Math.abs(Kbps / 1024).toFixed(2);
      if (Mbps < 1) {
        this._rate = Kbps + ' Kbps';
      } else {
        this._rate = Mbps + ' Mbps';
      }
      this._output = this.$.globals.formatBytes(e.loaded) + ' of ' + this._downloadSizeReadable + ' Downloaded';
    },

    _downloadFile: function (id, details) {
      return new Promise(function (resolve, reject) {
        var downloadUrl = this.$.globals.buildUrl('download', {
          id : id
        });
        this._downloadSize = details.size;
        this._isDownloading = true;
        this._downloadSizeReadable = this.$.globals.formatBytes(this._downloadSize);
        this._start = new Date().getTime();
        resolve();
        this._progress = 0;
        this._doXhr(downloadUrl, 'blob').then(function (e) {
          this._blob = e.target.response;
          this._progress = 100;
          this.$.globals.makeToast(chrome.i18n.getMessage('downloadFinished'));
          this._downloadSizeReadable = this.$.globals.formatBytes(this._blob.size);
          this._output = 'File Downloaded ' + this._downloadSizeReadable;
          this._isDownloading = false;
        }.bind(this));
      }.bind(this));
    },
  

    downloadTrack: function (id) {
      var songUrl = this.$.globals.buildUrl('getSong', {
        id: id
      });
      this._doXhr(songUrl, 'json').then(function (e) {
        var details = e.target.response['subsonic-response'].song;
        this._fileName = details.artist + ' - ' + details.title + '.' + details.suffix;
        this._downloadFile(id, details).then(function () {
          this.$.globals.makeToast(chrome.i18n.getMessage('downloadStarted'));
        }.bind(this));
      }.bind(this));
    },

    downloadAlbum: function (details) {
      this._fileName = details.artist + ' - ' + details.album + '.zip';
      this._downloadFile(details.id, details).then(function () {
        this.$.globals.makeToast(chrome.i18n.getMessage('downloadStarted'));
      }.bind(this));
    },
  
    downloadSinglePodcast: function (details) {
      this._fileName = details.title.replace(':', '-') + '.' + details.suffix;
      this._downloadFile(details.id, details).then(function () {
        this.$.globals.makeToast(chrome.i18n.getMessage('downloadStarted'));
      }.bind(this));
    },
  
    _doSave: function () {
      this._output = 'Saving.. ' + this._downloadSizeReadable;
      var config = {
        type: 'saveFile',
        suggestedName: this._fileName
      };
      chrome.fileSystem.chooseEntry(config, function (writableEntry) {
        if (writableEntry) {
          this.$.globals._writeFileEntry(writableEntry, this._blob).then(function () {
            this._output = 'File Saved ' + this._downloadSizeReadable;
            this.hasSaved = true;
          }.bind(this));
        } else {
          console.error('Error Downloading', e);
        }
      }.bind(this));
    },
  
    _abortDownload: function () {
      this._request.abort();
      this._removeThis();
    }
  });

})();


