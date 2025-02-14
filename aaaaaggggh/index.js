import fs from 'fs'
import path from 'path'

import { Canvas } from 'skia-canvas'

// Get the current directory of this file
const __dirname = path.dirname(new URL(import.meta.url).pathname)
const outputDir = path.join(__dirname, 'output')
// Create the output directory if it doesn't exist
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir)

// Set the width and height of the paper
const width = 297
const height = 210

// Set the size of the stamp
const stampSize = 20
const lineHeight = stampSize * 0.9
const stampOffset = stampSize * 0.4

// We are going to hold an array of the stamps, lines at a time
let stamps = []

// Now we want the borders
const borders = {
  top: 20,
  bottom: 20,
  left: 20,
  right: 20
}

const inkPosition = {
  left: 315,
  right: 390,
  top: 54,
  bottom: 6
}

const stampUpHeight = 60
const stampDownHeight = 18
const stampInkHeight = 32

// Now we are going to have a couple of loops so we can move the stamps through the space, and add them to the array
let currentX = borders.left + (stampSize / 2)
let currentY = borders.top + (stampSize / 2)

const bottomEdge = height - (borders.bottom + (stampSize / 2))
const rightEdge = width - (borders.right + (stampSize / 2))

const waveOneOffset = Math.random() * 1000 + 1000
const waveTwoOffset = Math.random() * 1000 + 1000

let counter = Math.floor(Math.random() * 1000) + 1000
while (currentY < bottomEdge) {
  const thisLine = []

  while (currentX < rightEdge) {
    thisLine.push({
      letter: 'A',
      x: currentX,
      y: currentY
    })

    const waveOne = (Math.sin((counter + waveOneOffset) * 0.1) + 1) / 4
    const waveTwo = (Math.sin((counter + waveTwoOffset) * 0.03) + 1) / 4
    const stepMod = waveOne + waveTwo + 1

    currentX += stampOffset * stepMod
    counter++
  }

  // We have moved off the end of the line, so we need to move down a line
  // and set the currentX to the left border + whatever we are over the border by
  currentY += lineHeight
  currentX = borders.left + (stampSize / 2) + (currentX - rightEdge)

  stamps.push(thisLine)
}

// I want to remove the last 1/4 of the last line of the stamps
stamps[stamps.length - 1] = stamps[stamps.length - 1].slice(0, -stamps[stamps.length - 1].length / 4)

// I want to turn the letters of the last 6 stamps in the last line into the letter 'G'
// If there are less than 6 stamps in the last line, then turn all of the letters into 'G'
// and start on the previous line
const setLastLetters = (letter, count, stamps) => {
  let remaining = count
  let currentLine = stamps.length - 1

  while (remaining > 0 && currentLine >= 0) {
    const line = stamps[currentLine]
    for (let i = line.length - 1; i >= 0 && remaining > 0; i--) {
      line[i].letter = letter
      remaining--
    }
    currentLine--
  }
  return stamps
}

stamps = setLastLetters('G', 6, stamps)
stamps = setLastLetters('H', 2, stamps)

const letterList = []

for (let i = 0; i < stamps.length; i++) {
  const line = stamps[i]
  for (let j = 0; j < line.length; j++) {
    if (!letterList.includes(line[j].letter)) {
      letterList.push(line[j].letter)
    }
  }
}

const ink = (x, y) => {
  gcode += `( ink )
G0 Z${stampUpHeight}
G0 X${x} Y${y}
G0 Z${stampInkHeight}
G0 Z${stampUpHeight}
`
}

const stamp = (x, y) => {
  gcode += `( stamp )
G0 Z${stampUpHeight}
G0 X${x} Y${y}
G0 Z${stampDownHeight}
G0 Z${stampUpHeight}
`
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

const end = () => {
  gcode += `( end )
G0 Z${stampUpHeight}
G0 X0 Y0
M5
M2
`
}

inkPosition.inkRange = {
  left: inkPosition.left + stampSize * 0.75,
  right: inkPosition.right - stampSize * 0.75,
  top: inkPosition.top - stampSize * 0.75,
  bottom: inkPosition.bottom + stampSize * 0.75
}

// Now we need to construct the GCODE
let gcode = `( GCode File Generated with BT_SVG on: Sun Feb  2 18:02:23 2025 )
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
const canvas = new Canvas(width, height)
const ctx = canvas.getContext('2d')
// Fill the canvas with white
ctx.fillStyle = 'white'
ctx.fillRect(0, 0, width, height)
ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'

// Loop throug the letterList and add the GCODE for each letter
for (let i = 0; i < letterList.length; i++) {
  const letter = letterList[i]
  // Set to up height
  installTool(i + 1, letter)

  // Loop through all the lines in the stamps array
  for (let j = 0; j < stamps.length; j++) {
    const line = stamps[j]
    // Loop through all the stamps in the line
    for (let k = 0; k < line.length; k++) {
      const toStamp = line[k]
      // Ink the stamp if the letter is the same as the letter we are currently on
      if (toStamp.letter === letter) {
        const inkX = inkPosition.inkRange.left + Math.random() * (inkPosition.inkRange.right - inkPosition.inkRange.left)
        const inkY = inkPosition.inkRange.bottom + Math.random() * (inkPosition.inkRange.top - inkPosition.inkRange.bottom)
        ink(inkX, inkY)
        stamp(toStamp.x, height - toStamp.y)
        // Draw the stamp on the canvas, centered on the stamp
        ctx.fillRect(toStamp.x - (stampSize / 2), toStamp.y - (stampSize / 2), stampSize, stampSize)
      }
    }
  }
}

// Add the end
end()

// Get current timestamp in YYYY-MM-DD-HH-MM-SS format
const timestamp = new Date().toISOString()
  .replace(/[T]/g, '-')
  .replace(/[:.]/g, '-')
  .split('-')
  .slice(0, 6)
  .join('-')

// Write the gcode to a file
fs.writeFileSync(path.join(__dirname, 'output', `Agh-${timestamp}.gcode`), gcode)

const outJPG = await canvas.toBuffer('jpeg', {
  quality: 0.7
})

fs.writeFileSync(path.join(__dirname, 'output', `Agh-${timestamp}.jpg`), outJPG)
