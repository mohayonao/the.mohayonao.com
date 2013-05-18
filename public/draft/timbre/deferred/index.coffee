describe 'deferred', ->
  Deferred = timbre.Deferred
  
  it 'new', ->
    assert.instanceOf new Deferred(), Deferred

  it 'sync', ->
    dfd = new Deferred().resolve()
    a = 0
    dfd.then -> a += 5
    dfd.then -> a *= 2
    assert.equal a, 10

  it 'async', (done)->
    dfd = new Deferred()
    a = 0
    setTimeout ->
      a += 5
      dfd.resolve()
    , 25
    dfd.then -> a *= 2
    dfd.then ->
      assert.equal a, 10
      done()

  it 'promise', ->
    dfd = new Deferred().resolve(100).promise()
    a = 0
    dfd.then (b)-> a = b
    assert.equal a, 100

  it 'when', (done)->
    dfd1 = new Deferred()
    dfd2 = new Deferred()
    a = b = 0
    setTimeout ->
      a = 10
      dfd1.resolve()
    , 25
    setTimeout ->
      b = 20
      dfd2.resolve()
    , 50
    Deferred.when(dfd1, dfd2).then ->
      assert.equal a, 10
      assert.equal b, 20
      done()
