(function() {
  $(function() {
    'use strict';
    var $scale, $tuning, baseRoot, baseScale, bass, calcFrequency, changeRootFreq, changeScale, changeTuning, env, master, melo0, melo1, scales, sheet, synth, tunings;

    melo0 = 't104 l16 q4 $\no6 eere rcer gr8. > gr8.<\no6 cr8>gr8er rarb rb-ar l12g<eg l16arfg rerc d>br8<\no6 cr8>gr8er rarb rb-ar l12g<eg l16arfg rerc d>br8<\no6 r8gg-fd#re r>g#a<c r>a<cd r8gg-fd#re < rcrc cr8.> r8gg-fd#re r>g#a<c r>a<cd r8e-r8dr8cr8.r4\no6 r8gg-fd#re r>g#a<c r>a<cd r8gg-fd#re < rcrc cr8.> r8gg-fd#re r>g#a<c r>a<cd r8e-r8dr8cr8.r4\no6 ccrc rcdr ecr>a gr8.< ccrc rcde r2 ccrc rcdr ecr>a gr8.<\no6 eere rcer gr8. > gr8.<\no6 cr8>gr8er rarb rb-ar l12g<eg l16arfg rerc d>br8<\no6 cr8>gr8er rarb rb-ar l12g<eg l16arfg rerc d>br8<\no6 ecr>g r8g#r a<frf> ar8. l12b<aa agf l16ecr>a gr8.< ecr>g r8g#r a<frf> ar8. l12b<ff fed l16c>grg cr8.<\no6 ecr>g r8g#r a<frf> ar8. l12b<aa agf l16ecr>a gr8.< ecr>g r8g#r a<frf> ar8. l12b<ff fed l16c>grg cr8.<\no6 ccrc rcdr ecr>a gr8.< ccrc rcde r2 ccrc rcdr ecr>a gr8.';
    sheet = [0, 1, 1, 2, 2, 3, 0, 1, 1, 4, 4, 3];
    melo1 = 't104 l16 q4 $\no5 f#f#rf# rf#f#r gr8. >gr8.\no5 er8cr8>gr <rcrd rd-cr l12cg<c l16cr>ab rgre fdr8\no5 er8cr8>gr <rcrd rd-cr l12cg<c l16cr>ab rgre fdr8\no6 r8ee-d>b<rc r>efa rfab< r8ee-d>b<rc rgrg gr8. r8ee-d>b<rc r>efa rfab< r8cr8>fr8er8.r4\no6 r8ee-d>b<rc r>efa rfab< r8ee-d>b<rc rgrg gr8. r8ee-d>b<rc r>efa rfab< r8cr8>fr8er8.r4\no5 a-a-ra- ra-b-r <c>grf er8. a-a-ra- ra-b-g r2 a-a-ra- ra-b-r <c>grf er8.\no5 f#f#rf# rf#f#r gr8. >gr8.\no5 er8cr8>gr <rcrd rd-cr l12cg<c l16cr>ab rgre fdr8\no5 er8cr8>gr <rcrd rd-cr l12cg<c l16cr>ab rgre fdr8\no6 c>gre r8er  f<drd> fr8. l12g<ff fed l16c>grf er8.< c>gre r8er  f<drd> fr8. l12g<dd dc>b l16er8.r4\no6 c>gre r8er  f<drd> fr8. l12g<ff fed l16c>grf er8.< c>gre r8er  f<drd> fr8. l12g<dd dc>b l16er8.r4\no5 a-a-ra- ra-b-r <c>grf er8. a-a-ra- ra-b-g r2 a-a-ra- ra-b-r <c>grf er8.';
    bass = 't104 l16 q4 $\no4 ddrd rddr <br8.>gr8.\no4 gr8er8cr rfrg rg-fr l12e<ce l16frde rcr>a bgr8\no4 gr8er8cr rfrg rg-fr l12e<ce l16frde rcr>a bgr8\no4 cr8gr8<cr >fr8<ccr>fr cr8er8g<c < rfrf fr >>gr cr8gr8<cr >fr8<ccr>fr> a-r<a-r> b-<b-r8> l16cr8>g grcr\no4 cr8gr8<cr >fr8<ccr>fr cr8er8g<c < rfrf fr >>gr cr8gr8<cr >fr8<ccr>fr> a-r<a-r> b-<b-r8> l16cr8>g grcr\no3 [a-r8<e-r8a-r gr8cr8>gr]3\no4 ddrd rddr <br8.>gr8.\no4 gr8er8cr rfrg rg-fr l12e<ce l16frde rcr>a bgr8\no4 gr8er8cr rfrg rg-fr l12e<ce l16frde rcr>a bgr8\no4 crre gr<cr> fr<cr cc>fr drrf grbr gr<cr cc>gr crre gr<cr> fr<cr cc>fr grrg l12gab l16 <cr>gr cr8.\no4 crre gr<cr> fr<cr cc>fr drrf grbr gr<cr cc>gr crre gr<cr> fr<cr cc>fr grrg l12gab l16 <cr>gr cr8.\no3 [a-r8<e-r8a-r gr8cr8>gr]3';
    sc.use('prototype');
    sc.Scale.prototype.degreeToFreq2 = function(degree, rootFreq, octave) {
      return this.degreeToRatio2(degree, octave) * rootFreq;
    };
    sc.Scale.prototype.degreeToRatio2 = function(degree, octave) {
      var _index;

      octave += (degree / this._degrees.length) | 0;
      _index = degree % this._degrees.length;
      return this.ratios().blendAt(_index) * Math.pow(this.octaveRatio(), octave);
    };
    if (!Array.prototype.blendAt) {
      Array.prototype.blendAt = function(index) {
        var i, x0, x1, _ref;

        i = Math.ceil(index) - 1;
        x0 = (_ref = this[i]) != null ? _ref : this[i + 1];
        x1 = this[i + 1];
        return x0 + Math.abs(index - i) * (x1 - x0);
      };
    }
    master = T('delay', {
      time: "bpm104 l16"
    });
    baseScale = sc.Scale.major();
    baseRoot = 60;
    changeTuning = sc.Tuning.et12();
    changeScale = sc.Scale.minor();
    changeRootFreq = baseRoot.midicps() * 0.5;
    calcFrequency = function(tnum) {
      var degree, key;

      key = tnum - baseRoot;
      degree = baseScale.performKeyToDegree(key);
      return changeScale.degreeToFreq2(degree, changeRootFreq, 0);
    };
    env = T('adsr', {
      d: 500,
      s: 0.8,
      r: 150
    });
    synth = T('OscGen', {
      wave: 'pulse',
      env: env
    });
    master.append(synth);
    melo0 = T('mml', {
      mml: melo0
    }).on('data', function(type, opts) {
      switch (type) {
        case 'noteOn':
          this.freq = calcFrequency(opts.noteNum);
          return synth.noteOnWithFreq(this.freq, 48);
        case 'noteOff':
          return synth.noteOffWithFreq(this.freq);
      }
    });
    melo1 = T('mml', {
      mml: melo1
    }).on('data', function(type, opts) {
      switch (type) {
        case 'noteOn':
          this.freq = calcFrequency(opts.noteNum);
          return synth.noteOnWithFreq(this.freq, 24);
        case 'noteOff':
          return synth.noteOffWithFreq(this.freq);
      }
    });
    bass = T('mml', {
      mml: bass
    }).on('data', function(type, opts) {
      switch (type) {
        case 'noteOn':
          this.freq = calcFrequency(opts.noteNum);
          return synth.noteOnWithFreq(this.freq, 24);
        case 'noteOff':
          return synth.noteOffWithFreq(this.freq);
      }
    });
    $('#play').on('click', function() {
      master.isPlaying = !master.isPlaying;
      if (master.isPlaying) {
        master.play();
        melo0.start();
        melo1.start();
        bass.start();
        return $(this).css({
          'color': 'red'
        });
      } else {
        master.pause();
        melo0.stop();
        melo1.stop();
        bass.stop();
        return $(this).css({
          'color': 'black'
        });
      }
    });
    scales = (function() {
      scales = {};
      sc.ScaleInfo.names().forEach(function(key) {
        var scale;

        scale = sc.ScaleInfo.at(key);
        if (scale.pitchesPerOctave() !== 12) {
          return;
        }
        return scales[key] = scale;
      });
      return scales;
    })();
    tunings = (function() {
      tunings = {};
      sc.TuningInfo.names().forEach(function(key) {
        var tuning;

        tuning = sc.TuningInfo.at(key);
        if (tuning.size() !== 12) {
          return;
        }
        return tunings[key] = tuning;
      });
      return tunings;
    })();
    $scale = $('#scale');
    $scale.on('change', function() {
      changeScale = scales[$(this).val()];
      return changeScale.tuning(changeTuning);
    });
    Object.keys(scales).forEach(function(key) {
      return $scale.append($("<option>").attr({
        value: key
      }).text(scales[key].name));
    });
    $('#random-scale').on('click', function() {
      return $scale.val(Object.keys(scales).choose()).change();
    });
    $tuning = $('#tuning');
    $tuning.on('change', function() {
      changeTuning = tunings[$(this).val()];
      return changeScale.tuning(changeTuning);
    });
    Object.keys(tunings).forEach(function(key) {
      return $tuning.append($("<option>").attr({
        value: key
      }).text(tunings[key].name));
    });
    $('#random-tuning').on('click', function() {
      return $tuning.val(Object.keys(tunings).choose()).change();
    });
    $scale.val('major').change();
    $tuning.val('et12').change();
    return 0;
  });

}).call(this);
