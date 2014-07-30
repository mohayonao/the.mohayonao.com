module.exports = (grunt)->
  'use strict'

  grunt.registerTask '-coffee', (filter)->
    src = grunt.file.expand [ 'public/**/*.coffee', '!**/layout.coffee' ]
    src = grunt.filterFiles src, filter

    return if src.length is 0

    grunt.loadNpmTasksIfNeeded 'grunt-contrib-coffee'

    grunt.config.data.coffee =
      files:
        expand: yes
        src   : src
        ext   : '.js'

    grunt.task.run 'coffee'
