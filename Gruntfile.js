'use strict';
var mountFolder = function (connect, dir) {
  return connect.static(require('path').resolve(dir));
};

module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
      },
      dist: {
        src: 'dist/<% pkg.name %>.js',
        dest: 'dist/<%= pkg.name %>.min.js'
      }
    },
    concat: {
      dist: {
        src: 'app/js/cbeam.*.js',
        dest: 'dist/<%= pkg.name %>.js'
      }
    },
    connect: {
      options: {
        port: 9000,
        hostname: 'localhost',
        base: 'app',
      },
      dev: {
        livereload: {
          options: {
            middleware: function (connect) {
              return [
                lrSnippet,
                mountFolder(connect, '.tmp'),
                mountFolder(connect, 'app')
              ];
            }
          }
        }
      }
    },
    watch: {
      scripts: {
        files: 'app/css/*.less',
        tasks: ['recess']
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-recess');

  grunt.registerTask('server', ['connect']);
  grunt.registerTask('watch', ['watch']);
};
