
    Polymer('album-art',{
      /*
        method ran when element is created in dom
      */
      created: function () {

        /*
          default page
        */
        this.page = "cover";

        /*
          Artist name
        */
        this.artist = "Artist Name";

        /*
          Album name
        */
        this.album = "Album Title";


        this.playlist = [];
      },
      /*
        method ran when size of element is changed

        changing size changes both height and width values
      */
      phoneSizeChanged: function () {
        if (this.phoneSize) {
          this.page = "small";
          this.width = "150px";
          this.height = "150px";
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

      /*
        slide up info box on mouseover for small setting
      */
      slide2: function () {
        this.page = "info2";
      },

      /*
        return element to small setting
      */
      backToSmall: function () {
        this.page = "small";
      },

      trackResponseChanged: function () {
        if (this.trackResponse) {
          this.tracks = [];
          Array.prototype.forEach.call(this.trackResponse['subsonic-response'].album.song, function (e) {
            //console.log(e);
            var obj = {id:e.id, artist:e.artist, title:e.title, cover:this.cover};
            this.tracks.push(obj);
          }.bind(this));
        }
        var visible = document.querySelector("#loader").classList.contains("hide");
        if (visible === false) {
          document.querySelector('#loader').classList.add('hide');
          document.querySelector(".box").classList.add('hide');
        }

        this.playlist = this.tracks;
      },

      doDialog: function () {
        this.$.dialog.toggle();
      },

      add2Playlist: function () {
        var audio = document.querySelector("#audio"),
          playlist = PolySonic.playlist;
        if (!playlist){
          playlist = [];
          document.querySelector('#tmpl').playlist = [];
        }
        this.$.playNotify.title = 'Added to Playlist';
        if (audio.paused) {
          document.querySelector('#playing').innerHTML = this.playlist[0].artist+ ' - ' + this.playlist[0].title;
          audio.src = this.url + '/rest/stream.view?u=' + this.user + '&p=' + this.pass + '&v=' + this.version + '&c=PolySonic&id=' + this.playlist[0].id;
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
          var playlist = PolySonic.playlist;
          playlist.push(e);
        }.bind(this));
        document.querySelector('#tmpl').playlist = playlist;
        document.querySelector('#tmpl').playing = 0;
        this.$.playNotify.show();
      },

      playAlbum: function () {
        var audio = document.querySelector("#audio"),
          height = (window.innerHeight - 256) + 'px',
          width = window.innerWidth + 'px',
          scroller = PolySonic.appScroller(),
          toolbar1 = document.querySelector("#toolbar1"),
          toolbar2 = document.querySelector("#toolbar2");

        PolySonic.position = scroller.scrollTop;
        document.querySelector('#playing').innerHTML = this.playlist[0].artist + ' - ' + this.playlist[0].title;
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
        audio.src = this.url + '/rest/stream.view?u=' + this.user + '&p=' + this.pass + '&v=' + this.version + '&c=PolySonic&id=' + this.playlist[0].id;

        audio.play();
        document.querySelector('#tmpl').page = 1;
        toolbar1.style.display = 'none';
        toolbar2.style.display = 'block';
        document.querySelector('#coverArt').style.width = width;
        document.querySelector('#coverArt').style.height = height;
        if (window.innerWidth > window.innerHeight) {
          document.querySelector('#coverArt').style.backgroundSize = width;
        } else {
          document.querySelector('#coverArt').style.backgroundSize = height;
        }
        PolySonic.playlist = this.playlist;
        document.querySelector('#tmpl').playlist = this.playlist;
        document.querySelector('#tmpl').playing = 0;
        this.$.playNotify.show();
      },


      /*

      */
      playTrack: function (event, detail, sender) {
        var audio = document.querySelector("#audio"),
          height = (window.innerHeight - 256) + 'px',
          width = window.innerWidth + 'px',
          scroller = PolySonic.appScroller(),
          toolbar1 = document.querySelector("#toolbar1"),
          toolbar2 = document.querySelector("#toolbar2");

        PolySonic.position = scroller.scrollTop;

        document.querySelector('#playing').innerHTML = sender.attributes.artist.value + ' - ' + sender.attributes.title.value;
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

        audio.src = this.url + '/rest/stream.view?u=' + this.user + '&p=' + this.pass + '&v=' + this.version + '&c=PolySonic&id=' + sender.attributes.ident.value;

        audio.play();

        document.querySelector('#tmpl').page = 1;

        var toolbar1 = document.querySelector("#toolbar1"),
          toolbar2 = document.querySelector("#toolbar2");

        toolbar1.style.display = 'none';
        toolbar2.style.display = 'block';
        document.querySelector('#coverArt').style.width = width;
        document.querySelector('#coverArt').style.height = height;
        if (window.innerWidth > window.innerHeight) {
          document.querySelector('#coverArt').style.backgroundSize = width;
        } else {
          document.querySelector('#coverArt').style.backgroundSize = height;
        }

        this.$.playNotify.show();

        document.querySelector('#tmpl').playlist = [{id:sender.attributes.ident.value, artist:sender.attributes.artist.value, title:sender.attributes.title.value, cover:sender.attributes.cover.value}];
      },

      addtoPlaylist: function (event, detail, sender) {
        var playlist = document.querySelector('#tmpl').playlist,
          note = this.$.playNotify;
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
          document.querySelector('#playing').innerHTML = sender.attributes.artist.value + ' - ' + sender.attributes.title.value;
          audio.src = this.url + '/rest/stream.view?u=' + this.user + '&p=' + this.pass + '&v=' + this.version + '&c=PolySonic&id=' + sender.attributes.ident.value;
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

      addFavorite: function () {
        this.isFavorite = true;
      },

      removeFavorite: function () {
        this.isFavorite = false;
      }
    });
