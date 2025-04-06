import fs from 'fs'
import path from 'path'
import { Canvas } from 'skia-canvas'

// Perlin noise function adapted from p5.js implementation
const PERLIN_YWRAPB = 4
const PERLIN_YWRAP = 1 << PERLIN_YWRAPB
const PERLIN_ZWRAPB = 8
const PERLIN_ZWRAP = 1 << PERLIN_ZWRAPB
const PERLIN_SIZE = 4095

const perlinOctaves = 4
const perlinAmpFalloff = 0.5

const scaledCosine = i => 0.5 * (1.0 - Math.cos(i * Math.PI))

let perlin = null

const noise = (x, y = 0, z = 0) => {
  if (perlin == null) {
    perlin = new Array(PERLIN_SIZE + 1)
    for (let i = 0; i < PERLIN_SIZE + 1; i++) {
      perlin[i] = Math.random()
    }
  }

  if (x < 0) x = -x
  if (y < 0) y = -y
  if (z < 0) z = -z

  let xi = Math.floor(x)
  let yi = Math.floor(y)
  let zi = Math.floor(z)
  let xf = x - xi
  let yf = y - yi
  let zf = z - zi
  let rxf, ryf

  let r = 0
  let ampl = 0.5

  let n1, n2, n3

  for (let o = 0; o < perlinOctaves; o++) {
    let of = xi + (yi << PERLIN_YWRAPB) + (zi << PERLIN_ZWRAPB)

    rxf = scaledCosine(xf)
    ryf = scaledCosine(yf)

    n1 = perlin[of & PERLIN_SIZE]
    n1 += rxf * (perlin[(of + 1) & PERLIN_SIZE] - n1)
    n2 = perlin[(of + PERLIN_YWRAP) & PERLIN_SIZE]
    n2 += rxf * (perlin[(of + PERLIN_YWRAP + 1) & PERLIN_SIZE] - n2)
    n1 += ryf * (n2 - n1)

    of += PERLIN_ZWRAP
    n2 = perlin[of & PERLIN_SIZE]
    n2 += rxf * (perlin[(of + 1) & PERLIN_SIZE] - n2)
    n3 = perlin[(of + PERLIN_YWRAP) & PERLIN_SIZE]
    n3 += rxf * (perlin[(of + PERLIN_YWRAP + 1) & PERLIN_SIZE] - n3)
    n2 += ryf * (n3 - n2)

    n1 += scaledCosine(zf) * (n2 - n1)

    r += n1 * ampl
    ampl *= perlinAmpFalloff
    xi <<= 1
    xf *= 2
    yi <<= 1
    yf *= 2
    zi <<= 1
    zf *= 2

    if (xf >= 1.0) {
      xi++
      xf--
    }
    if (yf >= 1.0) {
      yi++
      yf--
    }
    if (zf >= 1.0) {
      zi++
      zf--
    }
  }
  return r
}

const __dirname = path.dirname(new URL(import.meta.url).pathname)
const outputDir = path.join(__dirname, 'output')
// Create the output directory if it doesn't exist
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir)

// Set the width and height of the paper
const sizeMod = 10
const width = 760 * sizeMod
const height = 570 * sizeMod
const border = 30 * sizeMod

// ink position
const inkPosition = {
  left: 802,
  right: 876,
  top: 290,
  bottom: 250
}

const stampUpHeight = 60
const stampDownHeight = 14
const stampInkHeight = 26

// Set the size of the stamp
const stampSize = 10 * sizeMod

const canvas = new Canvas(width, height)
const ctx = canvas.getContext('2d')

// Work out how many stamps we can fit in the width and height, and then
// adjust the border so the stamps fit well
const stampsPerRow = Math.floor((width - border * 2) / stampSize)
const stampsPerColumn = Math.floor((height - border * 2) / stampSize)

console.log(stampsPerRow, stampsPerColumn)
const sideBorder = (width - (stampsPerRow * stampSize)) / 2
const topBorder = (height - (stampsPerColumn * stampSize)) / 2

// Fill the canvas with a white background
ctx.fillStyle = 'white'
ctx.fillRect(0, 0, width, height)

// Draw the border in a thin black line
ctx.strokeStyle = 'black'
ctx.lineWidth = 1
ctx.strokeRect(sideBorder, topBorder, width - sideBorder * 2, height - topBorder * 2)

const directions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24]
const directionsMap = {}

const xOffset = Math.random() * 500 + 100
const yOffset = Math.random() * 500 + 100
const mapScape = Math.random() * 1.5 + 1
// const mapScape = 2
const rotRandom = Math.random() * 360
// Draw the stamps
ctx.fillStyle = '#999'

let minNoise = 1000
let maxNoise = -1000
for (let i = 0; i < stampsPerRow; i++) {
  for (let j = 0; j < stampsPerColumn; j++) {
    const noiseValue = noise((i * 0.074 * mapScape + xOffset), (j * 0.117 * mapScape + yOffset))
    if (noiseValue < minNoise) minNoise = noiseValue
    if (noiseValue > maxNoise) maxNoise = noiseValue
  }
}

const noiseRange = maxNoise - minNoise

for (let i = 0; i < stampsPerRow; i++) {
  for (let j = 0; j < stampsPerColumn; j++) {
    ctx.save()
    const x = sideBorder + (i * stampSize) + stampSize / 2
    const y = topBorder + (j * stampSize) + stampSize / 2
    ctx.translate(x, y)
    // Scale everything down to 90%
    ctx.scale(0.666, 0.666)

    // Get the angle of the gradient of a sine wave at this x value
    let angle1 = (noise((i * 0.074 * mapScape + xOffset), (j * 0.117 * mapScape + yOffset)) - minNoise) / noiseRange * 360 + rotRandom
    while (angle1 < 0) angle1 += 360
    while (angle1 > 360) angle1 -= 360

    // Calculate direction index based on angle and number of directions
    const sectorSize = 360 / directions.length
    const halfSector = sectorSize / 2

    // Handle the special case for the sector that crosses 0°/360°
    let directionIndex = 0
    if (angle1 >= 360 - halfSector || angle1 < halfSector) {
      directionIndex = 0
    } else {
      // For all other sectors
      directionIndex = Math.floor((angle1 + halfSector) / sectorSize) % directions.length
    }

    // Round the angle to the nearest sector center
    const angle45 = directionIndex * (360 / directions.length)

    const thisDirection = directions[directionIndex]
    if (directionsMap[thisDirection] == null) {
      directionsMap[thisDirection] = []
    }
    directionsMap[thisDirection].push({
      x,
      y
    })

    // Rotate the arrow by the angle
    ctx.rotate(angle45 * Math.PI / 180)

    // Draw an arrow pointing up
    ctx.beginPath()
    ctx.moveTo(0, -stampSize / 2)
    ctx.lineTo(-stampSize / 2 * 0.8, stampSize / 2)
    ctx.lineTo(stampSize / 2 * 0.8, stampSize / 2)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()
    ctx.restore()
  }
}

const outJPG = await canvas.toBuffer('jpeg', {
  quality: 0.7
})

fs.writeFileSync(path.join(outputDir, 'field5-stamp.jpg'), outJPG)

inkPosition.inkRange = {
  left: inkPosition.left + stampSize / sizeMod * 0.75,
  right: inkPosition.right - stampSize / sizeMod * 0.75,
  top: inkPosition.top - stampSize / sizeMod * 0.75,
  bottom: inkPosition.bottom + stampSize / sizeMod * 0.75
}

const installTool = (index, name) => {
  gcode += `G0 Z${stampUpHeight}
( Install Tool: ${index}. Layer: ${name} )
G0 X0 Y0
G0 Z${stampUpHeight}
M0
( CLEAR )
`
}

const ink = (x, y) => {
  gcode += `( ink )
G0 Z${stampUpHeight}
G0 X${x} Y${y}
G0 Z${stampInkHeight}
G0 Z${stampUpHeight}
`
}

const stampy = (x, y) => {
  gcode += `( stamp )
G0 Z${stampUpHeight}
G0 X${x} Y${y}
G0 Z${stampDownHeight}
G0 Z${stampUpHeight}
`
}

const end = () => {
  gcode += `( end )
G0 Z${stampUpHeight}
G0 X0 Y0
M5
M2
`
}

// Start constructing the GCODE
let gcode = `( GCode File Generated with love on : ${new Date().toString()} )
( Target Machine: ArtFrame 2436 )
( Margins[LRTB]: 0, 0, 0, 0 )
( Paper Dimensions[WxH mm]: ${width}, ${height} )
( Install Height: 5.5)
( Scaling 1 )
( XY Offsets: 0, 0 )
( Rotation: 180)
( AccelX: 3000 )
( AccelY: 3000 )
G90\n`

let index = 0
for (const direction in directionsMap) {
  installTool(index, directions[index])
  let shallWeInk = true

  for (const stamp of directionsMap[direction]) {
    const inkX = inkPosition.inkRange.left + Math.random() * (inkPosition.inkRange.right - inkPosition.inkRange.left)
    const inkY = inkPosition.inkRange.bottom + Math.random() * (inkPosition.inkRange.top - inkPosition.inkRange.bottom)

    if (shallWeInk) ink(inkX, inkY)
    stampy(stamp.x / sizeMod, stamp.y / sizeMod)
    shallWeInk = !shallWeInk
  }

  index++
}

end()

fs.writeFileSync(path.join(outputDir, 'field5-stamp.gcode'), gcode)
