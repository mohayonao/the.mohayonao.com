$ ->
  'use strict'

  MML_DATA = '''
  t104 l16 q4 $
  o6 eere rcer gr8. > gr8.<
  o6 cr8>gr8er rarb rb-ar l12g<eg l16arfg rerc d>br8<
  o6 cr8>gr8er rarb rb-ar l12g<eg l16arfg rerc d>br8<
  o6 r8gg-fd+re r>g+a<c r>a<cd r8gg-fd+re < rcrc cr8.> r8gg-fd+re r>g+a<c r>a<cd r8e-r8dr8cr8.r4
  o6 r8gg-fd+re r>g+a<c r>a<cd r8gg-fd+re < rcrc cr8.> r8gg-fd+re r>g+a<c r>a<cd r8e-r8dr8cr8.r4
  o6 ccrc rcdr ecr>a gr8.< ccrc rcde r2 ccrc rcdr ecr>a gr8.<
  o6 eere rcer gr8. > gr8.<
  o6 cr8>gr8er rarb rb-ar l12g<eg l16arfg rerc d>br8<
  o6 cr8>gr8er rarb rb-ar l12g<eg l16arfg rerc d>br8<
  o6 ecr>g r8g+r a<frf> ar8. l12b<aa agf l16ecr>a gr8.< ecr>g r8g+r a<frf> ar8. l12b<ff fed l16c>grg cr8.<
  o6 ecr>g r8g+r a<frf> ar8. l12b<aa agf l16ecr>a gr8.< ecr>g r8g+r a<frf> ar8. l12b<ff fed l16c>grg cr8.<
  o6 ccrc rcdr ecr>a gr8.< ccrc rcde r2 ccrc rcdr ecr>a gr8.;

  t104 l16 q4 $
  o5 f+f+rf+ rf+f+r gr8. >gr8.
  o5 er8cr8>gr <rcrd rd-cr l12cg<c l16cr>ab rgre fdr8
  o5 er8cr8>gr <rcrd rd-cr l12cg<c l16cr>ab rgre fdr8
  o6 r8ee-d>b<rc r>efa rfab< r8ee-d>b<rc rgrg gr8. r8ee-d>b<rc r>efa rfab< r8cr8>fr8er8.r4
  o6 r8ee-d>b<rc r>efa rfab< r8ee-d>b<rc rgrg gr8. r8ee-d>b<rc r>efa rfab< r8cr8>fr8er8.r4
  o5 a-a-ra- ra-b-r <c>grf er8. a-a-ra- ra-b-g r2 a-a-ra- ra-b-r <c>grf er8.
  o5 f+f+rf+ rf+f+r gr8. >gr8.
  o5 er8cr8>gr <rcrd rd-cr l12cg<c l16cr>ab rgre fdr8
  o5 er8cr8>gr <rcrd rd-cr l12cg<c l16cr>ab rgre fdr8
  o6 c>gre r8er  f<drd> fr8. l12g<ff fed l16c>grf er8.< c>gre r8er  f<drd> fr8. l12g<dd dc>b l16er8.r4
  o6 c>gre r8er  f<drd> fr8. l12g<ff fed l16c>grf er8.< c>gre r8er  f<drd> fr8. l12g<dd dc>b l16er8.r4
  o5 a-a-ra- ra-b-r <c>grf er8. a-a-ra- ra-b-g r2 a-a-ra- ra-b-r <c>grf er8.;

  t104 l16 q4 $
  o4 ddrd rddr <br8.>gr8.
  o4 gr8er8cr rfrg rg-fr l12e<ce l16frde rcr>a bgr8
  o4 gr8er8cr rfrg rg-fr l12e<ce l16frde rcr>a bgr8
  o4 cr8gr8<cr >fr8<ccr>fr cr8er8g<c < rfrf fr >>gr cr8gr8<cr >fr8<ccr>fr> a-r<a-r> b-<b-r8> l16cr8>g grcr
  o4 cr8gr8<cr >fr8<ccr>fr cr8er8g<c < rfrf fr >>gr cr8gr8<cr >fr8<ccr>fr> a-r<a-r> b-<b-r8> l16cr8>g grcr
  o3 /: a-r8<e-r8a-r gr8cr8>gr :/3
  o4 ddrd rddr <br8.>gr8.
  o4 gr8er8cr rfrg rg-fr l12e<ce l16frde rcr>a bgr8
  o4 gr8er8cr rfrg rg-fr l12e<ce l16frde rcr>a bgr8
  o4 crre gr<cr> fr<cr cc>fr drrf grbr gr<cr cc>gr crre gr<cr> fr<cr cc>fr grrg l12gab l16 <cr>gr cr8.
  o4 crre gr<cr> fr<cr cc>fr drrf grbr gr<cr cc>gr crre gr<cr> fr<cr cc>fr grrg l12gab l16 <cr>gr cr8.
  o3 /: a-r8<e-r8a-r gr8cr8>gr :/3
  '''

  app = new ScalableSequencer(MML_DATA)
  scales = ScalableSequencer.scales

  vue = new Vue
    el: '#app'

    data:
      isPlaying: false
      scale : ''
      scales: Object.keys(scales).map (key)-> key: key, name: scales[key].name

    methods:
      play: ->
        @isPlaying = not @isPlaying
        if @isPlaying
          app.start()
        else
          app.stop()

      random: (type)->
        @scale = Object.keys(scales).choose()

      tweet: ->
        scaleName = scales[@scale].name
        url = location.href
        text = utils.lang
          ja: "#{scaleName} なマリオの曲"
          '': "Mario theme in #{scaleName} mode"
        utils.tweet text:text, url:url

  vue.$watch 'scale', (val)->
    window.location.replace "##{@scale}"
    app.setScale val

  if location.hash
    items = location.hash.substr(1).split ','
    scale = items[0] or ''
  scale = 'major' if not scales.hasOwnProperty(scale)

  vue.scale = scale

  0
