describe 'deferred', ->
  it 'new', ->
    assert.doesNotThrow ->
      new timbre.Deferred
