Polymer({
  is: 'album-wall',
  properties: {
    albumWall: {
      type: Array
    },
    showing: {
      type: Number,
      value: 0
    },
    animationConfig: {
      type: Object,
      value: function() {
        return {
          'entry': [{
            name: 'slide-from-right-animation',
            node: this
          }],
          'exit': [{
            name: 'slide-left-animation',
            node: this
          }]
        };
      }
    }
  },
  listeners: {
    'neon-animation-finish': '_onAnimationFinish'
  },
  _onAnimationFinish: function (e) {
    console.log(e);
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
  }
});