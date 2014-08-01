module.exports = (grunt)->
  'use strict'

  countOf = (source, str)->
    (1 while (i = source.indexOf(str, i) + 1)).length

  times = (source, times)->
    (source for i in [0...times] by 1).join ''

  grunt.registerTask '-new-app', (name)->
    path = "public/#{name}"

    if grunt.file.exists path
      console.warn "App already exists: #{name}"
      process.exit 0

    depth = countOf(name, '/') + 1
    rel   = times '../', depth

    console.log "mkdir : #{path}/"
    grunt.file.mkdir path

    console.log "create: #{path}/index.jade"
    grunt.file.write "#{path}/index.jade",
      """
      extend #{rel}layout

      block config
        - $.title = \"#{name}\"
        - $.path  = \"/#{name}/\"
        - $.ads   = true

      block content
        h1 \#{$.title}
        \#app

      """

    console.log "create: #{path}/index.coffee"
    grunt.file.write "#{path}/index.coffee",
      """
      $ ->
        'use strict'

      """

    console.log "create: #{path}/index.styl"
    grunt.file.write "#{path}/index.styl",
      """
      @import \"#{rel}layout\"

      """

    grunt.task.run "build:#{name}"
