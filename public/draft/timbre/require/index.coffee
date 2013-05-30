describe 'require', ->
  it '`define` will not be executed until it is `require`', ->
    defined = false
    
    timbre.define 'test(1)', ->
      console.log 'defined: test(1)'
      defined = true
    assert.equal defined, false, 'define'
    
    timbre.require 'test(1)'
    assert.equal defined, true, 'require'

  it 'deps', ->
    defined = 0
    
    timbre.define 'test(2)', ['test(3)', 'test(4)'], ->
      defined *= 100
    timbre.define 'test(3)', ['test(4)'], ->
      defined *= 2
    timbre.define 'test(4)', ->
      defined += 1
    assert.equal defined, 0, 'define'

    timbre.require 'test(2)'
    assert.equal defined, 200, 'require'

  it 'require', ->
    timbre.require('./test-module').then ->
      assert.equal timbre.modules['test-module'], 100
