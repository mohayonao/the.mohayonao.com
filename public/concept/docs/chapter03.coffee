###

 timbre.js - the concept book
 Chapter 03 - Audio Buffer

###

# オーディオファイルを読み込む
a = T("audio", load:"drum.wav", loop:true)

# .play() で再生します
a.play()
# [Ctrl+.]

# 他のオブジェクトと同じように扱えます
a.to("delay", time:100).play()
# [Ctrl+.]

# 逆再生
a.set(reverse:true).play()

# .pause() で停止します
a.set(reverse:false).pause()

# 再生スピードの変更
a.set(pitch:0.8).play()
a.pitch = T("param", value:0.8).linTo(1.2, "5sec")
a.pitch = 1
# [Ctrl+.]

# 再生位置の指定
a.currentTime = Math.random() * a.duration
a.play()
# [Ctrl+.]


# 分割 (2小節あるパターンを16分音符長ごとに分割)
list = for i in [0...16]
  t = a.duration / 16
  a.slice(t * i, (i + 1) * t).set(loop:false)

# パターンの再構築
p = [0...8].scramble()
i = T("interval", interval:a.duration / 16, (count)->
  list[p.wrapAt(count)].clone().on("ended", ->
    @pause()
  ).set(loop:false).play()
).start()
# [Ctrl+.]


# オーディオファイルの読み込みは非同期で行なわれます
# 例えば, 以下のコードでは 読み込み完了前 に 分割 が実行されて空バッファを再生します
#   読み込み開始 -> 分割
#                -> (非同期) -> 読み込み完了
T("audio", load:"drum.wav").slice(0, 2000).on("ended", ->
  @pause()
).play() # 鳴らない

# この書き方だと鳴る (通常のプログラムの書き方)
T("audio").load("drum.wav").then ->
  @slice(0, 2000).on("ended", ->
    @pause()
  ).play()

# ライブコーディング時の書き方 (スコープを分離したくない場合)
# 下記のようにコードを分割して, 個々に実行する必要があります
a = T("audio", load:"drum.wav") # この行だけ先に実行する
a.slice(0, 2000).on("ended", ->
  @pause()
).play()


# テープエディット
a = T("audio", load:"drum.wav", loop:true)

# T("tape") はテープの切り貼りの要領でバッファを操作するオブジェクトです
tape  = T("tape", tape:a).tape
tapes = []
tapes = tapes.concat tape.split( 16).stutter(16)
tapes = tapes.concat tape.split(512).map (t)->t.loop(16)

# おおまかに切り取った素材と細かく切り取った素材をランダムに組み合わせる
tape1 = T("tape", loop:true).play()
tape1.tape = tape.join tapes.scramble().slice(0, 16)
# [Ctrl+.]

# 切り貼りリズムマシーン
bd = T("buffer", buffer:tapes[  0], bang:false)
sd = T("buffer", buffer:tapes[ 32], bang:false)
seq = [0...16].map (i)->
  T("buffer", buffer:tapes[256 + (Math.random() * 512)|0], bang:false)

pattern = "X.-.O.xo -.-.O.--".replace /\s+/g, ''
T("interval", interval:"bpm134 l16", (count)->
  switch pattern.charAt(count % pattern.length)
    when "X" then bd.set(mul:1.0).bang()
    when "x" then bd.set(mul:0.4).bang()
    when "O" then sd.set(mul:1.0).bang()
    when "o" then sd.set(mul:0.4).bang()  
    when "-" then seq.choose().bang()
).set(buddies:[bd, sd].concat seq).start()
# [Ctrl+.]



# 移動
(goto "index")
(goto "chapter02") # Definition of Synth
