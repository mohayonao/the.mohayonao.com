module.exports = (grunt)->
  'use strict'

  _ = require 'underscore'

  toTaskArgs = (args)->
    switch
      when _.isUndefined args then ''
      when _.isArguments args then _.map(args, toTaskArgs).join ''
      else args

  grunt.loadNpmTasksIfNeeded = (name)->
    if not grunt.loadNpmTasksIfNeeded[name]
      grunt.loadNpmTasksIfNeeded[name] = true
      grunt.loadNpmTasks name

  grunt.filterFiles = (list, filter)->
    if filter
      _.map filter.split('+'), (filter)->
        _.filter list, (file)-> file.indexOf(filter) isnt -1
    else list

  grunt.initConfig
    pkg: grunt.file.readJSON 'package.json'

  if not _.contains process.argv, '--help'
    grunt.loadTasks 'tools/grunt-tasks'

  grunt.registerTask(
    'default'
    'Start web server and run task whenever files changed.'
    [ '-connect', '-watch' ]
  )

  grunt.registerTask(
    'build'
    'Build web pages'
    ->
      grunt.task.run "-coffee:#{toTaskArgs(arguments)}"
      grunt.task.run "-jade:#{toTaskArgs(arguments)}"
      grunt.task.run "-stylus:#{toTaskArgs(arguments)}"
  )

  grunt.registerTask(
    'coffee'
    'Compile CoffeeScript files into JavaScript'
    -> grunt.task.run "-coffee:#{toTaskArgs(arguments)}"
  )

  grunt.registerTask(
    'jade'
    'Compile Jade files into HTML'
    -> grunt.task.run "-jade:#{toTaskArgs(arguments)}"
  )

  grunt.registerTask(
    'stylus'
    'Compile Stylus files into CSS'
    -> grunt.task.run "-stylus:#{toTaskArgs(arguments)}"
  )

  grunt.registerTask(
    'new-app',
    'Create new application boiler-plate'
    -> grunt.task.run "-new-app:#{toTaskArgs(arguments)}"
  )
