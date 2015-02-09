    document.querySelector('#tmpl').addEventListener('template-bound', function () {
      this.position = 0;
      this.playlist = [];
      this.page = this.page || 0;
      this.pageLimit = false;
      this.volume = 100;
      this.sortTypes = [
        {sort:'newest', name:'Newest'},
        {sort:'frequent', name:'Frequent'},
        {sort:'alphabeticalByName', name:'By Title'},
        {sort:'alphabeticalByArtist', name:'By Artist'},
        {sort:'recent', name:'Recently Played'}
      ];

      this.closeDrawer = function () {
        var panel = document.querySelector('#panel');
        panel.closeDrawer();
      };

      this.appScroller = function () {
        return document.querySelector('#headerPanel').scroller;
      };

      this.topOfPage = function () {
        scroller = this.appScroller();
        if (scroller.scrollTop !== 0) {
          scroller.scrollTop = 0;
        }
      };

      this.sizePlayer = function () {
        var height = (window.innerHeight - 256) + 'px',
          width = window.innerWidth + 'px';
        document.querySelector('#coverArt').style.width = width;
        document.querySelector('#coverArt').style.height = height;
        document.querySelector('#coverArt').style.backgroundSize = width;
      };

      this.loadListeners = function () {
        var menuButton = document.querySelector("#menuButton"),
          tmpl = document.querySelector('#tmpl'),
          scroller = this.appScroller(),
          audio = document.querySelector('#audio'),
          maximized = chrome.app.window.current().isMaximized(),
          buttons = document.querySelectorAll('.max'),
          wall = document.querySelector("#wall");
        if (maximized) {
          Array.prototype.forEach.call(buttons, function (e) {
            e.icon = 'flip-to-back';
          });
        } else {
          Array.prototype.forEach.call(buttons, function (e) {
            e.icon = 'check-box-outline-blank';
          });
        }
        scroller.onscroll = function (e) {
          var precent = (scroller.scrollTop / (scroller.scrollHeight - scroller.offsetHeight)) * 100,
            tmpl = document.querySelector("#tmpl");
          if (tmpl.page === 0 && precent > 85 && !tmpl.pageLimit) {
            document.querySelector("#wall").loadMore();
          }
        }
        window.onresize = this.sizePlayer;
        audio.onended = function () {
          var next = tmpl.playing + 1;
          if (tmpl.playlist[next]) {
            tmpl.playing = next;
            document.querySelector('#playNotify').title = 'Now Playing... ' + tmpl.playlist[next].artist + ' - ' + tmpl.playlist[next].title;
            tmpl.currentPlaying = tmpl.playlist[next].artist + ' - ' + tmpl.playlist[next].title;
            this.src = tmpl.url + '/rest/stream.view?u=' + tmpl.user + '&p=' + tmpl.pass + '&v=1.10.2&c=PolySonic&maxBitRate=' + tmpl.bitRate + '&id=' + tmpl.playlist[next].id;
            this.play();
            if (tmpl.playlist[next].cover !== undefined) {
              var xhr = new XMLHttpRequest();
              xhr.open('GET', tmpl.url + "/rest/getCoverArt.view?u=" + tmpl.user +"&p=" + tmpl.pass +"&f=json&v=" + tmpl.version + "&c=PolySonic&id=" + tmpl.playlist[next].cover, true);
              xhr.responseType = 'blob';
              var card = document.querySelector('#coverArt');
              xhr.onload = function(e) {
                this.image = window.URL.createObjectURL(this.response);
                card.style.backgroundImage = "url('" + this.image + "')";
                document.querySelector('#playNotify').icon = this.image;
                document.querySelector("#playNotify").show();
              };
              xhr.send();
            } else {
              document.querySelector('#coverArt').style.backgroundImage =  "url('images/default-cover-art.png')"
            }
          } else {
            tmpl.page = 0;
            this.src = '';
            this.playlist = [];
          }
        }
      };
      
      this.loadData = function () {
        var tmpl = document.querySelector("#tmpl");
        chrome.storage.sync.get(function (result) {
          if (typeof result.url === 'undefined') {
            document.querySelector('#firstRun').toggle();
          } else {
            tmpl.url = result.url;
          }
          tmpl.user = result.user;
          tmpl.pass = result.pass;
          tmpl.version = result.version;
          if (typeof result.listMode === 'undefined') {
            chrome.storage.sync.set({
              'listMode': 'cover'
            });
            tmpl.listMode = 'cover';
            tmpl.view = 'view-stream';
          } else {
            tmpl.listMode = result.listMode;
            if (result.listMode === 'cover') {
              tmpl.view = 'view-stream';
            } else {
              tmpl.view = 'view-module';
            }
          }
          if (typeof result.bitRate === 'undefined') {
            chrome.storage.sync.set({
              'bitRate': '320'
            });
            tmpl.bitRate = '320';
          } else {
            tmpl.bitRate = result.bitRate;
          }
          if (typeof result.sort === 'undefined') {
            tmpl.selected = '';
          }
          if (typeof result.querySize === 'undefined') {
            chrome.storage.sync.set({
              'querySize': 40
            });
            tmpl.querySize = 40;
          } else {
            tmpl.querySize = result.querySize;
          }
          setTimeout(function () {
            if (tmpl.url && tmpl.user && tmpl.pass && tmpl.version) {
              document.querySelector('#wall').doAjax();
            }
          }, 100);
        });
      };

      this.playThis = function (event, detail, sender) {
        var tmpl = document.querySelector('#tmpl'),
          url = tmpl.url,
          user = tmpl.user,
          pass = tmpl.pass,
          cover = document.querySelector('#playNotify');
        tmpl.currentPlaying = sender.attributes.artist.value+ ' - ' + sender.attributes.title.value;
        audio.src = tmpl.url + '/rest/stream.view?u=' + tmpl.user + '&p=' + tmpl.pass + '&v=1.10.2&c=PolySonic&maxBitRate=' + tmpl.bitRate + '&id=' + sender.attributes.ident.value;
        audio.play();
        cover.title = 'Now Playing... ' + sender.attributes.artist.value+ ' - ' + sender.attributes.title.value;
        if (sender.attributes.cover.value !== undefined) {
          var xhr = new XMLHttpRequest();
          xhr.open('GET', tmpl.url + "/rest/getCoverArt.view?u=" + tmpl.user +"&p=" + tmpl.pass +"&f=json&v=" + this.version + "&c=PolySonic&id=" + sender.attributes.cover.value, true);
          xhr.responseType = 'blob';
          var card = document.querySelector('#coverArt');
          xhr.onload = function(e) {
            this.image = window.URL.createObjectURL(this.response);
            card.style.backgroundImage = "url('" + this.image + "')";
            cover.icon = this.image;
            document.querySelector("#playNotify").show();
          };
          xhr.send();
        } else {
          document.querySelector('#coverArt').style.backgroundImage =  "url('images/default-cover-art.png')"
        }
      };

      this.nextTrack = function () {
        var tmpl = document.querySelector('#tmpl'),
          next = tmpl.playing + 1,
          audio = document.querySelector('#audio'),
          cover = document.querySelector('#playNotify');
        if (tmpl.playlist[next]) {
          tmpl.playing = next;
          tmpl.currentPlaying = tmpl.playlist[next].artist+ ' - ' + tmpl.playlist[next].title;
          audio.src = tmpl.url + '/rest/stream.view?u=' + tmpl.user + '&p=' + tmpl.pass + '&v=1.10.2&c=PolySonic&maxBitRate=' + tmpl.bitRate + '&id=' + tmpl.playlist[next].id;
          audio.play();
          cover.title = 'Now Playing... ' + tmpl.playlist[next].artist+ ' - ' + tmpl.playlist[next].title;
          if (tmpl.playlist[next].cover !== undefined) {
            var xhr = new XMLHttpRequest();
            xhr.open('GET', tmpl.url + "/rest/getCoverArt.view?u=" + this.user +"&p=" + this.pass +"&f=json&v=" + this.version + "&c=PolySonic&id=" + tmpl.playlist[next].cover, true);
            xhr.responseType = 'blob';
            var card = document.querySelector('#coverArt');
            xhr.onload = function(e) {
              this.image = window.URL.createObjectURL(this.response);
              card.style.backgroundImage = "url('" + this.image + "')";
              cover.icon = this.image;
              document.querySelector("#playNotify").show();
            };
            xhr.send();
          } else {
            document.querySelector('#coverArt').style.backgroundImage =  "url('images/default-cover-art.png')"
          }
        } else {
          this.clearPlayer();
        }
      };
      
      this.lastTrack = function () {
        var tmpl = document.querySelector('#tmpl'),
          next = tmpl.playing - 1,
          audio = document.querySelector('#audio'),
          cover = document.querySelector('#playNotify');
        if (tmpl.playlist[next]) {
          tmpl.playing = next;
          tmpl.currentPlaying = tmpl.playlist[next].artist+ ' - ' + tmpl.playlist[next].title;
          audio.src = tmpl.url + '/rest/stream.view?u=' + tmpl.user + '&p=' + tmpl.pass + '&v=1.10.2&c=PolySonic&maxBitRate=' + tmpl.bitRate + '&id=' + tmpl.playlist[next].id;
          audio.play();
          cover.title = 'Now Playing... ' + tmpl.playlist[next].artist+ ' - ' + tmpl.playlist[next].title;
          if (tmpl.playlist[next].cover !== undefined) {
            var xhr = new XMLHttpRequest();
            xhr.open('GET', tmpl.url + "/rest/getCoverArt.view?u=" + this.user +"&p=" + this.pass +"&f=json&v=" + this.version + "&c=PolySonic&id=" + tmpl.playlist[next].cover, true);
            xhr.responseType = 'blob';
            var card = document.querySelector('#coverArt');
            xhr.onload = function(e) {
              this.image = window.URL.createObjectURL(this.response);
              card.style.backgroundImage = "url('" + this.image + "')";
              cover.icon = this.image;
            };
            xhr.send();
            document.querySelector("#playNotify").show();
          } else {
            document.querySelector('#coverArt').style.backgroundImage =  "url('images/default-cover-art.png')"
          }
        } else {
          this.clearPlayer();
        }
      };
      
      this.toggleWall = function () {
        var wall = document.querySelector("#wall");
        if (wall.listMode === 'cover') {
          wall.listMode = 'list';
          tmpl.view = 'view-module';
          chrome.storage.sync.set({
            'listMode': 'list'
          });
        } else {
          wall.listMode = 'cover';
          tmpl.view = 'view-stream';
          chrome.storage.sync.set({
            'listMode': 'cover'
          });
        }
      },
      
      this.playlistChanged = function () {
        tmpl.playlist = this.playlist;
      };

      this.clearPlayer = function () {
        tmpl.page = 0;
        this.src = '';
        this.playlist = [];
      };

      this.back2List = function () {
        var tmpl = document.querySelector('#tmpl');
        tmpl.page = 0;
      };
      
      this.nowPlaying = function () {
        var tmpl = document.querySelector('#tmpl');
        tmpl.page = 1;
        this.sizePlayer();
      };
      
      this.playPause = function () {
        var audio = document.querySelector('#audio');
        if (!audio.paused) {
          audio.pause();
        } else {
          audio.play();
        }
      };
      
      this.minimize = function () {
        chrome.app.window.current().minimize();
      };
      
      this.maximize = function () {
        var maximized = chrome.app.window.current().isMaximized(),
          buttons = document.querySelectorAll('.max');
        if (maximized) {
          Array.prototype.forEach.call(buttons, function (e) {
            e.icon = 'check-box-outline-blank';
          });
          chrome.app.window.current().restore();
        } else {
          Array.prototype.forEach.call(buttons, function (e) {
            e.icon = 'flip-to-back';
          });
          chrome.app.window.current().maximize();
        }
      };
      
      this.close = function () {
        window.close();
      };
      
      this.progressClick = function (event) {
        var audio = document.querySelector("#audio"),
          clicked = (event.x / window.innerWidth),
          sum = audio.duration - (audio.duration - (audio.duration * clicked));
        audio.currentTime = sum;
      };
      
      this.selectAction = function () {
        var tmpl = document.querySelector('#tmpl');
        document.querySelector("#wall").clearData();
        setTimeout(function () {
          document.querySelector("#wall").sort = tmpl.selected;
        }, 100);
        this.closeDrawer();
      };
      
      this.getPodcast = function () {
        this.closeDrawer();
        document.querySelector("#wall").clearData();
        document.querySelector("#wall").getPodcast();
      };
      
      this.getStarred = function () {
        this.closeDrawer();
        document.querySelector("#wall").clearData();
        document.querySelector("#wall").getStarred();
      };

      this.getArtist = function () {
        this.closeDrawer();
        document.querySelector("#wall").clearData();
        document.querySelector("#wall").getArtist();
      };

      this.toggleVolume = function () {
        var dialog = document.querySelector("#volumeDialog");
        dialog.toggle();
      };
      
      this.showPlaylist = function () {
        document.querySelector('#playlistDialog').toggle();
      };
      
      this.openPanel = function () {
        var panel = document.querySelector('#panel');
        panel.openDrawer();
      };

      this.gotoSettings = function () {
        this.page = 2;
        this.closeDrawer();
      };
      
      this.volUp = function () {
        var audio = document.querySelector('#audio');
        audio.volume = audio.volume + .1;
      };
      
      this.volDown = function () {
        var audio = document.querySelector('#audio');
        audio.volume = audio.volume - .1;
      };
      
      this.clearPlaylist = function () {
        this.playlist = [];
      };
      
      this.loadListeners();
      this.loadData();
      this.sizePlayer();
      setInterval(function () {
        var audio = document.querySelector('#audio'),
          button = document.querySelector('#avIcon');
        if (!audio.paused) {
          button.icon = "av:pause";
          var progress = Math.round((audio.currentTime / audio.duration * 100) * 100) / 100,
            currentMins = Math.floor(audio.currentTime / 60),
            currentSecs = Math.round(audio.currentTime - currentMins * 60),
            totalMins = Math.floor(audio.duration / 60),
            totalSecs = Math.round(audio.duration - totalMins * 60),
            time = document.querySelector('#time');
          tmpl.isNowPlaying = true;
          if (!audio.duration) {
            time.innerHTML = currentMins + ':' + ('0' + currentSecs).slice(-2) + ' / ?:??';
          } else {
            time.innerHTML = currentMins + ':' + ('0' + currentSecs).slice(-2) + ' / ' + totalMins + ':' + ('0' + totalSecs).slice(-2);
          }
          if (!audio.duration) {
            document.querySelector('#progress').value = 0;
          } else {
            document.querySelector('#progress').value = progress;
          }
        } else {
          tmpl.isNowPlaying = false;
          button.icon = "av:play-arrow";
        }
      }, 50);
    });
    chrome.commands.onCommand.addListener(function(command) {
      var tmpl = document.querySelector("#tmpl"),
        audio = document.querySelector('#audio');
      if (command === "playPauseMediaKey") {
        tmpl.playPause();
      } else if (!audio.paused && command === "nextTrackMediaKey") {
        tmpl.nextTrack();
      } else if (!audio.paused && command === "lastTrackMediaKey") {
        tmpl.lastTrack();
      } else if (!audio.paused && command === "nextTrack") {
        tmpl.nextTrack();
      } else if (!audio.paused && command === "lastTrack") {
        tmpl.lastTrack();
      } else if (command === "playPause") {
        tmpl.playPause();
      } else if (command === "volUp") {
        tmpl.volUp();
      } else if (command === "volDown") {
        tmpl.volDown();
      }
    });
