module.exports = (grunt)->
  'use strict'

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

    index: index

  grunt.registerTask '-jade', (filter)->
    src = grunt.filterFiles grunt.file.expand('public/**/*.jade'), filter

    return if src.length is 0

    grunt.loadNpmTasksIfNeeded 'grunt-contrib-jade'

    grunt.config.data.jade =
      files:
        expand: yes
        src   : src
        ext   : '.html'
        options: data: data

    grunt.task.run 'jade'
