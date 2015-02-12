
    Polymer('album-art',{
      /*
        method ran when element is created in dom
      */
      created: function () {
        this.imgURL = '../../images/default-cover-art.png';
      },
      
      ready: function () {

        this.page = this.page || "cover";

        this.artist = this.artist || "Artist Name";

        this.album = this.album || "Album Title";

        this.playlist = [];
        
        this.tracks = [];

        this.checkJSONEntry(this.item);

      },

      listModeChanged: function () {
        if (this.listMode === 'list') {
          this.page = "small";
          this.width = '556px';
          this.height = "60px";
        } else  {
          this.page = "cover";
          this.width = "250px";
          this.height = "250px";
        }
      },
      
      dbErrorHandler: function (e) {
        console.log(e);
      },
      
      getDbItem: function (id, callback) {
        var tmpl = document.querySelector('#tmpl'),
          transaction = tmpl.db.transaction(["albumInfo"], "readwrite"),
          request = transaction.objectStore("albumInfo").get(id);
        request.onsuccess = callback;
        request.onerror = this.dbErrorHandler;
      },
      
      checkForImage: function (id, callback) {
        var tmpl = document.querySelector('#tmpl'),
          transaction = tmpl.db.transaction(["albumInfo"], "readwrite"),
          request = transaction.objectStore("albumInfo").count(id)
        request.onsuccess = callback;
        request.onerror = this.dbErrorHandler;
      },
      
      checkJSONEntry: function (id) {
        var tmpl = document.querySelector('#tmpl'),
          transaction = tmpl.db.transaction(["albumInfo"], "readwrite"),
          request = transaction.objectStore("albumInfo").count(id);
        request.onsuccess = function() {
          if (request.result === 0) {
            this.new = true;
            this.doAjax();
          } else {
            this.new = false;
            this.getJSONFromDb(id);
          }
        }.bind(this);
      },

      getJSONFromDb: function (id) {
        this.getDbItem(id, function (event) {
          var data = event.target.result;
          this.trackResponse = data;
        }.bind(this));
      },
      
      setImage: function (event) {
        var imgFile = event.target.result,
          imgURL = window.URL.createObjectURL(imgFile);
  
        this.$.card.style.backgroundImage = "url('" + imgURL + "')";
        this.imgURL = imgURL;
      },
      
      putInDb: function (data, id, callback) {
        var tmpl = document.querySelector("#tmpl"),
          transaction = tmpl.db.transaction(["albumInfo"], "readwrite");
        transaction.objectStore("albumInfo").put(data, id);
        transaction.objectStore("albumInfo").get(id).onsuccess = callback;
      },
      
      getFromServer: function (url, id, callback) {
        var xhr = new XMLHttpRequest(),
          blob;
        xhr.open("GET", url, true);
        xhr.responseType = "blob";
        xhr.onload = function () {
          if (xhr.status === 200) {
            blob = xhr.response;
            this.putInDb(blob, id, callback);
          }
        }.bind(this);
        xhr.send();
        console.log('New Image Added to indexedDB ' + id);
      },
      
      /*
        method ran when cover attribute is changed
      */
      coverChanged: function () {
        var tmpl = document.querySelector("#tmpl");
        if (this.cover) {
          var url = this.url + "/rest/getCoverArt.view?u=" + this.user +"&p=" + this.pass +"&f=json&v=" + this.version + "&c=PolySonic&id=" + this.cover;
          this.checkForImage(this.cover, function (e) {
            var visible = document.querySelector("#loader").classList.contains("hide"),
              loader = document.querySelector('#loader'),
              box = document.querySelector(".box");
            if (!visible) {
              loader.classList.add('hide');
              box.classList.add('hide');
            }
            if (e.target.result === 0) {
              this.getFromServer(url, this.cover, this.setImage.bind(this));
            } else {
              this.getDbItem(this.cover, this.setImage.bind(this));
            }
          }.bind(this));
        }
      },

      /*
        slide up the box to cover art and show hidden details
      */
      slideUp: function () {
        this.page = "info";
      },

      /*
        slide box bax to normal position
      */
      closeSlide: function () {
        this.page = "cover";
      },

      trackResponseChanged: function () {
        if (this.trackResponse) {
          this.albumID = this.trackResponse['subsonic-response'].album.song[0].parent;
          Array.prototype.forEach.call(this.trackResponse['subsonic-response'].album.song, function (e) {
            var obj = {id:e.id, artist:e.artist, title:e.title, cover:this.cover};
            this.playlist.push(obj);
            this.tracks.push(obj);
          }.bind(this));
        }
        if (this.new) {
          this.putInDb(this.trackResponse, this.item, function (e) {
            console.log('New JSON Data Added to indexedDB ' + this.item);
          }.bind(this));
        }
      },

      doDialog: function () {
        this.$.dialog.toggle();
      },

      doAjax: function () {
        this.$.track.go();
      },

      defaultPlayerImage: function () {
        var art = document.querySelector('#coverArt');
        art.style.backgroundImage =  "url('images/default-cover-art.png')"
      },

      add2Playlist: function () {
        var audio = document.querySelector("#audio"),
          tmpl = document.querySelector("#tmpl"),
          note = document.querySelector("#playNotify");
          url = this.url + '/rest/stream.view?u=' + this.user + '&p=' + this.pass + '&v=' + this.version + '&c=PolySonic&maxBitRate=' + this.bitRate + '&id=' + this.playlist[0].id;

        if (audio.paused) {
          tmpl.playing = 0;
          tmpl.playAudio(this.playlist[0].artist, this.playlist[0].title, url);
          if (this.cover) {
            tmpl.getImageForPlayer(this.cover);
          } else {
            this.defaultPlayerImage();
          }
        }
        Array.prototype.forEach.call(this.playlist, function (e) {
          tmpl.playlist.push(e);
        }.bind(this));
        note.title = this.artist + ' - ' + this.album +' Added to Playlist';
        note.icon = this.imgURL;
        note.show();
      },

      doDownload: function (event, detail, sender) {
        window.open(this.url +"/rest/download.view?u=" + this.user + "&p=" + this.pass + "&f=json&v=" + this.version + "&c=PolySonic&id=" + sender.attributes.ident.value,'_blank');
      },
      
      playAlbum: function () {
        var audio = document.querySelector("#audio"),
          tmpl = document.querySelector("#tmpl"),
          note = document.querySelector("#playNotify"),
          url = this.url + '/rest/stream.view?u=' + this.user + '&p=' + this.pass + '&v=' + this.version + '&c=PolySonic&maxBitRate=' + this.bitRate + '&id=' + this.playlist[0].id;

        if (this.cover) {
          tmpl.getImageForPlayer(this.cover);
        } else {
          this.defaultPlayerImage();
        }
        tmpl.page = 1;
        tmpl.playlist = this.playlist;
        tmpl.playing = 0;
        tmpl.playAudio(this.playlist[0].artist, this.playlist[0].title, url);
        document.title = this.playlist[0].artist + ' - ' + this.playlist[0].title;
        note.icon = this.imgURL;
        note.show();
      },


      playTrack: function (event, detail, sender) {
        var audio = document.querySelector("#audio"),
          tmpl = document.querySelector("#tmpl"),
          note = document.querySelector("#playNotify"),
          url = this.url + '/rest/stream.view?u=' + this.user + '&p=' + this.pass + '&v=' + this.version + '&c=PolySonic&maxBitRate=' + this.bitRate + '&id=' + this.playlist[0].id;

        if (this.cover) {
          tmpl.getImageForPlayer(this.cover);
        } else {
          this.defaultPlayerImage();
        }
        tmpl.page = 1;
        tmpl.playlist = this.playlist;
        tmpl.playing = 0;
        tmpl.playAudio(this.playlist[0].artist, this.playlist[0].title, url);
        note.title = this.playlist[0].artist + ' - ' + this.playlist[0].title;
        note.icon = this.imgURL;
        note.show();
      },

      addSingle2Playlist: function (event, detail, sender) {
        var note = document.querySelector("#playNotify"),
          tmpl = document.querySelector("#tmpl"),
          toast = this.$.toast,
          url = this.url + '/rest/stream.view?u=' + this.user + '&p=' + this.pass + '&v=' + this.version + '&c=PolySonic&maxBitRate=' + this.bitRate + '&id=' + sender.attributes.ident.value,
          obj = {id:sender.attributes.ident.value, artist:sender.attributes.artist.value, title:sender.attributes.title.value, cover:sender.attributes.cover.value};

        tmpl.playlist.push(obj);
        if (audio.paused) {
          tmpl.playAudio(sender.attributes.artist.value, sender.attributes.title.value, url);
          if (this.cover) {
            tmpl.getImageForPlayer(this.cover);
          } else {
            document.querySelector('#coverArt').style.backgroundImage =  "url('images/default-cover-art.png')"
          }
        }
        toast.text = 'Added to Playlist';
        toast.show();
        note.title = 'Now Playing... ' + sender.attributes.artist.value + ' - ' + sender.attributes.title.value;
        note.icon = this.imgURL;
        note.show();
      },

      addFavorite: function (event, detail, sender) {
        var xhr = new XMLHttpRequest(),
          fav = this;
        xhr.open('GET', this.url + "/rest/star.view?u=" + this.user +"&p=" + this.pass +"&f=json&v=" + this.version + "&c=PolySonic&albumId=" + sender.attributes.ident.value, true);
        xhr.responseType = 'json';
        xhr.onload = function(e) {
          if (this.response['subsonic-response'].status === 'ok') {
            fav.isFavorite = true;
          }
        };
        xhr.send();
      },

      removeFavorite: function (event, detail, sender) {
        var xhr = new XMLHttpRequest(),
          fav = this;
        xhr.open('GET', this.url + "/rest/unstar.view?u=" + this.user +"&p=" + this.pass +"&f=json&v=" + this.version + "&c=PolySonic&albumId=" + sender.attributes.ident.value, true);
        xhr.responseType = 'json';
        xhr.onload = function(e) {
          if (this.response['subsonic-response'].status === 'ok') {
            fav.isFavorite = false;
          }
        };
        xhr.send();
      }
    });
