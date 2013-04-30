###

 timbre.js - the concept book

###

# timbre.js の使い方をライブコーディングの形式で説明するページです


# [Ctrl+Enter] でカーソル行のコードを実行できます
T("sin.ar", mul:0.5).play()

# [Ctrl+.] で再生を中断できます

# 複数行のコードを実行する場合は実行範囲を選択して [Ctrl+Enter] します
T("sin.ar"
  freq: T("param.kr", value:440).linTo(880, "2sec")
  mul : 0.5
).play()


# - 基本的に上から順番にコメントに挟まれている範囲のコードを選択して実行すれば動作します
# - まれに (見たらわかる感じで) 1行ずつ実行してほしい箇所もあります
# - なにかおかしい感じになったら [Ctrl+.] でリセットして再度試行してください
# - あきらかにバグだろっていう場合は @mohayonao まで連絡下さい


# timbre.js 以外のライブラリとして
#   subcollider.js を SuperCollider風のプロトタイプ拡張に使用しています
#   http://mohayonao.github.io/subcollider.js/



# 次章以降でいくつかのオブジェクトと使い方を説明していきます
(goto "chapter01") # Oscillator and Envelope
(goto "chapter02") # Definition of Synth
(goto "chapter03") # Audio Buffer

(goto "extra-examples-01") # demo
