# require

## timbre.define (name, [deps], payload)
モジュールを定義する.  
定義したモジュールは `require` されるまで評価されない. 評価されると `defined` 状態になる.
依存関係がある場合は, それらを `require` して `defined` になるまで評価を遅延する.

### 引数
- name
  - モジュールの名前 (階層化どうする？)
- [deps] 
  - 依存関係 (モジュールの名前, 階層化している場合は相対指定可能)
- payload
  - モジュールの中身, 関数なら実行する？

### 戻り値
timbre or promise(defined)

### 懸案
pass

## timbre.require (name)
モジュールを読み込む.  
モジュールが `define` されているときは, それを評価する.
`define` されていないときは, `loadScript` する.

### 引数
- name
  - モジュールの名前 (階層化どうする？)

### 戻り値
promise(defined)

### 懸案
- `loadScript` したファイルは `define` する必要がある
- していない場合, どうなる？

## モジュールの名前

- T-Objectはチルダをつける, 対応するファイルにはチルダなし
  - sin~ (sin.js)
  - perc~ (perc.js)
  - SinOsc~ (SinOsc.js)
- モジュールはチルダをつけない.
  - oscillator (oscillator.js)
  - fft (fft.js)
- T-Objectとモジュールの名前が重複するとき(?)

## モジュールファイルの設置場所
末尾のチルダは削除し、 `.js` を付けてファイル名とする.
パスと実際のモジュール名は紐付けされる.

- require("../sin") => ../sin.js
  - 相対パス
- require("/sin~")  => timbre/sin.js
  - timbre.js の設置位置からのパス
- require("http://timbre.org/modules/sin.js")
  - url指定
- node.js の場合はデフォルトの require を使う
