module.exports = (grunt)->
  'use strict'

  grunt.registerTask '-jade', (filter)->
    src = grunt.file.expand [ 'public/**/*.jade', '!**/layout.jade' ]
    src = grunt.filterFiles src, filter

    return if src.length is 0

    grunt.loadNpmTasksIfNeeded 'grunt-contrib-jade'

    grunt.config.data.jade =
      files:
        expand: yes
        src   : src
        ext   : '.html'
        options:
          pretty: yes

    grunt.task.run 'jade'
