$ ->
  'use strict'

  melo0 = '''t104 l16 q4 $
  o6 eere rcer gr8. > gr8.<
  o6 cr8>gr8er rarb rb-ar l12g<eg l16arfg rerc d>br8<
  o6 cr8>gr8er rarb rb-ar l12g<eg l16arfg rerc d>br8<
  o6 r8gg-fd#re r>g#a<c r>a<cd r8gg-fd#re < rcrc cr8.> r8gg-fd#re r>g#a<c r>a<cd r8e-r8dr8cr8.r4
  o6 r8gg-fd#re r>g#a<c r>a<cd r8gg-fd#re < rcrc cr8.> r8gg-fd#re r>g#a<c r>a<cd r8e-r8dr8cr8.r4
  o6 ccrc rcdr ecr>a gr8.< ccrc rcde r2 ccrc rcdr ecr>a gr8.<
  o6 eere rcer gr8. > gr8.<
  o6 cr8>gr8er rarb rb-ar l12g<eg l16arfg rerc d>br8<
  o6 cr8>gr8er rarb rb-ar l12g<eg l16arfg rerc d>br8<
  o6 ecr>g r8g#r a<frf> ar8. l12b<aa agf l16ecr>a gr8.< ecr>g r8g#r a<frf> ar8. l12b<ff fed l16c>grg cr8.<
  o6 ecr>g r8g#r a<frf> ar8. l12b<aa agf l16ecr>a gr8.< ecr>g r8g#r a<frf> ar8. l12b<ff fed l16c>grg cr8.<
  o6 ccrc rcdr ecr>a gr8.< ccrc rcde r2 ccrc rcdr ecr>a gr8.
  '''

  sheet = [0, 1, 1, 2, 2, 3, 0, 1, 1, 4, 4, 3]

  melo1 = '''t104 l16 q4 $
  o5 f#f#rf# rf#f#r gr8. >gr8.
  o5 er8cr8>gr <rcrd rd-cr l12cg<c l16cr>ab rgre fdr8
  o5 er8cr8>gr <rcrd rd-cr l12cg<c l16cr>ab rgre fdr8
  o6 r8ee-d>b<rc r>efa rfab< r8ee-d>b<rc rgrg gr8. r8ee-d>b<rc r>efa rfab< r8cr8>fr8er8.r4
  o6 r8ee-d>b<rc r>efa rfab< r8ee-d>b<rc rgrg gr8. r8ee-d>b<rc r>efa rfab< r8cr8>fr8er8.r4
  o5 a-a-ra- ra-b-r <c>grf er8. a-a-ra- ra-b-g r2 a-a-ra- ra-b-r <c>grf er8.
  o5 f#f#rf# rf#f#r gr8. >gr8.
  o5 er8cr8>gr <rcrd rd-cr l12cg<c l16cr>ab rgre fdr8
  o5 er8cr8>gr <rcrd rd-cr l12cg<c l16cr>ab rgre fdr8
  o6 c>gre r8er  f<drd> fr8. l12g<ff fed l16c>grf er8.< c>gre r8er  f<drd> fr8. l12g<dd dc>b l16er8.r4
  o6 c>gre r8er  f<drd> fr8. l12g<ff fed l16c>grf er8.< c>gre r8er  f<drd> fr8. l12g<dd dc>b l16er8.r4
  o5 a-a-ra- ra-b-r <c>grf er8. a-a-ra- ra-b-g r2 a-a-ra- ra-b-r <c>grf er8.
  '''

  bass = '''t104 l16 q4 $
  o4 ddrd rddr <br8.>gr8.
  o4 gr8er8cr rfrg rg-fr l12e<ce l16frde rcr>a bgr8
  o4 gr8er8cr rfrg rg-fr l12e<ce l16frde rcr>a bgr8
  o4 cr8gr8<cr >fr8<ccr>fr cr8er8g<c < rfrf fr >>gr cr8gr8<cr >fr8<ccr>fr> a-r<a-r> b-<b-r8> l16cr8>g grcr
  o4 cr8gr8<cr >fr8<ccr>fr cr8er8g<c < rfrf fr >>gr cr8gr8<cr >fr8<ccr>fr> a-r<a-r> b-<b-r8> l16cr8>g grcr
  o3 [a-r8<e-r8a-r gr8cr8>gr]3
  o4 ddrd rddr <br8.>gr8.
  o4 gr8er8cr rfrg rg-fr l12e<ce l16frde rcr>a bgr8
  o4 gr8er8cr rfrg rg-fr l12e<ce l16frde rcr>a bgr8
  o4 crre gr<cr> fr<cr cc>fr drrf grbr gr<cr cc>gr crre gr<cr> fr<cr cc>fr grrg l12gab l16 <cr>gr cr8.
  o4 crre gr<cr> fr<cr cc>fr drrf grbr gr<cr cc>gr crre gr<cr> fr<cr cc>fr grrg l12gab l16 <cr>gr cr8.
  o3 [a-r8<e-r8a-r gr8cr8>gr]3
  '''

  master = T('delay', {time:"bpm104 l16"})
  baseScale = sc.Scale.major()
  baseRoot  = 60 # C3
  changeTuning   = sc.Tuning.et12()
  changeScale    = sc.Scale.minor()
  changeRootFreq = baseRoot.midicps() * 0.5

  calcFrequency = (tnum)->
    key    = tnum - baseRoot
    degree = baseScale.performKeyToDegree key
    changeScale.degreeToFreq2 degree, changeRootFreq, 0

  env = T('adsr', {d:500, s:0.8, r:150})
  synth = T('OscGen', {wave:'pulse', env:env})
  master.append synth

  melo0 = T('mml', {mml:melo0}).on 'data', (type, opts)->
    switch type
      when 'noteOn'
        @freq = calcFrequency opts.noteNum
        synth.noteOnWithFreq @freq, 48
      when 'noteOff'
        synth.noteOffWithFreq @freq

  melo1 = T('mml', {mml:melo1}).on 'data', (type, opts)->
    switch type
      when 'noteOn'
        @freq = calcFrequency opts.noteNum
        synth.noteOnWithFreq @freq, 24
      when 'noteOff'
        synth.noteOffWithFreq @freq

  bass = T('mml', {mml:bass}).on 'data', (type, opts)->
    switch type
      when 'noteOn'
        @freq = calcFrequency opts.noteNum
        synth.noteOnWithFreq @freq, 24
      when 'noteOff'
        synth.noteOffWithFreq @freq

  # UI
  $('#play').on 'click', ->
    master.isPlaying = not master.isPlaying
    if master.isPlaying
      master.play()
      melo0.start()
      melo1.start()
      bass.start()
      $(this).css 'color': 'red'
    else
      master.pause()
      melo0.stop()
      melo1.stop()
      bass.stop()
      $(this).css 'color': 'black'

  $('#tweet').on 'click', ->
    url  = "http://#{location.host}/scalable-mario/"
    url += "?" + utils.param(s:$scale.val(),t:$tuning.val())
    text = "#{changeScale.name} なマリオの曲"
    utils.tweet text:text, url:url

  scales = do ->
    scales = {}
    sc.ScaleInfo.names().forEach (key)->
      scale = sc.ScaleInfo.at key
      return unless scale.pitchesPerOctave() is 12
      scales[key] = scale
    scales

  tunings = do ->
    tunings = {}
    sc.TuningInfo.names().forEach (key)->
      tuning = sc.TuningInfo.at key
      return unless tuning.size() is 12
      tunings[key] = tuning
    tunings

  $scale = $('#scale')
  $scale.on 'change', ->
    changeScale = scales[$(this).val()]
    changeScale.tuning changeTuning
  Object.keys(scales).forEach (key)->
    $scale.append $("<option>").attr({value:key}).text(scales[key].name)
  $('#random-scale').on 'click', ->
    $scale.val( Object.keys(scales).choose() ).change()

  $tuning = $('#tuning')
  $tuning.on 'change', ->
    changeTuning = tunings[$(this).val()]
    changeScale.tuning changeTuning
  Object.keys(tunings).forEach (key)->
    $tuning.append $("<option>").attr({value:key}).text(tunings[key].name)
  $('#random-tuning').on 'click', ->
    $tuning.val( Object.keys(tunings).choose() ).change()

  if (q = location.search.substr(1))
    params = utils.deparam q
    s = params.s
    t = params.t
  else
    s = 'major'
    t = 'et12'

  $scale.val(s).change()
  $tuning.val(t).change()

  0
