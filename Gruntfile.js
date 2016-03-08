module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    copy: {
      main: {
        files: [
          {nonull: true, src: 'src/PolySonic.html', dest: 'build/index.html'},
          {nonull: true, src: 'src/background.js', dest: 'build/background.js'},
          {nonull: true, src: 'src/manifest.json', dest: 'build/manifest.json'},
          {expand: true, cwd: 'src/', nonull: true, src: '_locales/*/*.json', dest: 'build/'},
          {expand: true, cwd: 'src/', nonull: true, src: 'images/*', dest: 'build/'}
        ]
      }
    },
    vulcanize: {
      default: {
        options: {
          inline:true,
          csp: true,
          strip: true
        },
        files: {
          'src/PolySonic.html': 'src/index.html'
        }
      }
    },
    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
      },
      build: {
        src: 'src/PolySonic.js',
        dest: 'build/PolySonic.js'
      }
    },
    uncss: {
      main: {
        files: {
          'build/PolySonic.css': ['src/index.html']
        }
      }
    },
    htmlmin: {
      build: {
        options: {
          removeComments: true,
          collapseWhitespace: true
        },
        files: {
          'build/PolySonic.html' : 'src/PolySonic.html'
        }
      }
    },
    cssmin: {
      main: {
        files: [
          {
            expand: true, cwd: 'src/',
            src: ['PolySonic.html'],
            dest: 'src/',
            ext: '.css'
          }
        ]
      }
    }
  });
  grunt.loadNpmTasks('grunt-vulcanize');
  /*grunt.loadNpmTasks('grunt-contrib-htmlmin');*/
  grunt.loadNpmTasks('grunt-contrib-uglify');
  /*grunt.loadNpmTasks('grunt-uncss');*/
  grunt.loadNpmTasks('grunt-contrib-copy');
  /*grunt.loadNpmTasks('grunt-contrib-cssmin');*/

  // Default task(s).
  grunt.registerTask('default', ['vulcanize', 'uglify', 'copy']);

};
