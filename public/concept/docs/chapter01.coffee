###

 timbre.js - the concept book
 Chapter 01 - Oscillator and Envelope

###


# timbre.js のオブジェクトは以下の記述で生成します
#   T(name, opts, inputs)
# 
#   name   文字列でオブジェクトの名前を指定します
#   opts   辞書型でプロパティを指定します
#   inputs そのオブジェクトへの入力を指定します


# サイン波を生成して .play() で再生します
a = T("sin").play()

# 周波数の変更
a.freq = 493.88
a.freq = 554.36
a.freq *= Math.pow(2, 1/12) # 半音上げる

# 出力値に 0.5 を積算する (音量の調整)
a.mul = 0.5

# 出力値に 1.0 を加算する
# .mul と .add は出力値を調整する全てのオブジェクトなプロパティです
a.add = 1.0
a.add = 0

# 周波数にはオブジェクトも代入できます
a.freq = T("sin.kr", freq:5, mul:20, add:880)
a.freq = T("param", value:880).expTo 220, "1.5sec"

# .mul と .add にはオブジェクトは代入できません (数値のみ可)
a.mul = T("sin.kr") # 無視される

# .pause() で停止します
a.pause()


# エンベロープと組み合わせることで音量の調整ができます
# 以下の例ではパルス波と減衰するエンベロープを積算して減衰するパルス波を作ります
a = T("*"
  T("pulse", freq:660, mul:0.25)
  T("perc", r:1000).bang()
).play()

# .pause() で停止します
a.pause()

# エンベロープオブジェクトは入力があると積算した結果を出力します
# 以下の例は T("*") を使わない書き方です
a = T("perc", {r:1000}, T("pulse", freq:660, mul:0.25)).bang().play()

# エンベロープは .bang() のたびに起動します
a.bang()

# .pause() で停止します
a.pause()

# こういう書きかたもできます
# .to は引数のオブジェクトに呼び出し元オブジェクトを入力します
a = T("pulse", freq:660, mul:0.25).to("perc", r:1000).bang().play()

# .to は引数のオブジェクトを返すので、この場合はエンベロープとして動作します
a.bang()

# .pause() で停止します
a.pause()

# 自動的に停止させる場合は ended イベントを使います
a = T("pulse", freq:660, mul:0.25).to("perc", r:1000).on("ended", ->
  @pause()
).bang().play()


# 加算合成
a = T("+"
  T("sin", freq:880, mul:0.5)
  T("sin", freq:890, mul:0.5)
).to("perc", r:5000).bang().on("ended", ->
  @pause()
).play()

# オブジェクトに複数のオブジェクトを入力すると加算してから処理します
# 以下の例は T("+") を使わない書き方です
T("perc", r:5000,
  T("sin", freq:880, mul:0.5)
  T("sin", freq:890 , mul:0.5)
).on("ended", ->
  @pause()
).bang().play()


# 減算合成
T("lpf"
  cutoff: T("param", value:200).linTo(6400, "4sec"), Q:5
  T("saw", freq:880, mul:0.25)
  T("saw", freq:890, mul:0.25)
).to("perc", r:5000).on("ended", ->
  @pause()
).bang().play()
  
# オシレーターオブジェクトもエンベロープと同じように入力があると積算した結果を出力します
# 波形の名前の前に + をつけると 0 ~ +1 の範囲の値を出力します
a = T("sin", freq:880).to("+tri.kr", freq:12).play()

# .pause() で停止します
a.pause()


# FM合成
do ->
  mod = T("sin", freq:440*7, fb:0.2)
  car = T("sin", freq:440, phase:mod, mul:0.25)
  car.to("perc", r:"1sec").on("ended", ->
    @pause()
  ).bang().play()


# オブジェクト名の末尾に .ar や .kr をつけると
# それぞれオーディオレート, コントロールレートのオブジェクトが生成されます
# 省略した場合はオブジェクトごとのデフォルトレートが設定されます
do ->
  mod = T("sin", freq:220, mul:4)
  mod = mod.to("adshr.ar", a:50, d:250, s:0.9, h:10, r:1000).bang()
  car = T("sin", freq:440, phase:mod, mul:0.25)
  car = car.to("adshr", a:0, d:500, s:0.5, h:1000, r:2000).on("ended", ->
    @pause()
  )
  car.bang().play()



# 移動
(goto "index")
(goto "chapter02") # Definition of Synth
