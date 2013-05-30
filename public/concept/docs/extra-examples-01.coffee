# The SuperCollider Book - Chapter 1 extra examples を真似たもの
# 全選択してから [Ctrl+Enter] で開始
# 停止するときは [Ctrl+.]

crotale = T("SynthDef", def:({params})->
  [freq, index, dur, bus, ratioa, ratiob, attack, decay] = params
  factor = gcd ratioa, ratiob
  ratioa = (ratioa / factor)|0
  ratiob = (ratiob / factor)|0
  T("sin"
    freq : freq * ratioa
    phase: T("sin", freq:freq * ratiob).to("perc", d:dur*100, lv:index*0.1).bang()
    mul  : 0.15
  ).to("perc", a:attack*1000, r:decay*1000).bang()
)

T("task", do:Infinity, init: ->
  range = 60
  
  count    : 0
  countDown: 0
  offset   : 0
  range    : range
  envs     : [[0, 0.9], [0.01, 0.9], [0.1, 0.8], [0.8, 0.01]],
  repeat   : Array.fill(10, ->
    [ (rrand(range, range+24)|0).midicps(), 3, 2.1 - exprand(0.1, 2.0), 0, 1, 1, 0, 0.9]
  )
  next     : Array.fill(10, ->
    [3, 0.75, 0.5, 0.25, 0.125].choose()
  )
  freq     : rrand(range, range*2)|0

, (i, args)->
  if args.countDown <= 0
    env = args.envs.choose()
    args.next  .put args.count % 10, [3, 0.5, 0.25, 0.125, 0.125].choose()
    args.repeat.put args.count % 10, [
      (rrand(args.range, args.range + 24)|0).midicps()
      rrand(0.1, 12.0)
      2.1 - exprand(0.1, 2.0), 0, rrand(1, 12)|0,
      rrand(1, 12)|0, env.at(0), env.at(1)
    ]
  crotale.synth params:args.repeat.wrapAt(args.count)
  @wait args.next.wrapAt(args.count) * 1000

, (i, args)->
  if args.count > 10 and args.countDown <= 0
    args.offset = args.countDown = [0, 3.rand()|0, 6.rand()|6].choose()
    args.count -= args.offset
  args.count += 1
  args.countDown -= 1

).set(buddies:crotale.to("delay", time:100, fb:0.975)).start()
