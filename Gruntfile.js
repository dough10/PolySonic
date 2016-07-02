module.exports = function(grunt) {
  grunt.initConfig({
    copy: {
      main: {
        files: [
          {
            nonull: true,
            src: 'src/manifest.json',
            dest: 'build/manifest.json'
          }, {
            nonull: true,
            src: 'src/vulcanized.js',
            dest: 'build/vulcanized.js'
          }, {
            nonull: true,
            src: 'src/background.js',
            dest: 'build/background.js'
          }, {
            expand: true,
            cwd: 'src',
            nonull: true,
            src: 'images/*',
            dest: 'build'
          }, {
            expand: true,
            cwd: 'src',
            nonull: true,
            src: '_locales/*/*',
            dest: 'build'
          }
        ]
      }
    },
    babel: {
      options: {
        sourceMap: true,
        plugins: [
          "transform-es2015-arrow-functions",
          "transform-es2015-block-scoping"
        ]
      },
      build: {
        files: {
          "src/js/PolySonic.js": "src/js/PolySonic.es6"
        }
      }
    },
    processhtml: {
      build: {
        options: {
          strip: true,
          recursive: true
        },
        files: {
          'src/build.html':'src/index.html'
        }
      }
    },
    uglify: {
      build: {
        files: {
          'src/vulcanized.js': [
            'src/vulcanized.js'
          ]
        }
      }
    },
    cssmin: {
      options: {
        shorthandCompacting: false,
        roundingPrecision: -1
      },
      target: {
        files: {
          'src/app.min.css': [
            'src/styles/pace.css'
          ]
        }
      }
    },
    minifyPolymer: {
      default: {
        files: {
          'build/index.html': 'src/vulcanized.html'
        }
      }
    }
  });
  grunt.loadNpmTasks('grunt-processhtml');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-minify-polymer');
  grunt.loadNpmTasks('grunt-babel');
  grunt.registerTask('build', ['babel', 'processhtml', 'cssmin:target']);
  grunt.registerTask('minify', ['uglify', 'minifyPolymer', 'copy']);
};
