Polymer({
  is: 'album-wall',
  
  behaviors: [
    Polymer.NeonAnimatableBehavior,
    Polymer.NeonAnimationRunnerBehavior,
    Polymer.NeonSharedElementAnimatableBehavior
  ],
  
  properties: {
    
    albumWall: {
      type: Array,
      value: []
    },
    
    showing: {
      type: Number,
      value: 0
    },
    
    fabShowing: {
      type: Boolean,
      value: false
    },
    
    post: {
      type: Object
    },
    
    animationConfig: {
      type: Object,
      value: function() {
        return {
          'entry': [{
            name: 'hero-animation',
            id: 'fab',
            toPage: this
          }, {
            name: 'fade-in-animation',
            node: this.$.header
          }],
          'exit': [{
            name: 'hero-animation',
            id: 'fab',
            fromPage: this
          }, {
            name: 'fade-out-animation',
            node: this.$.header
          }],
          'fabUp': {
            name: 'transform-animation',
            node: this.$.fab,
            transformFrom: "translateY(130%)"
          },
          'fabDown': {
            name: 'transform-animation',
            node: this.$.fab,
            transformTo: "translateY(130%)"
          }
        };
      }
    }
  },
  
  listeners: {
    'neon-animation-finish': '_onAnimationFinish'
  },
  
  _onAnimationFinish: function (e) {
    if (!this.fabShowing) {
      this.$.fab.hidden = true;
    }
  },

  jumpToTop: function () {
    if (this.$.header.scroller.scrollTop !== 0) {
      this.$.header.scroller.scrollTop = 0;
    }
  },
  
  _openDrawer: function () {
    this.app.openDrawer();
  },
  
  resizeElement: function () {
    if (!this.app.narrow) {
      this.$.menuButton.hidden = true;
    } else {
      this.$.menuButton.hidden = false;
    }
  },
  
  ready: function () {
    this.app = document.querySelector('#app');
    this.async(this.resizeElement);
    this.$.header.scroller.onscroll = function (e) {
      if (this.$.header.scroller.scrollTop > this.position && !this.fabShowing) {
        this.fabShowing = true;
        this.$.fab.hidden = false;
        this.playAnimation('fabUp');
      } else if (this.$.header.scroller.scrollTop < this.position && this.fabShowing) {
        this.fabShowing = false;
        this.$.fab.hidden = false;
        this.playAnimation('fabDown');
      }
      this.position = this.$.header.scroller.scrollTop;
      if (!this.isLoading && !this.pageLimit && this.$.header.scroller.scrollTop >= (this.$.header.scroller.scrollHeight - 1000) && app.request !== 'getStarred' && app.request !== 'getStarred2') {
        this.isLoading = true;
        this.post.offset = Number(this.post.offset) + Number(app.querySize);
        this.async(function () {
          this.app.fetchJSON(this.app.buildUrl('getAlbumList', this.post)).then(function (json) {
            var newAlbums = json.albumList.album;
            if (newAlbums) {
              this.albumWall = this.albumWall.concat(newAlbums);
            } else  {
              this.pageLimit = true;
            }
            this.isLoading = false;
          }.bind(this));
        });
      }
    }.bind(this);
  }
});
