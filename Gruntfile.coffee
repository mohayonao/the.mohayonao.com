module.exports = (grunt)->
  'use strict'
  
  GRUNT_CHANGED_PATH = '.grunt-changed-file'
  if grunt.file.exists GRUNT_CHANGED_PATH
    changed = grunt.file.read GRUNT_CHANGED_PATH
    grunt.file.delete GRUNT_CHANGED_PATH
    changed_only = (file)-> file is changed
  else
    changed_only = -> true
  
  data =
    index: grunt.file.readJSON 'public/index.json'  
  
  grunt.initConfig
    watch:
      jade:
        files: 'public/**/*.jade'
        tasks: 'jade'
      stylus:
        files: 'public/**/*.styl'
        tasks: 'stylus'
      coffee:
        files: 'public/**/*.coffee'
        tasks: 'coffee'
      index:
        files: 'public/index.json'
        tasks: 'index'
    jade:
      files:
        expand : true
        src    : 'public/**/*.jade'
        options:
          data: data
        ext    : '.html'
        filter : changed_only
    stylus:
      files:
        expand : true
        src    : 'public/**/*.styl'
        ext    : '.css'
        filter : changed_only
    coffee:
      files:
        expand : true
        src    : 'public/**/*.coffee'
        ext    : '.js'
        filter : changed_only
  
  grunt.loadNpmTasks 'grunt-contrib-watch'
  grunt.loadNpmTasks 'grunt-contrib-jade'
  grunt.loadNpmTasks 'grunt-contrib-stylus'
  grunt.loadNpmTasks 'grunt-contrib-coffee'

  grunt.event.on 'watch', (action, changed)->
    if action is 'changed'
      if not /(layout|index\.json)/.test changed
        grunt.file.write GRUNT_CHANGED_PATH, changed
  
  grunt.registerTask 'default', ['watch']
  grunt.registerTask 'index'  , ['jade']
  grunt.registerTask 'build'  , ['jade', 'stylus', 'coffee']

  grunt.registerTask 'new_app', (name)->
    fs = require 'fs'
    path = "#{__dirname}/public/#{name}"
    if fs.existsSync path
      console.warn "App already exists: #{name}"
      process.exit 0

    console.log "mkdir : #{path}"
    fs.mkdirSync path

    console.log "create: #{path}/index.jade"
    fs.writeFileSync "#{path}/index.jade", """extend ../lib/layout

block config
  - $.title = \"#{name}\"
  - $.path  = \"/#{name}\"
  - $.jslist  = [\"index.js\"]
  - $.csslist = [\"index.css\"]

block content
  h1 \#{$.title}
  \#container
"""
    console.log "create: #{path}/index.coffee"
    fs.writeFileSync "#{path}/index.coffee", "$ ->\n  'use strict'"
    console.log "create: #{path}/index.styl"
    fs.writeFileSync "#{path}/index.styl", '@import "../lib/layout"\n\n#content\n  0'
