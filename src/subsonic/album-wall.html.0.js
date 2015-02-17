
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
      domReady: function () {
        this.$.list.scrollTarget = document.querySelector("#tmpl").appScroller();

        this.tmpl = document.querySelector("#tmpl");

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
        this.wall.splice(0,this.wall.length);
      },
      responseChanged: function () {
        if (this.response) {
          var wall = this.wall,
            response = this.response['subsonic-response'],
            tmpl = document.querySelector("#tmpl");

          if (response.albumList2 && response.albumList2.album) {
            Array.prototype.forEach.call(response.albumList2.album, function (e) {
              obj = {id:e.id, coverArt:e.coverArt, artist:e.artist, name:e.name, starred:e.starred, url:this.url, user:this.user, pass:this.pass, version:this.version, bitRate:this.bitRate};
              wall.push(obj);
            }.bind(this));
          } else if (response.starred2 && response.starred2.album) {
            Array.prototype.forEach.call(response.starred2.album, function (e) {
              obj = {id:e.id, coverArt:e.coverArt, artist:e.artist, name:e.name, starred:e.starred, url:this.url, user:this.user, pass:this.pass, version:this.version, bitRate:this.bitRate};
              wall.push(obj);
            }.bind(this));
          } else if (response.podcasts && response.podcasts.channel) {
            Array.prototype.forEach.call(response.podcasts.channel, function (e) {
              console.log(e);
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
        this.clearData();
        this.tmpl.doToast('Loading..');
        this.tmpl.pageLimit = false;
        setTimeout(function () {
          this.request = 'getPodcasts';
          this.post.type = '';
          this.post.offset = 0;
          this.$.ajax.go();
        }.bind(this), 200);
      },
      getStarred: function () {
        this.clearData();
        this.tmpl.doToast('Loading..');
        this.tmpl.pageLimit = false;
        setTimeout(function () {
          this.request = 'getStarred2';
          this.post.type = '';
          this.post.offset = 0;
          this.$.ajax.go();
        }.bind(this), 200);
      },
      getArtist: function () {
        this.clearData();
        this.tmpl.doToast('Loading..');
        this.tmpl.pageLimit = false;
        setTimeout(function () {
          this.request = 'getArtists';
          this.post.type = '';
          this.post.offset = 0;
          this.$.ajax.go();
        }.bind(this), 200);
      },
      sortChanged: function () {
        this.clearData();
        this.tmpl.doToast('Loading..');
        this.tmpl.pageLimit = false;
        setTimeout(function () {
          this.request = 'getAlbumList2';
          this.post.type = this.sort;
          this.post.offset = 0;
          this.$.ajax.go();
        }.bind(this), 200);
      },
      errorChanged: function () {
        if (this.error) {
          this.tmpl.doToast(this.error);
        }
      },
      loadMore: function () {
        if (!this.isLoading && this.request !== 'getStarred2') {
          this.isLoading = true;
          this.tmpl.doToast('Loading..');
          this.post.offset = parseInt(this.post.offset) + parseInt(this.post.size);
          setTimeout(function () {
            this.$.ajax.go();
          }.bind(this), 500);
        }
      },
      isLoadingChanged: function () {
        if (!this.isLoading) {
          this.tmpl.dismissToast();
        }
      },
      querySizeChanged: function () {
        this.post.size = this.querySize;
      },
      listModeChanged: function () {
        this.$.list.updateSize();
        if (this.listMode === 'cover') {
          this.$.list.width = '260';
          this.$.list.height = '260';
        } else {
          this.$.list.width = '580';
          this.$.list.heioght = '65';
        }
      }
    });
