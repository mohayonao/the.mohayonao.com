###

 timbre.js - the concept book
 Chapter 02 - Definition of Synth

###

# T("SynthDef") オブジェクトを使えば再利用可能な音源を定義できます
synth = T("SynthDef", def: (opts)->
  syn = T("fami", freq:opts.freq ? 440, mul:0.25)
  syn = syn.to("perc", r:opts.dur ? 500).bang()
)

# .synth() で定義した音源を呼び出します
synth.play()
synth.synth freq:60.midicps()
synth.synth freq:67.midicps()
synth.synth freq:69.midicps()
synth.synth freq:[84..96].choose().midicps(), dur:100

# T("interval") オブジェクトと組み合わせたパターンシーケンス
# .buddies プロパティは開始と停止の同期を取るオブジェクトを指定します
p = [0..12].scramble().midiratio().slice(0, 4)
T("interval", interval:"bpm138 l8", (count)->
  synth.synth freq:440 * p.wrapAt(count), dur:(count%16) * 25 + 100
).set(buddies:synth).start()
# [Ctrl+.]


# .noteOn, .noteOff を使った音源利用
# T("adsr") は sustain-level 到達後, .release() が呼ばれるまで待機します
synth = T("SynthDef", def: (opts)->
  syn = T("fami", freq:opts.freq, mul:0.25)
  syn = syn.to("adsr", a:20, d:120, s:0.8, r:1500, mul:opts.mul).bang()
).play()

# noteOn で指定したMIDIノート番号の発音を開始して
synth.noteOn 60, 80

# noteOff で停止します (.release() を呼ぶ)
synth.noteOff 60
# [Ctrl+.]


# MMLでの音源制御
synth = T("SynthDef", poly:1, def: (opts)->
  syn = T("sin", freq:opts.freq, phase:T("sin", freq:opts.freq*3, mul:2.5), mul:0.25)
  syn = syn.to("adsr", d:250, s:0.75, r:500, mul:opts.mul).bang()
)

T("mml", mml:"t80 o5 l16 gf+d+>a g+<eg+<c r8", synth).on("ended", ->
  @stop()
).set(buddies:synth).start()


# リズムマシン
bd = T("SynthDef", poly:1, def:(opts)->
  a = T("pulse", freq:T("param", value:60).linTo(40, "50ms"))
  a = a.to("lpf", cutoff:80, Q:20)
  a = a.to("perc", r:200, lv:opts.lv ? 1).bang()
).set(mul:0.8)

sd = T("SynthDef", poly:1, def:(opts)->
  a = T("pink", mul:0.5)
  a = a.to("lowshelf", cutoff:800, gain:5)
  a = a.to("perc", r:opts.dur ? 150, lv:opts.lv ? 1).bang()
  a = a.to("reverb", room:0.4)
).set(mul:0.8)

hh = T("SynthDef", poly:1, def:(opts)->
  a = T("pink")
  a = a.to("hpf", cutoff:8800, Q:20)
  a = a.to("perc", r:opts.r ? 50, lv:opts.lv ? 0.8).bang()
).set(mul:0.25)

pattern = "X...O.x. ..o.O...".replace /\s+/g, ''
beat = T("interval", interval:"bpm138 l16", (count)->
  switch pattern.charAt(count % pattern.length)
    when "X" then bd.synth lv:1
    when "x" then bd.synth lv:0.4
    when "O" then sd.synth lv:1
    when "o" then sd.synth lv:0.4, dur:75
  hh.synth
    r : if count % 4 is 2 then 250 else 50
    lv: if count % 2 is 0 then 0.8 else 0.2
).set(buddies:T("comp", {thresh:-24, knee:10, gain:12}, hh, sd,bd)).start()
# [Ctrl+.]



# 移動
(goto "index")
(goto "chapter01") # Oscillator and Envelope
(goto "chapter03") # Audio Buffer
