module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    vulcanize: {
      default: {
        options: {
          inline:true,
          csp: true,
          strip: true
        },
        files: {
          'build/vulcanized.html': 'src/index.html'
        },
      },
    }
  });
  grunt.loadNpmTasks('grunt-vulcanize');

  // Default task(s).
  grunt.registerTask('default', ['vulcanize']);

};
