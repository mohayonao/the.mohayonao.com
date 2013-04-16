'use strict'

fs   = require 'fs'
path = require 'path'
opts = require 'opts'
im   = require 'imagemagick'

opts.parse [
  short:'w', long:'width', description:'image width', value:true
]

main = (srcDir, width)->
  if not srcDir
    return
  
  srcDir = path.normalize "#{__dirname}/#{srcDir}"
  srcDir = srcDir.replace /\/$/, ''
  dstDir = "#{srcDir}-thumb"
  fs.mkdirSync dstDir unless fs.existsSync dstDir
    
  list = fs.readdirSync(srcDir).filter (x)-> /\.(png|jpg|gif)$/.test x
  list.sort()

  process = ->
    name = list.shift()
    if not name?
      return

    srcPath = path.normalize "#{srcDir}/#{name}"
    dstPath = path.normalize "#{dstDir}/#{name}"
      
    im.resize
      srcPath: srcPath
      dstPath: dstPath
      width: width
      (err, stdout, stderr)->
        console.log err
        throw err if err
        src = (fs.readFileSync srcPath).length
        dst = (fs.readFileSync dstPath).length
        rate = (dst / src * 100).toFixed 2
        src  = (src * 0.001).toFixed 1
        dst  = (dst * 0.001).toFixed 1
        console.log "#{name}: #{src}kb => #{dst}kb (#{rate}%)"
        do process

  do process

main opts.args()[0], opts.get('width') ? 128
