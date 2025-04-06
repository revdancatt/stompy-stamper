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
const width = 297 * sizeMod
const height = 210 * sizeMod
const border = 20 * sizeMod

// Set the size of the stamp
const stampSize = 8 * sizeMod

const canvas = new Canvas(width, height)
const ctx = canvas.getContext('2d')

// Work out how many stamps we can fit in the width and height, and then
// adjust the border so the stamps fit well
const stampsPerRow = Math.floor((width - border * 2) / stampSize)
const stampsPerColumn = Math.floor((height - border * 2) / stampSize)

const sideBorder = (width - (stampsPerRow * stampSize)) / 2
const topBorder = (height - (stampsPerColumn * stampSize)) / 2

// Fill the canvas with a white background
ctx.fillStyle = 'white'
ctx.fillRect(0, 0, width, height)

// Draw the border in a thin black line
ctx.strokeStyle = 'black'
ctx.lineWidth = 1
ctx.strokeRect(sideBorder, topBorder, width - sideBorder * 2, height - topBorder * 2)

// Draw the stamps
ctx.fillStyle = '#999'
for (let i = 0; i < stampsPerRow; i++) {
  for (let j = 0; j < stampsPerColumn; j++) {
    ctx.save()
    ctx.translate(sideBorder + (i * stampSize) + stampSize / 2, topBorder + (j * stampSize) + stampSize / 2)
    // Scale everything down to 90%
    ctx.scale(0.666, 0.666)

    // Get the angle of the gradient of a sine wave at this x value
    const angle1 = noise(i * 0.074, j * 0.117) * 360
    // Rotate the arrow by the angle
    ctx.rotate(angle1 * Math.PI / 180)

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

fs.writeFileSync(path.join(outputDir, 'field4.jpg'), outJPG)
