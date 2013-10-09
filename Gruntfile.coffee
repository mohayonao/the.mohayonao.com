module.exports = (grunt)->
  'use strict'
  
  String::countOf = (str)->
    (1 while (i = @.indexOf(str, i) + 1)).length
  String::times = (times)->
    (@ for i in [0...times] by 1).join ''
    
  GRUNT_CHANGED_PATH = '.grunt-changed-file'
  if grunt.file.exists GRUNT_CHANGED_PATH
    changed = grunt.file.read GRUNT_CHANGED_PATH
    grunt.file.delete GRUNT_CHANGED_PATH    
    changed_only = (file)-> file is changed
  else
    changed_only = (file)-> true
  
  data = do ->
    index = grunt.file.readJSON 'public/index.json'
    dict = {}
    for filepath in grunt.file.expand 'public/*/index.jade'
      name = /^public\/([-\w]+)\/index.jade/.exec(filepath)[1]
      skip = true
      map  = dict[name] = {}
      for line in grunt.file.read(filepath).split '\n'
        line = line.trim()
        if line is 'block content'
          break
        if line is 'block config'
          skip = false
          continue
        if not skip and (m = /^\s*- \$\.([\w]+)\s*=\s*([\w\W]+?);?$/.exec line)
          map[m[1]] = JSON.parse m[2]
    list = index[0].list
    for i in [0...list.length] by 1
      if typeof list[i] is 'string'
        list[i] = dict[list[i]]
    index:index
  
  grunt.initConfig
    connect:
      server:
        options:
          port: process.env.PORT or 3000
          base: 'public'
          hostname: '0.0.0.0'
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

  grunt.loadNpmTasks 'grunt-contrib-connect'
  grunt.loadNpmTasks 'grunt-contrib-watch'
  grunt.loadNpmTasks 'grunt-contrib-jade'
  grunt.loadNpmTasks 'grunt-contrib-stylus'
  grunt.loadNpmTasks 'grunt-contrib-coffee'

  grunt.event.on 'watch', (action, changed)->
    if not /(layout|index\.json)/.test changed
      grunt.file.write GRUNT_CHANGED_PATH, changed
  
  grunt.registerTask 'default', ['connect', 'watch']
  grunt.registerTask 'index'  , ['jade']
  grunt.registerTask 'build'  , ['jade', 'stylus', 'coffee']
  
  grunt.registerTask 'new_app', (name)->
    path = "public/#{name}"
    if grunt.file.exists path
      console.warn "App already exists: #{name}"
      process.exit 0

    depth = name.countOf('/') + 1
    rel   = '../'.times depth

    console.log "mkdir : #{path}/"
    grunt.file.mkdir path
  
    console.log "create: #{path}/index.jade"
    grunt.file.write "#{path}/index.jade", """
extend #{rel}lib/layout

block config
  - $.title = \"#{name}\"
  - $.path  = \"/#{name}/\"
  - $.jslist  = [\"index.js\"]
  - $.csslist = [\"index.css\"]

block content
  h1 \#{$.title}
  \#unit
    
"""

    console.log "create: #{path}/index.coffee"
    grunt.file.write "#{path}/index.coffee", """
$ ->
  'use strict'

  
"""
    
    console.log "create: #{path}/index.styl"
    grunt.file.write "#{path}/index.styl", """
@import \"#{rel}lib/layout\"

#content
  0
"""

    if depth is 1
      grunt.file.copy 'public/lib/appimage.png', "#{path}/appimage.png"

    path = "public/#{name}"
    grunt.config.set ['jade'  ,'files','filter'], (file)-> file is "#{path}/index.jade"
    grunt.config.set ['stylus','files','filter'], (file)-> file is "#{path}/index.styl"
    grunt.config.set ['coffee','files','filter'], (file)-> file is "#{path}/index.coffee"
    grunt.task.run 'build'
