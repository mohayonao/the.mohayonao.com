module.exports = (grunt)->
  'use strict'

  grunt.registerTask '-connect', ->
    grunt.loadNpmTasksIfNeeded 'grunt-contrib-connect'

    grunt.config.data.connect =
      server:
        options:
          port: process.env.PORT or 3000
          base: 'public'
          hostname: '0.0.0.0'

    grunt.task.run 'connect'
