$ ->
  'use strict'

  dfd = assert.dfd = new $.Deferred

  tests = [
    'deferred'
    'require'
  ]

  count = tests.length
  countdown = ->
    count -= 1
    dfd.resolve() if count is 0

  head = $('script')[0]

  tests.forEach (name)->
    head.parentNode.insertBefore $('<script>').attr(
      async:true, src:"./#{name}/index.js"
    ).on('load', countdown)[0], head
