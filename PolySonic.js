    var PolySonic = {
      position:0,
      playlist:[],
      closePanel: function () {
        var panel = document.querySelector('#panel');
        panel.closeDrawer();
      },
      loadListeners: function () {
        var menuButton = document.querySelector("#menuButton"),
          tmpl = document.querySelector('#tmpl'),
          scroller = PolySonic.appScroller(),
          audio = document.querySelector('#audio'),
          maximized = chrome.app.window.current().isMaximized(),
          buttons = document.querySelectorAll('.max');
        if (maximized) {
          Array.prototype.forEach.call(buttons, function (e) {
            e.icon = 'flip-to-back';
          });
        } else {
          Array.prototype.forEach.call(buttons, function (e) {
            e.icon = 'check-box-outline-blank';
          });
        }
        window.onresize = PolySonic.sizePlayer;
        audio.onended = function () {
          var next = tmpl.playing + 1;
          if (PolySonic.playlist[next]) {
            tmpl.playing = next;
            document.querySelector('#playNotify').title = 'Now Playing... ' + PolySonic.playlist[next].artist + ' - ' + PolySonic.playlist[next].title;
            tmpl.currentPlaying = PolySonic.playlist[next].artist + ' - ' + PolySonic.playlist[next].title;
            this.src = tmpl.url + '/rest/stream.view?u=' + tmpl.user + '&p=' + tmpl.pass + '&v=1.10.2&c=PolySonic&id=' + PolySonic.playlist[next].id;
            this.play();
            if (PolySonic.playlist[next].cover !== undefined) {
              var xhr = new XMLHttpRequest();
              xhr.open('GET', tmpl.url + "/rest/getCoverArt.view?u=" + tmpl.user +"&p=" + tmpl.pass +"&f=json&v=" + tmpl.version + "&c=PolySonic&id=" + PolySonic.playlist[next].cover, true);
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
              document.querySelector('#coverArt').style.backgroundImage =  "url('assets/default-cover-art.png')"
            }
          } else {
            tmpl.page = 0;
            this.src = '';
            scroller.scrollTop = PolySonic.position;
            PolySonic.playlist = [];
            this.playlist = [];
          }
        }
        
        /* chromecast api */
        initializeCastApi = function() {
          console.log(this);
          var sessionRequest = new chrome.cast.SessionRequest(applicationID);
          var apiConfig = new chrome.cast.ApiConfig(sessionRequest,
            sessionListener,
            receiverListener);
          chrome.cast.initialize(apiConfig, onInitSuccess, onError);
        };
        window['__onGCastApiAvailable'] = function(loaded, errorInfo) {
          if (loaded) {
            initializeCastApi();
          } else {
            console.log(errorInfo);
          }
        }
      },
      
      sizePlayer: function () {
        var height = (window.innerHeight - 256) + 'px',
          width = window.innerWidth + 'px';
        document.querySelector('#coverArt').style.width = width;
        document.querySelector('#coverArt').style.height = height;
        document.querySelector('#coverArt').style.backgroundSize = width;
      },
      
      appScroller: function () {
        return document.querySelector('#headerPanel').scroller;
      },
      
      loadData: function () {
        var tmpl = document.querySelector("#tmpl");
        chrome.storage.sync.get('url', function (result) {
          if (typeof result.url === 'undefined') {
            document.querySelector('#firstRun').toggle();
          } else {
            tmpl.url = result.url;
          }
        });
        chrome.storage.sync.get('user', function (result) {
          tmpl.user = result.user;
        });
        chrome.storage.sync.get('pass', function (result) {
          tmpl.pass = result.pass;
        });
        chrome.storage.sync.get('version', function (result) {
          tmpl.version = result.version;
        });
        setTimeout(function () {
          if (tmpl.url && tmpl.user && tmpl.pass && tmpl.version) {
            document.querySelector('#wall').doAjax();
          } else {
            PolySonic.loadData();
          }
        }, 100);
        PolySonic.sizePlayer();
      }
    };

    document.querySelector('#tmpl').addEventListener('template-bound', function () {
      this.page = this.page || 0;
      this.volume = 100;
      this.sortTypes = [
        {sort:'newest', name:'Newest'},
        {sort:'frequent', name:'Frequent'},
        {sort:'alphabeticalByName', name:'By Title'},
        {sort:'alphabeticalByArtist', name:'By Artist'},
        {sort:'recent', name:'Recently Played'}
      ];

      this.playThis = function (event, detail, sender) {
        var tmpl = document.querySelector('#tmpl'),
          url = tmpl.url,
          user = tmpl.user,
          pass = tmpl.pass,
          cover = document.querySelector('#playNotify');
        tmpl.currentPlaying = sender.attributes.artist.value+ ' - ' + sender.attributes.title.value;
        audio.src = tmpl.url + '/rest/stream.view?u=' + tmpl.user + '&p=' + tmpl.pass + '&v=1.10.2&c=PolySonic&id=' + sender.attributes.ident.value;
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
          document.querySelector('#coverArt').style.backgroundImage =  "url('assets/default-cover-art.png')"
        }
      };

      this.nextTrack = function () {
        var tmpl = document.querySelector('#tmpl'),
          next = tmpl.playing + 1,
          audio = document.querySelector('#audio'),
          scroller = PolySonic.appScroller(),
          cover = document.querySelector('#playNotify');
        if (PolySonic.playlist[next]) {
          tmpl.playing = next;
          tmpl.currentPlaying = PolySonic.playlist[next].artist+ ' - ' + PolySonic.playlist[next].title;
          audio.src = tmpl.url + '/rest/stream.view?u=' + tmpl.user + '&p=' + tmpl.pass + '&v=1.10.2&c=PolySonic&id=' + PolySonic.playlist[next].id;
          audio.play();
          cover.title = 'Now Playing... ' + PolySonic.playlist[next].artist+ ' - ' + PolySonic.playlist[next].title;
          if (PolySonic.playlist[next].cover !== undefined) {
            var xhr = new XMLHttpRequest();
            xhr.open('GET', tmpl.url + "/rest/getCoverArt.view?u=" + this.user +"&p=" + this.pass +"&f=json&v=" + this.version + "&c=PolySonic&id=" + PolySonic.playlist[next].cover, true);
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
            document.querySelector('#coverArt').style.backgroundImage =  "url('assets/default-cover-art.png')"
          }
        } else {
          tmpl.page = 0;
          this.src = '';
          scroller.scrollTop = PolySonic.position;
          PolySonic.playlist = [];
        }
      };
      
      this.lastTrack = function () {
        var tmpl = document.querySelector('#tmpl'),
          next = tmpl.playing - 1,
          audio = document.querySelector('#audio'),
          scroller = PolySonic.appScroller(),
          cover = document.querySelector('#playNotify');
        if (PolySonic.playlist[next]) {
          tmpl.playing = next;
          tmpl.currentPlaying = PolySonic.playlist[next].artist+ ' - ' + PolySonic.playlist[next].title;
          audio.src = tmpl.url + '/rest/stream.view?u=' + tmpl.user + '&p=' + tmpl.pass + '&v=1.10.2&c=PolySonic&id=' + PolySonic.playlist[next].id;
          audio.play();
          cover.title = 'Now Playing... ' + PolySonic.playlist[next].artist+ ' - ' + PolySonic.playlist[next].title;
          if (PolySonic.playlist[next].cover !== undefined) {
            var xhr = new XMLHttpRequest();
            xhr.open('GET', tmpl.url + "/rest/getCoverArt.view?u=" + this.user +"&p=" + this.pass +"&f=json&v=" + this.version + "&c=PolySonic&id=" + PolySonic.playlist[next].cover, true);
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
            document.querySelector('#coverArt').style.backgroundImage =  "url('assets/default-cover-art.png')"
          }
        } else {
          tmpl.page = 0;
          this.src = '';
          scroller.scrollTop = PolySonic.position;
          PolySonic.playlist = [];
        }
      };
      
      this.back2List = function () {
        var tmpl = document.querySelector('#tmpl'),
          scroller = PolySonic.appScroller();
        tmpl.page = 0;
        setTimeout(function () {
          scroller.scrollTop = PolySonic.position;
        }, 500);
      };
      
      this.nowPlaying = function () {
        var tmpl = document.querySelector('#tmpl');
        tmpl.page = 1;
        PolySonic.sizePlayer();
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
        PolySonic.closePanel();
      };
      
      this.getPodcast = function () {
        document.querySelector("#wall").clearData();
        document.querySelector("#wall").getPodcast();
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
        PolySonic.closePanel();
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
        PolySonic.playlist = [];
      };
      
      PolySonic.loadListeners();
      PolySonic.loadData();
      setInterval(function () {
        var audio = document.querySelector('#audio'),
          button = document.querySelector('#avIcon');
        if (!audio.paused) {
          button.icon = "av:pause";
          var progress = Math.round((audio.currentTime / audio.duration * 100) * 100) / 100,
            current = (audio.currentTime / 60),
            duration = (audio.duration / 60),
            time = document.querySelector('#time');
          tmpl.isNowPlaying = true;
          if (!audio.duration) {
            time.innerHTML = (Math.round(current * 100) / 100).toFixed(2) + ' / ?:??';
          } else {
            time.innerHTML = (Math.round(current * 100) / 100).toFixed(2) + ' / ' + (Math.round(duration * 100) / 100).toFixed(2);
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
      }, 100);
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