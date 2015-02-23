
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
        this.podcast = [];
        this.request = this.request || 'getAlbumList2';
      },
      domReady: function () {
        this.tmpl = document.querySelector("#tmpl");
        this.audio = document.querySelector("#audio");
        this.scrollTarget = document.querySelector("#tmpl").appScroller();
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
        this.scrollTarget.scrollTop = 0;
        this.artists = null;
        this.artist = [];
        this.wall = null;
        this.wall = [];
        this.podcast = null;
        this.podcast = [];
        //this.wall.splice(0,this.wall.length);
        //this.podcast.splice(0,this.podcast.length);
      },
      responseChanged: function () {
        if (this.response) {
          var wall = this.wall,
            response = this.response['subsonic-response'],
            tmpl = document.querySelector("#tmpl");
          //console.log(response);
          if (response.albumList2 && response.albumList2.album) {
            Array.prototype.forEach.call(response.albumList2.album, function (e) {
              var obj = {id:e.id, coverArt:e.coverArt, artist:e.artist, name:e.name, starred:e.starred, url:this.url, user:this.user, pass:this.pass, version:this.version, bitRate:this.bitRate};
              wall.push(obj);
            }.bind(this));
          } else if (response.starred2 && response.starred2.album) {
            Array.prototype.forEach.call(response.starred2.album, function (e) {
              var obj = {id:e.id, coverArt:e.coverArt, artist:e.artist, name:e.name, starred:e.starred, url:this.url, user:this.user, pass:this.pass, version:this.version, bitRate:this.bitRate};
              wall.push(obj);
            }.bind(this));
          } else if (response.podcasts && response.podcasts.channel) {
            Array.prototype.forEach.call(response.podcasts.channel, function (e) {
              var obj = {title: e.title, episode: e.episode};
              this.podcast.push(obj);
            }.bind(this));
          } else if (response.artists) {
            console.log(response.artists);
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
        if (!this.isLoading && this.request !== 'getStarred2' && this.request !== 'getPodcasts' && !this.pageLimit) {
          this.isLoading = true;
          this.tmpl.doToast('Loading..');
          this.post.offset = parseInt(this.post.offset) + this.post.size;
          this.$.ajax.go();
        }
      },
      isLoadingChanged: function () {
        if (!this.isLoading) {
          //this.tmpl.dismissToast();
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
      },
      playPodcast: function (event, detial, sender) {
        var imgURL = 'images/default-cover-art.png',
          url = this.url + '/rest/stream.view?u=' + this.user + '&p=' + this.pass + '&v=' + this.version + '&c=PolySonic&format=raw&estimateContentLength=true&id=' + sender.attributes.streamId.value,
          obj = {id: sender.attributes.streamId.value, artist: undefined, title: sender.attributes.title.value, cover: imgURL};
        this.tmpl.playlist = [obj];
        this.tmpl.playing = 0;
        this.tmpl.page = 1;
        this.tmpl.defaultPlayImage();
        this.tmpl.playAudio(undefined, sender.attributes.title.value, url);
        this.systemNotify(undefined, sender.attributes.title.value, imgURL);
      },
      add2Playlist: function (event, detial, sender) {
        if (this.audio.paused) {
          var imgURL = 'images/default-cover-art.png',
            url = this.url + '/rest/stream.view?u=' + this.user + '&p=' + this.pass + '&v=' + this.version + '&c=PolySonic&format=raw&estimateContentLength=true&id=' + sender.attributes.streamId.value,
            obj = {id: sender.attributes.streamId.value, artist: undefined, title: sender.attributes.title.value, cover: imgURL};
          this.tmpl.playlist = [obj];
          this.tmpl.playing = 0;
          this.tmpl.page = 1;
          this.tmpl.defaultPlayImage();
          this.tmpl.playAudio(undefined, sender.attributes.title.value, url);
          this.systemNotify(undefined, sender.attributes.title.value, imgURL);
        } else {
          var imgURL = 'images/default-cover-art.png',
            obj = {id: sender.attributes.streamId.value, artist: undefined, title: sender.attributes.title.value, cover: imgURL};
          this.tmpl.playlist.push(obj);
        }
      }
    });
