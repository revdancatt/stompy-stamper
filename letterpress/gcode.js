let stampUpHeight = 60
let stampDownHeight = 35
let stampInkHeight = 49
let flipXY = false

const setStampUpHeight = (height) => {
  stampUpHeight = height
}
export { setStampUpHeight }

const setStampDownHeight = (height) => {
  stampDownHeight = height
}
export { setStampDownHeight }

const setStampInkHeight = (height) => {
  stampInkHeight = height
}
export { setStampInkHeight }

const setFlipXY = (flip) => {
  flipXY = flip
}
export { setFlipXY }

const start = (paperSize, gcode) => {
  gcode = `( GCode File Generated with love on : ${new Date().toString()} )
( Target Machine: ArtFrame 2436 )
( Margins[LRTB]: 0, 0, 0, 0 )
( Paper Dimensions[WxH mm]: ${flipXY ? paperSize.height : paperSize.width}, ${flipXY ? paperSize.width : paperSize.height} )
( Install Height: 5.5)
( Scaling 1 )
( XY Offsets: 0, 0 )
( Rotation: 180)
( AccelX: 3000 )
( AccelY: 3000 )
G90\n`
  return gcode
}
export { start }

const installTool = (index, name, gcode) => {
  gcode += `G0 Z${stampUpHeight}
( Install Tool: ${index}. Layer: ${name} )
G0 X0 Y0
G0 Z${stampUpHeight}
M0
( CLEAR )
`
  return gcode
}
export { installTool }

const ink = (x, y, gcode) => {
  gcode += `( ink )
G0 Z${stampUpHeight}
G0 X${x} Y${y}
G0 Z${stampInkHeight}
G0 Z${stampUpHeight}
`
  return gcode
}
export { ink }

const stamp = (x, y, gcode) => {
  gcode += `( stamp )
G0 Z${stampUpHeight}
G0 X${x} Y${y}
G0 Z${stampDownHeight}
G0 Z${stampUpHeight}
`
  return gcode
}
export { stamp }

const end = (gcode) => {
  gcode += `( end )
G0 Z${stampUpHeight}
G0 X0 Y0
M5
M2
`
  return gcode
}
export { end }
