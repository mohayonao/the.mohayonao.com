module.exports = (grunt)->
  'use strict'

  grunt.registerTask '-coffee', (filter)->
    src = grunt.filterFiles grunt.file.expand('public/**/*.coffee'), filter

    return if src.length is 0

    grunt.loadNpmTasksIfNeeded 'grunt-contrib-coffee'

    grunt.config.data.coffee =
      files:
        expand: yes
        src   : src
        ext   : '.js'

    grunt.task.run 'coffee'
