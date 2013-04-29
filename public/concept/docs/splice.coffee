# splice test

a = T("audio", load:"amen.wav", loop:true)
b = T("lpf")
c = T("comp")
d = T("delay")

## case 0: T(a).splice(b, c, d)

# a -> d -> c
a.to(d).to(c).play()

# => a -> b -> c
a.splice(b, c, d)

## case 1: T(a).splice(b, c)

# a -> c
a.to(c).play()

# a -> b -> c
a.splice(b, c)
