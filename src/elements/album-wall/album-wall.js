Polymer({
  is: 'album-wall',
  
  behaviors: [
    Polymer.NeonAnimatableBehavior,
    Polymer.NeonAnimationRunnerBehavior,
    Polymer.NeonSharedElementAnimatableBehavior
  ],
  
  properties: {
    
    /**
     * the list of albums
     */
    albumWall: {
      type: Array,
      value: []
    },
    
    /**
     * page currentlly showing
     */
    showing: {
      type: Number,
      value: 0
    },
    
    /*
     * is fab on screen 
     */
    fabShowing: {
      type: Boolean,
      value: false
    },
    
    /**
     * the details about the request
     */
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
  
  /**
   * animation is finished
   * @param {Event} e
   */
  _onAnimationFinish: function (e) {
    if (!this.fabShowing) {
      this.$.fab.hidden = true;
    }
  },

  /**
   * jupm to top of page
   */
  jumpToTop: function () {
    if (this.$.header.scroller.scrollTop !== 0) {
      this.$.header.scroller.scrollTop = 0;
    }
  },
  
  /**
   * open the app drawer
   */
  _openDrawer: function () {
    this.app.openDrawer();
  },
  
  /**
   * app resize callback
   */
  resizeElement: function () {
    if (!this.app.narrow) {
      this.$.menuButton.hidden = true;
    } else {
      this.$.menuButton.hidden = false;
    }
  },
  
  /**
   * load more items to list
   */
  lazyLoad: function () {
    console.timeStamp('start lazy load');
    this.app.fetchJSON(this.app.buildUrl('getAlbumList', this.post)).then(function (json) {
      console.timeStamp('end lazy load');
      var newAlbums = json.albumList.album;
      if (newAlbums) {
        console.timeStamp('concat results');
        this.albumWall = this.albumWall.concat(newAlbums);
        console.timeStamp('output results');
      } else  {
        this.pageLimit = true;
      }
      this.isLoading = false;
    }.bind(this));
  },
  
  /**
   * element is ready 
   */
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
        this.async(lazyload);
      }
    }.bind(this);
  }
});
