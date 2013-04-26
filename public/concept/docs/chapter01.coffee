# chapter 01

(goto "index")

_.zip(pan=[-1,+1],freq=[2,3]).map ([ pan, freq ])->
  console.log pan, freq

a = stomp.SinOsc().play()
a = stomp.SinOsc(freq:880,mul:stomp.SinOsc(1)).play()

a = stomp.SinOsc(880).mul(stomp.SinOsc(1)).play()

a.pause()

(goto "index")

(reload true)
