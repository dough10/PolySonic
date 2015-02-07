
    Polymer('album-art',{
      /*
        method ran when element is created in dom
      */
      created: function () {

        /*
          default page
        */
        this.page = this.page || "cover";

        /*
          Artist name
        */
        this.artist = this.artist || "Artist Name";

        /*
          Album name
        */
        this.album = this.album || "Album Title";


        this.playlist = [];
        
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
      
      /*
        method ran when cover attribute is changed
      */
      coverChanged: function () {
        if (this.cover !== "") {
          var xhr = new XMLHttpRequest();
          xhr.open('GET', this.url + "/rest/getCoverArt.view?u=" + this.user +"&p=" + this.pass +"&f=json&v=" + this.version + "&c=PolySonic&size=250&id=" + this.cover, true);
          xhr.responseType = 'blob';
          var card = this.$.card;
          var art = this.$.art;
          var note = this.$.playNotify;
          xhr.onload = function(e) {
            this.image = window.URL.createObjectURL(this.response);;
            card.style.backgroundImage = "url('" + this.image + "')";
            art.src = this.image;
            note.icon = this.image;
            var visible = document.querySelector("#loader").classList.contains("hide");
            if (!visible) {
              document.querySelector('#loader').classList.add('hide');
              document.querySelector(".box").classList.add('hide');
            }
          };
          xhr.send();
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
          this.tracks = [];
          Array.prototype.forEach.call(this.trackResponse['subsonic-response'].album.song, function (e) {
            var obj = {id:e.id, artist:e.artist, title:e.title, cover:this.cover};
            this.tracks.push(obj);
          }.bind(this));
        }
        this.playlist = this.tracks;
      },

      doDialog: function () {
        this.$.dialog.toggle();
      },

      add2Playlist: function () {
        var audio = document.querySelector("#audio"),
          tmpl = document.querySelector("#tmpl"),
          playlist = tmpl.playlist;
        if (!playlist){
          playlist = [];
          tmpl.playlist = [];
        }
        this.$.playNotify.title = 'Added to Playlist';
        if (audio.paused) {
          tmpl.currentPlaying = this.playlist[0].artist+ ' - ' + this.playlist[0].title;
          audio.src = this.url + '/rest/stream.view?u=' + this.user + '&p=' + this.pass + '&v=' + this.version + '&c=PolySonic&maxBitRate=' + this.bitRate + '&id=' + this.playlist[0].id;
          audio.play();
          if (this.cover !== undefined) {
            var xhr = new XMLHttpRequest();
            xhr.open('GET', this.url + "/rest/getCoverArt.view?u=" + this.user +"&p=" + this.pass +"&f=json&v=" + this.version + "&c=PolySonic&id=" + this.cover, true);
            xhr.responseType = 'blob';
            var card = document.querySelector('#coverArt');
            var art = this.$.art;
            xhr.onload = function(e) {
              this.image = window.URL.createObjectURL(this.response);;
              card.style.backgroundImage = "url('" + this.image + "')";
              art.src = this.image;
            };
            xhr.send();
          } else {
            document.querySelector('#coverArt').style.backgroundImage =  "url('assets/default-cover-art.png')"
          }
        }
        Array.prototype.forEach.call(this.playlist, function (e) {
          var playlist = document.querySelector("#tmpl").playlist;
          playlist.push(e);
        }.bind(this));
        document.querySelector('#tmpl').playing = 0;
        this.$.playNotify.show();
      },

      doDownload: function (event, detail, sender) {
        window.open(this.url +"/rest/download.view?u=" + this.user + "&p=" + this.pass + "&f=json&v=" + this.version + "&c=PolySonic&id=" + sender.attributes.ident.value,'_blank');
      },
      
      playAlbum: function () {
        var audio = document.querySelector("#audio"),
          scroller = PolySonic.appScroller(),
          tmpl = document.querySelector("#tmpl");

        PolySonic.position = scroller.scrollTop;
        tmpl.currentPlaying = this.playlist[0].artist + ' - ' + this.playlist[0].title;
        this.$.playNotify.title = 'Now Playing... ' + this.playlist[0].artist + ' - ' + this.playlist[0].title;
        if (this.cover !== undefined) {
          var xhr = new XMLHttpRequest();
          xhr.open('GET', this.url + "/rest/getCoverArt.view?u=" + this.user +"&p=" + this.pass +"&f=json&v=" + this.version + "&c=PolySonic&id=" + this.cover, true);
          xhr.responseType = 'blob';
          var card = document.querySelector('#coverArt');
          xhr.onload = function(e) {
            this.image = window.URL.createObjectURL(this.response);;
            card.style.backgroundImage = "url('" + this.image + "')";
          };
          xhr.send();
        } else {
          document.querySelector('#coverArt').style.backgroundImage =  "url('assets/default-cover-art.png')"
        }
        audio.src = this.url + '/rest/stream.view?u=' + this.user + '&p=' + this.pass + '&v=' + this.version + '&c=PolySonic&maxBitRate=' + this.bitRate + '&id=' + this.playlist[0].id;
        audio.play();
        document.querySelector('#tmpl').page = 1;
        tmpl.playlist = this.playlist;
        document.querySelector('#tmpl').playing = 0;
        this.$.playNotify.show();
      },


      playTrack: function (event, detail, sender) {
        var audio = document.querySelector("#audio"),
          scroller = PolySonic.appScroller(),
          tmpl = document.querySelector("#tmpl");
        PolySonic.position = scroller.scrollTop;
        tmpl.currentPlaying = sender.attributes.artist.value + ' - ' + sender.attributes.title.value;
        this.$.playNotify.title = 'Now Playing... ' + sender.attributes.artist.value + ' - ' + sender.attributes.title.value;
        if (this.cover !== undefined) {
          var xhr = new XMLHttpRequest();
          xhr.open('GET', this.url + "/rest/getCoverArt.view?u=" + this.user +"&p=" + this.pass +"&f=json&v=" + this.version + "&c=PolySonic&id=" + this.cover, true);
          xhr.responseType = 'blob';
          var card = document.querySelector('#coverArt');
          xhr.onload = function(e) {
            this.image = window.URL.createObjectURL(this.response);;
            card.style.backgroundImage = "url('" + this.image + "')";
          };
          xhr.send();
        } else {
          document.querySelector('#coverArt').style.backgroundImage =  "url('assets/default-cover-art.png')"
        }
        audio.src = this.url + '/rest/stream.view?u=' + this.user + '&p=' + this.pass + '&v=' + this.version + '&c=PolySonic&maxBitRate=' + this.bitRate + '&id=' + sender.attributes.ident.value;
        audio.play();
        document.querySelector('#tmpl').page = 1;
        this.$.playNotify.show();
        document.querySelector('#tmpl').playlist = [{id:sender.attributes.ident.value, artist:sender.attributes.artist.value, title:sender.attributes.title.value, cover:sender.attributes.cover.value}];
      },

      addSingle2Playlist: function (event, detail, sender) {
        var playlist = document.querySelector('#tmpl').playlist,
          note = this.$.playNotify
          tmpl = document.querySelector("#tmpl");
        if (!playlist){
          playlist = [];
          document.querySelector('#tmpl').playlist = [];
        }
        note.title = 'Now Playing... ' + sender.attributes.artist.value + ' - ' + sender.attributes.title.value;
        this.$.toast.text = 'Added to Playlist';
        this.$.toast.show();
        var obj = {id:sender.attributes.ident.value, artist:sender.attributes.artist.value, title:sender.attributes.title.value, cover:sender.attributes.cover.value};
        document.querySelector('#tmpl').playlist.push(obj);
        if (audio.paused) {
          tmpl.currentPlaying = sender.attributes.artist.value + ' - ' + sender.attributes.title.value;
          audio.src = this.url + '/rest/stream.view?u=' + this.user + '&p=' + this.pass + '&v=' + this.version + '&c=PolySonic&maxBitRate=' + this.bitRate + '&id=' + sender.attributes.ident.value;
          audio.play();
          if (this.cover !== undefined) {
            var xhr = new XMLHttpRequest();
            xhr.open('GET', this.url + "/rest/getCoverArt.view?u=" + this.user +"&p=" + this.pass +"&f=json&v=" + this.version + "&c=PolySonic&id=" + this.cover, true);
            xhr.responseType = 'blob';
            var card = document.querySelector('#coverArt');
            xhr.onload = function(e) {
              this.image = window.URL.createObjectURL(this.response);;
              card.style.backgroundImage = "url('" + this.image + "')";
              note.icon = this.image;
              note.show();
            };
            xhr.send();
          } else {
            document.querySelector('#coverArt').style.backgroundImage =  "url('assets/default-cover-art.png')"
          }
        }
      },

      addFavorite: function (event, detail, sender) {
        var xhr = new XMLHttpRequest(),
          fav = this;
        xhr.open('GET', this.url + "/rest/star.view?u=" + this.user +"&p=" + this.pass +"&f=json&v=" + this.version + "&c=PolySonic&albumId=" + sender.attributes.ident.value, true);
        xhr.responseType = 'json';
        xhr.onload = function(e) {
          console.log(this.response['subsonic-response'].status);
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
          console.log(this.response['subsonic-response'].status);
          if (this.response['subsonic-response'].status === 'ok') {
            fav.isFavorite = false;
          }
        };
        xhr.send();
      }
    });
