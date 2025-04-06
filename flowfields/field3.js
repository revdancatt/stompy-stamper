import fs from 'fs'
import path from 'path'
import { Canvas } from 'skia-canvas'

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
const stampSize = 10 * sizeMod

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
ctx.fillStyle = 'black'
for (let i = 0; i < stampsPerRow; i++) {
  for (let j = 0; j < stampsPerColumn; j++) {
    ctx.save()
    ctx.translate(sideBorder + (i * stampSize) + stampSize / 2, topBorder + (j * stampSize) + stampSize / 2)
    // Scale everything down to 90%
    ctx.scale(0.666, 0.666)

    // Get the angle of the gradient of a sine wave at this x value
    const angle1 = Math.sin(i * 0.15) * 180
    const angle2 = Math.sin(j * 0.15) * 180
    // Rotate the arrow by the angle
    ctx.rotate((angle1 + angle2) * Math.PI / 180)

    // Draw an arrow pointing up
    ctx.beginPath()
    ctx.moveTo(0, -stampSize / 2)
    ctx.lineTo(-stampSize / 2 * 0.8, stampSize / 2)
    ctx.lineTo(stampSize / 2 * 0.8, stampSize / 2)
    ctx.closePath()
    ctx.stroke()
    ctx.fill()
    ctx.restore()
  }
}

const outJPG = await canvas.toBuffer('jpeg', {
  quality: 0.7
})

fs.writeFileSync(path.join(outputDir, 'field3.jpg'), outJPG)
