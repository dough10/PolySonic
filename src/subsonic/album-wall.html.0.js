
    Polymer('album-wall', {
      created: function () {
        this.post = {
          f: 'json',
          c: 'PolySonic',
          type: 'newest',
          size: 20,
          offset: 0
        };
        this.wall = [];
        this.request = this.request || 'getAlbumList2';
      },
      userChanged: function () {
        this.post.u = this.user;
      },
      passChanged: function () {
        this.post.p = this.pass;
      },
      versionChanged: function () {
        this.post.v = this.version;
      },
      clearData: function () {
        this.wall = [];
      },
      responseChanged: function () {
        if (this.response) {
          var wall = this.wall,
            response = this.response['subsonic-response'],
            tmpl = document.querySelector("#tmpl");
          if (response.albumList2 && response.albumList2.album) {
            Array.prototype.forEach.call(this.response['subsonic-response'].albumList2.album, function (e) {
              obj = {id:e.id, coverArt:e.coverArt, artist:e.artist, name:e.name, starred:e.starred, url:this.url, user:this.user, pass:this.pass, version:this.version, bitRate:this.bitRate};
              wall.push(obj);
            }.bind(this));
          } else if (response.starred2 && response.starred2.album) {
            Array.prototype.forEach.call(this.response['subsonic-response'].starred2.album, function (e) {
              obj = {id:e.id, coverArt:e.coverArt, artist:e.artist, name:e.name, starred:e.starred, url:this.url, user:this.user, pass:this.pass, version:this.version, bitRate:this.bitRate};
              wall.push(obj);
            }.bind(this));
          } else {
            tmpl.pageLimit = true;
          }
        }
      },
      doAjax: function () {
        this.$.ajax.go();
      },
      getPodcast: function () {
        var toast = this.$.toast,
          tmpl = document.querySelector("#tmpl");
        toast.text = 'Loading..';
        toast.show();
        tmpl.pageLimit = false;
        setTimeout(function () {
          this.request = 'getPodcasts';
          this.post.type = '';
          this.post.offset = 0;
          this.$.ajax.go();
        }.bind(this), 200);
      },
      getStarred: function () {
        var toast = this.$.toast,
          tmpl = document.querySelector("#tmpl");
        toast.text = 'Loading..';
        toast.show();
        tmpl.pageLimit = false;
        setTimeout(function () {
          this.request = 'getStarred2';
          this.post.type = '';
          this.post.offset = 0;
          this.$.ajax.go();
        }.bind(this), 200);
      },
      getArtist: function () {
        var toast = this.$.toast,
          tmpl = document.querySelector("#tmpl");
        toast.text = 'Loading..';
        toast.show();
        tmpl.pageLimit = false;
        setTimeout(function () {
          this.request = 'getArtists';
          this.post.type = '';
          this.post.offset = 0;
          this.$.ajax.go();
        }.bind(this), 200);
      },
      sortChanged: function () {
        var toast = this.$.toast,
          tmpl = document.querySelector("#tmpl");
        toast.text = 'Loading..';
        toast.show();
        tmpl.pageLimit = false;
        setTimeout(function () {
          this.request = 'getAlbumList2';
          this.post.type = this.sort;
          this.post.offset = 0;
          this.$.ajax.go();
        }.bind(this), 200);
      },
      getTracks: function (event, detail, sender) {
        this.$.tracks.go();
      },
      errorChanged: function () {
        if (this.error) {
          var toast = this.$.toast;
          toast.text = this.error;
          toast.show();
        }
      },
      loadMore: function () {
        if (!this.isLoading && this.request !== 'getStarred2') {
          this.isLoading = true;
          var toast = this.$.toast;
          toast.text = 'Loading..';
          toast.show();
          this.post.size = this.post.size / 2;
          this.post.offset = this.post.offset + this.post.size;
          setTimeout(function () {
            this.$.ajax.go();
            this.post.size = this.post.size * 2;
          }.bind(this), 500);
        }
      },
      querySizeChanged: function () {
        this.post.size = this.querySize;
      }
    });
