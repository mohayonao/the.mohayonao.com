$ ->
  'use strict'

  # DeferredKlass = $.Deferred
  # console.log "use: jQuery deferred"

  DeferredKlass = Deferred
  console.log "use: my deferred"

  (
    a = new DeferredKlass
    a.then((value)->
      console.log "(1): value #{value} [10]"
      20
    )
    a.then((value)->
      console.log "(2): value #{value} [10]"
      30
    )
    a.then((value)->
      console.log "(3): value #{value} [10]"
      40
    )
    a.resolve(10)
  )
  console.log "-----"
  (
    a = new DeferredKlass
    a.then((value)->
      console.log "(1): value #{value} [10]"
      20
    ).then((value)->
      console.log "(2): value #{value} [20]"
      30
    ).then((value)->
      console.log "(3): value #{value} [30]"
      40
    )
    a.resolve(10)
  )
  console.log "-----"
  (
    a = new DeferredKlass
    a.then((value)->
      console.log "(1): value #{value} [10]"
      dfd = new $.Deferred()
      setTimeout (-> dfd.resolve 20), 500
      dfd.promise()
    ).then((value)->
      console.log "(2): value #{value} [20]"
      dfd = new $.Deferred()
      setTimeout (-> dfd.resolve 30), 500
      dfd.promise()
    ).then((value)->
      console.log "(3): value #{value} [30]"
      dfd = new $.Deferred()
      setTimeout (-> dfd.resolve 40), 500
      dfd.promise()
    )
    a.resolve(10)
  )
