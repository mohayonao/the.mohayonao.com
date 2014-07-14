module.exports = (grunt)->
  'use strict'

  grunt.registerTask '-stylus', (filter)->
    src = grunt.filterFiles grunt.file.expand('public/**/*.styl'), filter

    return if src.length is 0

    grunt.loadNpmTasksIfNeeded 'grunt-contrib-stylus'

    grunt.config.data.stylus =
      files:
        expand: yes
        src   : src
        ext   : '.css'

    grunt.task.run 'stylus'
