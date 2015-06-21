Polymer('download-manager', {

  downloads: [],

  app: document.querySelector('#tmpl'),

  removeDownloadLabel: chrome.i18n.getMessage('removeDownloadLabel'),

  saveFileLabel: chrome.i18n.getMessage('saveFileLabel'),

  pauseDownload: chrome.i18n.getMessage('abortDownload'),

  hasSaved: false,

  removeThis: function (event, detail, sender) {
    this.parentNode.removeChild(this);
    this.async(function () {
      if (this.app.$.downloads.childElementCount === 0) {
        this.app.isDownloading = false;
      }
    }, null, 100);
  },

  formatBytes: function (bytes) {
    if (bytes < 1024) return bytes + ' Bytes';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(2) + ' KB';
    else if (bytes < 1073741824) return (bytes / 1048576).toFixed(2) + ' MB';
    else return (bytes / 1073741824).toFixed(2) + ' GB';
  },

  doXhr: function (url, dataType, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.responseType = dataType;
    xhr.onload = callback;
    xhr.onerror = this.errorHandler;
    xhr.onprogress = this.xhrProgress.bind(this);
    xhr.send();
    this.request = xhr;
  },

  xhrProgress: function (e) {
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
    this.output = this.formatBytes(e.loaded) + ' of ' + this.downloadSizeReadable + ' Downloaded';
  },

  progressChanged: function () {
    if (this.progress && this.progress === 100) {
      this.app.doToast(chrome.i18n.getMessage('downloadFinished'));
    }
  },

  errorHandler: function (e) {
    console.error(e);
  },

  waitForIO: function (writer, callback) {
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
        callback();
      }
    };
    setTimeout(reentrant, 100);
  },


  writeFileEntry: function (writableEntry, blob, callback) {
    writableEntry.createWriter(function(writer) {

      writer.onerror = this.errorHandler;
      writer.onwriteend = callback;

      writer.truncate(blob.size);
      this.waitForIO(writer, function() {
        writer.seek(0);
        writer.write(blob);
      });
    }.bind(this), this.errorHandler);
  },


  downloadTrack: function (id, callback) {
    var url = this.app.buildUrl('download', {id : id}),
      url2 = this.app.buildUrl('getSong', {id: id});
    this.doXhr(url2, 'json', function (r) {
      var details = r.target.response['subsonic-response'].song;
      this.fileName = details.artist + ' - ' + details.title + '.' + details.suffix;
      this.downloadSize = details.size;
      this.downloadSizeReadable = this.formatBytes(this.downloadSize);
      this.app.doToast(chrome.i18n.getMessage('downloadStarted'));
      callback();
      this.isDownloading = true;
      var time = new Date();
      this.start = time.getTime();
      this.doXhr(url, 'blob', function (e) {
        this.blob = e.target.response;
        this.downloadSizeReadable = this.formatBytes(this.blob.size);
        this.output = 'File Downloaded ' + this.downloadSizeReadable;
        this.isDownloading = false;
      }.bind(this));
    }.bind(this));
  },

  downloadAlbum: function (details, callback) {
    var url = this.app.buildUrl('download', {id: details.id});
    this.fileName = details.artist + ' - ' + details.album + '.zip';
    this.isDownloading = true;
    this.downloadSize = details.size;
    this.downloadSizeReadable = this.formatBytes(this.downloadSize);
    var time = new Date();
    this.start = time.getTime();
    this.app.doToast(chrome.i18n.getMessage('downloadStarted'));
    this.doXhr(url, 'blob', function (e) {
      this.blob = e.target.response;
      this.downloadSizeReadable = this.formatBytes(this.blob.size);
      this.output = 'File Downloaded ' + this.downloadSizeReadable;
      this.isDownloading = false;
      this.progress = 100;
      callback();
    }.bind(this));
  },

  downloadSinglePodcast: function (details, callback) {
    var url = this.app.buildUrl('download', {id: details.id});
    this.app.doNotify(this.app.downloadStarted);
    this.fileName = details.title.replace(':', '') + '.' + details.suffix;
    this.isDownloading = true;
    this.downloadSize = details.size;
    this.downloadSizeReadable = this.formatBytes(this.downloadSize);
    var time = new Date();
    this.start = time.getTime();
    this.doXhr(url, 'blob', function (e) {
      this.blob = e.target.response;
      this.downloadSizeReadable = this.formatBytes(this.blob.size);
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
        this.writeFileEntry(writableEntry, this.blob, function () {
          this.output = 'File Saved ' + this.downloadSizeReadable;
          this.hasSaved = true;
        }.bind(this));
      } else {
        console.error('Error Downloading', e);
      }
    }.bind(this));
  },

  abortDownload: function () {
    this.request.abort();
    this.removeThis();
  }
});


