"use strict"

T = require "timbre"

bpm    = 90
env    = T("perc", r:500)
synth  = T("SynthDef", mul:0.45, poly:8)
master = T("delay", time:250, fb:0.45, synth).play()

synth.def = (opts)->
  op1 = T("sin", freq:opts.freq*11, mul:0.4)
  op2 = T("sin", freq:opts.freq, phase:op1, mul:opts.velocity/128)
  env.clone().append(op2).on("ended", opts.doneAction).bang()

mml0 = """o7
drdrdrc>b-< crrd>b-<cde- drc>b-<crdc rrdcrddr
drdrdrc>b-< crrdrrdd cr>b-grr<dd crdcr>b-rb-<
"""
mml1 = """o4
b-<fa0<d>f>b-<fb-0<d>f> a<eg0<c>e><da<c0f>a> b-<fa0<d>f>b-<fb-0<d>f> a<eg0<c>e><da<c0f>a>
b-<fa0<d>f>b-<fb-0<d>f> a<eg0<c>e><da<c0f>a> g<dg0b-d>g<df0b-d> <cg<c0e>gcgb-0<e>g>
"""

# T("mml", mml:"t#{bpm}l8$#{mml0}", synth).start()
# T("mml", mml:"t#{bpm}l8$#{mml1}", synth).start()

make = (mml, list=[])->
  re = /([orabcdefg><])(-?)(\d?)/g
  octave = index = 0
  while (m = re.exec mml)
    [ _, type, sign, num ] = m
    if type is "o"
      octave = +num
      continue
    else if type is "<"
      octave += 1
      continue
    else if type is ">"
      octave -= 1
      continue
      
    note = ({c:0,d:2,e:4,f:5,g:7,a:9,b:11}[type] + octave * 12)|0
    note -= 1 if sign is '-'
    if list[index]
      list[index].push note
    else
      list[index] = [note]
    index += 1 if num != '0'
  list 

list = []
make mml0, list
make mml1, list

console.log JSON.stringify(list)

T("interval", interval:"bpm#{bpm} l8", (count)->
  for num in list[count % list.length]
    if num != 0
      synth.noteOn num, 80
).start()
