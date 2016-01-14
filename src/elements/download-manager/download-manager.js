(function () {
  
  function waitForIO(writer) {
    return new Promise(function (resolve, reject) {
      // set a watchdog to avoid eventual locking:
      var start = Date.now();
      // wait for a few seconds
      var reentrant = function() {
        if (writer.readyState===writer.WRITING && Date.now()-start<4000) {
          setTimeout(reentrant, 100);
          return;
        }
        if (writer.readyState===writer.WRITING) {
          console.error("Write operation taking too long, aborting!"+
            " (current writer readyState is "+writer.readyState+")");
          writer.abort();
        }
        else {
          resolve();
        }
      };
      setTimeout(reentrant, 100);
    });
  }
  
  function errorHandler(e) {
    console.error(e);
  }
  
  Polymer('download-manager', {
  
    downloads: [],
  
    app: document.querySelector('#tmpl'),
  
    hasSaved: false,
  
    removeThis: function (event, detail, sender) {
      this.parentNode.removeChild(this);
      this.async(function () {
        if (this.app.$.downloads.childElementCount === 0) {
          this.app.isDownloading = false;
        }
      }, null, 100);
    },
  
    _doXhr: function (url, dataType) {
      return new Promise(function (resolve, reject) {
        var xhr = new XMLHttpRequest();
        xhr.open("GET", url, true);
        xhr.responseType = dataType;
        xhr.onload = callback;
        xhr.onerror = errorHandler;
        xhr.onprogress = this._xhrProgress.bind(this);
        xhr.send();
        this.request = xhr;
      }.bind(this));
    },
  
    _xhrProgress: function (e) {
      this.progress = Math.floor((e.loaded / this.downloadSize) *  100);
      var time = new Date();
      var now = time.getTime();
      var bits = e.loaded * 8;
      var timeElapsed = (now - this.start) / 1000;
      var Bps = Math.round(bits / timeElapsed);
      var Kbps = (Bps / 1024).toFixed(2);
      var Mbps = (Kbps / 1024).toFixed(2);
      if (Mbps < 1) {
        this.rate = Kbps + ' Kbps';
      } else {
        this.rate = Mbps + ' Mbps';
      }
      this.output = this.$.globals.formatBytes(e.loaded) + ' of ' + this.downloadSizeReadable + ' Downloaded';
    },
  
    writeFileEntry: function (writableEntry, blob) {
      return new Promise(function (resolve, reject) {
        writableEntry.createWriter(function(writer) {
    
          writer.onerror = reject;
          writer.onwriteend = resolve;
    
          writer.truncate(blob.size);
          waitForIO(writer).then(function() {
            writer.seek(0);
            writer.write(blob);
          });
        }.bind(this), errorHandler);
      }.bind(this));
    },
  
  
    downloadTrack: function (id, callback) {
      var url = this.$.globals.buildUrl('download', {id : id}),
        url2 = this.$.globals.buildUrl('getSong', {id: id});
      this._doXhr(url2, 'json').then(function (r) {
        var details = r.target.response['subsonic-response'].song;
        this.fileName = details.artist + ' - ' + details.title + '.' + details.suffix;
        this.downloadSize = details.size;
        this.downloadSizeReadable = this.$.globals.formatBytes(this.downloadSize);
        this.$.globals.makeToast(chrome.i18n.getMessage('downloadStarted'));
        callback();
        this.isDownloading = true;
        var time = new Date();
        this.start = time.getTime();
        this._doXhr(url, 'blob').then(function (e) {
          this.$.globals.makeToast(chrome.i18n.getMessage('downloadFinished'));
          this.blob = e.target.response;
          this.downloadSizeReadable = this.$.globals.formatBytes(this.blob.size);
          this.output = 'File Downloaded ' + this.downloadSizeReadable;
          this.isDownloading = false;
        }.bind(this));
      }.bind(this));
    },
  
    downloadAlbum: function (details, callback) {
      var url = this.$.globals.buildUrl('download', {id: details.id});
      this.fileName = details.artist + ' - ' + details.album + '.zip';
      this.isDownloading = true;
      this.downloadSize = details.size;
      this.downloadSizeReadable = this.$.globals.formatBytes(this.downloadSize);
      var time = new Date();
      this.start = time.getTime();
      this.$.globals.makeToast(chrome.i18n.getMessage('downloadStarted'));
      this._doXhr(url, 'blob').then(function (e) {
        this.blob = e.target.response;
        this.$.globals.makeToast(chrome.i18n.getMessage('downloadFinished'));
        this.downloadSizeReadable = this.this.$.globals.formatBytes(this.blob.size);
        this.output = 'File Downloaded ' + this.downloadSizeReadable;
        this.isDownloading = false;
        this.progress = 100;
        callback();
      }.bind(this));
    },
  
    downloadSinglePodcast: function (details, callback) {
      var url = this.$.globals.buildUrl('download', {id: details.id});
      this.$.globals.notify(this.$.globals.texts.downloadStarted);
      this.fileName = details.title.replace(':', '') + '.' + details.suffix;
      this.isDownloading = true;
      this.downloadSize = details.size;
      this.downloadSizeReadable = this.$.globals.formatBytes(this.downloadSize);
      var time = new Date();
      this.start = time.getTime();
      this._doXhr(url, 'blob').then(function (e) {
        this.blob = e.target.response;
        this.$.globals.makeToast(chrome.i18n.getMessage('downloadFinished'));
        this.downloadSizeReadable = this.$.globals.formatBytes(this.blob.size);
        this.output = 'File Downloaded ' + this.downloadSizeReadable;
        this.isDownloading = false;
        this.progress = 100;
        callback();
      }.bind(this));
    },
  
    doSave: function () {
      this.output = 'Saving.. ' + this.downloadSizeReadable;
      var config = {type: 'saveFile', suggestedName: this.fileName};
      chrome.fileSystem.chooseEntry(config, function (writableEntry) {
        if (writableEntry) {
          this.writeFileEntry(writableEntry, this.blob).then(function () {
            this.output = 'File Saved ' + this.downloadSizeReadable;
            this.hasSaved = true;
          }.bind(this));
        } else {
          console.error('Error Downloading', e);
        }
      }.bind(this));
    },
  
    _abortDownload: function () {
      this.request.abort();
      this.removeThis();
    }
  });

})();


