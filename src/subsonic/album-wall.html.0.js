
    Polymer('album-wall', {
      created: function () {
        this.post = {
          f: 'json',
          c: 'PolySonic',
          type: 'newest',
          size: 60,
          offset: 0
        };
        this.wall = [];
        this.request = 'getAlbumList2';
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
            response = this.response['subsonic-response'];
          if (response.albumList2) {
            Array.prototype.forEach.call(this.response['subsonic-response'].albumList2.album, function (e) {
              obj = {id:e.id, coverArt:e.coverArt, artist:e.artist, name:e.name, starred:e.starred, url:this.url, user:this.user, pass:this.pass, version:this.version};
              wall.push(obj);
            }.bind(this));
          } else if (response.starred2) {
            Array.prototype.forEach.call(this.response['subsonic-response'].starred2.album, function (e) {
              obj = {id:e.id, coverArt:e.coverArt, artist:e.artist, name:e.name, starred:e.starred, url:this.url, user:this.user, pass:this.pass, version:this.version};
              wall.push(obj);
            }.bind(this));
          }
        }
      },
      doAjax: function () {
        setTimeout(function () {
          this.$.ajax.go();
        }.bind(this), 300);
      },
      getPodcast: function () {
        this.request = 'getPodcasts';
        this.post.type = '';
        this.post.offset = 0;
        this.$.ajax.go();
      },
      getStarred: function () {
        this.request = 'getStarred2';
        this.post.type = '';
        this.post.offset = 0;
        this.$.ajax.go();
      },
      sortChanged: function () {
        this.request = 'getAlbumList2';
        this.post.type = this.sort;
        this.post.offset = 0;
        this.$.ajax.go();
      },
      getTracks: function (event, detail, sender) {
        this.$.tracks.go();
      },
      errorChanged: function () {
        if (this.error) {
          document.querySelector('#firstRun').toggle();
        }
      },
      loadMore: function () {
        this.post.offset = this.post.offset + this.post.size;
        this.$.ajax.go();
      }
    });
