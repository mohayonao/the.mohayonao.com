module.exports = (grunt)->
  'use strict'

  grunt.registerTask '-watch', ->

    grunt.loadNpmTasksIfNeeded 'grunt-este-watch'

    grunt.config.data.esteWatch =
      options:
        dirs: 'public/**/'
      coffee: (file)-> "-coffee:#{file}"
      jade  : (file)-> "-jade:#{file}"
      styl  : (file)-> "-stylus:#{file}"

    grunt.task.run 'esteWatch'
