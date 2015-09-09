Polymer({
  is: 'album-wall',
  behaviors: [
    Polymer.NeonAnimatableBehavior,
    Polymer.NeonAnimationRunnerBehavior,
    Polymer.NeonSharedElementAnimatableBehavior
  ],
  properties: {
    albumWall: {
      type: Array
    },
    showing: {
      type: Number,
      value: 0
    },
    fabShowing: {
      type: Boolean,
      value: false
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
          },
          'detailsOpen': {
            name: 'transform-animation',
            node:this.$.fab,
            transformTo: "translateY(-230px)"
          },
          'detailsClose': {
            name: 'transform-animation',
            node:this.$.fab,
            transformTo: "translateY(300px)"
          }
        };
      }
    }
  },
  listeners: {
    'neon-animation-finish': '_onAnimationFinish'
  },
  _onAnimationFinish: function (e) {
    if (!this.fabShowing && !this.showingDetails) {
      this.$.fab.hidden = true;
    }
    if (this.showingDetails && this.fabShowing) {
      this.$.fab.style.bottom = '246px';
    } else {
      this.$.fab.style.bottom = '16px';
    }
  },
  moveFabToDetailsPos: function () {
    this.$.fab.icon = 'av:play-arrow';
    this.$.fab.hidden = false;
    this.showingDetails = true;
    this.fabShowing = true;
    this.playAnimation('detailsOpen');
  },
  moveFabBackToBottom: function () {
    this.$.fab.icon = 'arrow-drop-up';
    this.$.fab.hidden = false;
    this.showingDetails = false;
    this.fabShowing = false;
    this.playAnimation('detailsClose');
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
      if (!this.isLoading && !this.pageLimit && this.$.header.scroller.scrollTop >= (this.$.header.scroller.scrollHeight - 1700) && app.request !== 'getStarred' && app.request !== 'getStarred2') {
        this.isLoading = true;
        console.log('load me!!!');
      }
    }.bind(this);
  }
});
