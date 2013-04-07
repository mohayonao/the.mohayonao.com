window.demo = demo = []

# Looping test cases
if false
  # AB CDEF CDEF G
  demo.push 'AB |: CDEF :| G'

  # ABCDEF ABCDEF G
  demo.push 'ABCDEF :| G'

  # AB CDE CDE FG FG  
  demo.push 'AB |: CDE :||: FG :|'
  
  # AB CDE CFG
  demo.push 'AB |: C 1-DE :| 2-FG'

  # A BCD BEF BG
  demo.push 'A |: B 1-CD :| 2-EF :| 3-G'

  # A BC BD BE FG
  demo.push 'A |: B 1-C:| 2-D:| 3-E:| FG'

  # ABCDEFG ABCD
  demo.push 'ABCD^ EFG<'

  # ABCDEFG CDE
  demo.push 'AB $CDE^ FG<'

  # ABCDEF CDG
  demo.push 'AB $CD *EF < *G'

  # AB CDE CDE FG AB CDE
  demo.push 'AB |: CDE^ :| FG <'

demo.push '''
' Ob-La-Di, Ob-La-Da
$|: !120:3DuDu
 F= C7= C7= F=;
_F= Bb= FC7 F=;
_!DuDu,DuD,U-uD,U-uD,U-uDu,DuDu,DuDu,DuDu
 F= Am Dm F C7 F=;
_F= Am Dm F C7 *F= :|;
_!DuDu Bb=== !Dd-d F Eb Dm C7;
_!DuDu Bb=== F= !xudu,DdDd C7= <;
_*!DuDu F= Dm= F= !P--- F;
'''  

demo.push '''
!200
!DuDuxDxD,xDxDDuDu,DuDuxDxD,DuDuDuD-,_DuDuxDxD,xDxDDuDu,DuDuxDxD,DuDuDuD-
F = = = _ E7 = Am C;
!D-D-DuD-,=,=,D-uD-uDx,D-D-DuD-,=,D-D-DuDu,D-uD-uD-
F G7 C C7 _ F G7 Em7 Am;
F G7 C C7 _ F G7 Em7 !DxDxDxX- Am;
|: !P-------,=,D-D-DuD-,D-D-DuDu
Dm Em7 E7 Am _
!D-D-DuD-,D-D-DuD-,D-D-DuDu,D-uD-uD-
Dm Em7 G Am;
_!D-D-DuD-
Dm Em7 E7 Am _ Dm Em7 !DuDxDuD- G !DxDxDuDX Am;
$_ !D-D-DuD-,D-D-DuD-,D-D-DuDu,D-uD-uDX,_D-D-DuD-,D-D-DuD-,D-D-DuDu,D-uD-uD-
F G7 C C7 _ F G7 Em7 Am;
_F G7 C C7 _ F G7 * Em7 Am :|;
!D-D-DuD-,=,=,D-uD-uDX,_D-D-DuD-,=,D-D-DuDu,D-uD-uD-
F G7 C C7 _ F G7 Em7 Am;
F G7 C C7 _ F G7 !D-xxxxxx C !DxDxDXDX C <;
*_ !D-D-DuDu,DuDuDuD- Em7 Am;
!DuDuxDxD,xDxDDuDu,DuDuxDxD,DuDuDuDu,_DuDuxDxD,xDxDDuDu,DuDuxDxD,DuDuDuD-
F = = = _ E7 = Am C;
!D-X-X-X- D7 !Dx,Dx,P----------- Em7 C Am ^
'''
