(function() {
  $(function() {
    'use strict';
    var baseRoot, baseScale, bass, calcFrequency, changeRootFreq, changeScale, changeTuning, env, items, master, melo0, melo1, s, scales, sheet, synth, t, tunings, vue;
    melo0 = 't104 l16 q4 $\no6 eere rcer gr8. > gr8.<\no6 cr8>gr8er rarb rb-ar l12g<eg l16arfg rerc d>br8<\no6 cr8>gr8er rarb rb-ar l12g<eg l16arfg rerc d>br8<\no6 r8gg-fd#re r>g#a<c r>a<cd r8gg-fd#re < rcrc cr8.> r8gg-fd#re r>g#a<c r>a<cd r8e-r8dr8cr8.r4\no6 r8gg-fd#re r>g#a<c r>a<cd r8gg-fd#re < rcrc cr8.> r8gg-fd#re r>g#a<c r>a<cd r8e-r8dr8cr8.r4\no6 ccrc rcdr ecr>a gr8.< ccrc rcde r2 ccrc rcdr ecr>a gr8.<\no6 eere rcer gr8. > gr8.<\no6 cr8>gr8er rarb rb-ar l12g<eg l16arfg rerc d>br8<\no6 cr8>gr8er rarb rb-ar l12g<eg l16arfg rerc d>br8<\no6 ecr>g r8g#r a<frf> ar8. l12b<aa agf l16ecr>a gr8.< ecr>g r8g#r a<frf> ar8. l12b<ff fed l16c>grg cr8.<\no6 ecr>g r8g#r a<frf> ar8. l12b<aa agf l16ecr>a gr8.< ecr>g r8g#r a<frf> ar8. l12b<ff fed l16c>grg cr8.<\no6 ccrc rcdr ecr>a gr8.< ccrc rcde r2 ccrc rcdr ecr>a gr8.';
    sheet = [0, 1, 1, 2, 2, 3, 0, 1, 1, 4, 4, 3];
    melo1 = 't104 l16 q4 $\no5 f#f#rf# rf#f#r gr8. >gr8.\no5 er8cr8>gr <rcrd rd-cr l12cg<c l16cr>ab rgre fdr8\no5 er8cr8>gr <rcrd rd-cr l12cg<c l16cr>ab rgre fdr8\no6 r8ee-d>b<rc r>efa rfab< r8ee-d>b<rc rgrg gr8. r8ee-d>b<rc r>efa rfab< r8cr8>fr8er8.r4\no6 r8ee-d>b<rc r>efa rfab< r8ee-d>b<rc rgrg gr8. r8ee-d>b<rc r>efa rfab< r8cr8>fr8er8.r4\no5 a-a-ra- ra-b-r <c>grf er8. a-a-ra- ra-b-g r2 a-a-ra- ra-b-r <c>grf er8.\no5 f#f#rf# rf#f#r gr8. >gr8.\no5 er8cr8>gr <rcrd rd-cr l12cg<c l16cr>ab rgre fdr8\no5 er8cr8>gr <rcrd rd-cr l12cg<c l16cr>ab rgre fdr8\no6 c>gre r8er  f<drd> fr8. l12g<ff fed l16c>grf er8.< c>gre r8er  f<drd> fr8. l12g<dd dc>b l16er8.r4\no6 c>gre r8er  f<drd> fr8. l12g<ff fed l16c>grf er8.< c>gre r8er  f<drd> fr8. l12g<dd dc>b l16er8.r4\no5 a-a-ra- ra-b-r <c>grf er8. a-a-ra- ra-b-g r2 a-a-ra- ra-b-r <c>grf er8.';
    bass = 't104 l16 q4 $\no4 ddrd rddr <br8.>gr8.\no4 gr8er8cr rfrg rg-fr l12e<ce l16frde rcr>a bgr8\no4 gr8er8cr rfrg rg-fr l12e<ce l16frde rcr>a bgr8\no4 cr8gr8<cr >fr8<ccr>fr cr8er8g<c < rfrf fr >>gr cr8gr8<cr >fr8<ccr>fr> a-r<a-r> b-<b-r8> l16cr8>g grcr\no4 cr8gr8<cr >fr8<ccr>fr cr8er8g<c < rfrf fr >>gr cr8gr8<cr >fr8<ccr>fr> a-r<a-r> b-<b-r8> l16cr8>g grcr\no3 [a-r8<e-r8a-r gr8cr8>gr]3\no4 ddrd rddr <br8.>gr8.\no4 gr8er8cr rfrg rg-fr l12e<ce l16frde rcr>a bgr8\no4 gr8er8cr rfrg rg-fr l12e<ce l16frde rcr>a bgr8\no4 crre gr<cr> fr<cr cc>fr drrf grbr gr<cr cc>gr crre gr<cr> fr<cr cc>fr grrg l12gab l16 <cr>gr cr8.\no4 crre gr<cr> fr<cr cc>fr drrf grbr gr<cr cc>gr crre gr<cr> fr<cr cc>fr grrg l12gab l16 <cr>gr cr8.\no3 [a-r8<e-r8a-r gr8cr8>gr]3';
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
    if (location.hash) {
      items = location.hash.substr(1).split(',');
      s = items[0] || '';
      t = items[1] || '';
    }
    if (!scales.hasOwnProperty(s)) {
      s = 'major';
    }
    if (!tunings.hasOwnProperty(t)) {
      t = 'et12';
    }
    vue = new Vue({
      el: '#app',
      data: {
        isPlaying: false,
        scale: '',
        tuning: '',
        scales: Object.keys(scales).map(function(key) {
          return {
            key: key,
            name: scales[key].name
          };
        }),
        tunings: Object.keys(tunings).map(function(key) {
          return {
            key: key,
            name: tunings[key].name
          };
        })
      },
      methods: {
        random: function(type) {
          if (type === 'tuning') {
            return this.tuning = Object.keys(tunings).choose();
          } else {
            return this.scale = Object.keys(scales).choose();
          }
        },
        play: function() {
          this.isPlaying = !this.isPlaying;
          if (this.isPlaying) {
            master.play();
            melo0.start();
            melo1.start();
            return bass.start();
          } else {
            master.pause();
            melo0.stop();
            melo1.stop();
            return bass.stop();
          }
        },
        tweet: function() {
          var text, url;
          url = location.href;
          text = utils.lang({
            ja: "" + changeScale.name + " なマリオの曲",
            '': "Mario theme in " + changeScale.name + " mode"
          });
          return utils.tweet({
            text: text,
            url: url
          });
        }
      }
    });
    vue.$watch('scale', function(val) {
      window.location.replace("#" + this.scale + "," + this.tuning);
      changeScale = scales[val];
      return changeScale.tuning(changeTuning);
    });
    vue.$watch('tuning', function(val) {
      window.location.replace("#" + this.scale + "," + this.tuning);
      changeTuning = tunings[val];
      return changeScale.tuning(changeTuning);
    });
    changeScale = scales[s];
    changeTuning = tunings[t];
    vue.scale = s;
    vue.tuning = t;
    return 0;
  });

}).call(this);
