import fs from 'fs'
import path from 'path'
import { Canvas } from 'skia-canvas'

// Get the word from command line arguments
const word = process.argv[2]

if (!word) {
  console.log('Please provide a word as the first parameter')
  process.exit(1)
}

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
const lineHeight = stampSize * 0.666
const stampOffset = stampSize * 0.333

// We are going to hold an array of the stamps, lines at a time
const stamps = []

// Now we want the borders
const borders = {
  top: 10,
  bottom: 10,
  left: 10,
  right: 10
}

const inkPosition = {
  left: 318,
  right: 391,
  top: 42,
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
    const thisLetter = word[Math.floor(Math.random() * word.length)]
    thisLine.push({
      letter: thisLetter,
      x: currentX,
      y: currentY,
      doubleTap: false
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

// Work out all the unique letters in the stamps
const letterList = []

for (let i = 0; i < stamps.length; i++) {
  const line = stamps[i]
  for (let j = 0; j < line.length; j++) {
    if (!letterList.includes(line[j].letter)) {
      letterList.push(line[j].letter)
    }
  }
}

// Now loop through the letterList and add the GCODE for each letter
// So we can toggle if we need to re-ink the stamp, we want
// to only re-ink the stamp every other time so we can get
// some variation in the ink
for (let i = 0; i < letterList.length; i++) {
  const letter = letterList[i]
  let reInk = true
  // Loop through all the lines in the stamps array
  for (let j = 0; j < stamps.length; j++) {
    // Loop through all the stamps in the line
    for (let k = 0; k < stamps[j].length; k++) {
      if (stamps[j][k].letter === letter) {
        stamps[j][k].reInk = reInk
        reInk = !reInk
      }
    }
  }
}
// Now we want to force a few letters into the line that is one-third down the page
// so lets work out which line that is
const oneThirdLineIndex = Math.floor(stamps.length / 3)
const oneThirdLine = stamps[oneThirdLineIndex]

// Now we want to force the letters from the word into this line, with a padding of
// 5 letters on the right, so count back 5 letters + the length of the word
// then insert each letter of the word from that position going forwards
const padding = 4
const wordLength = word.length
const startPosition = oneThirdLine.length - (wordLength + padding)

for (let i = 0; i < wordLength; i++) {
  stamps[oneThirdLineIndex][startPosition + i].letter = word[i]
  // Always re-ink the stamp for the main word
  stamps[oneThirdLineIndex][startPosition + i].reInk = true
  stamps[oneThirdLineIndex][startPosition + i].doubleTap = true
}

// Set reink to false for the letters before and after the main word
stamps[oneThirdLineIndex][startPosition - 1].reInk = false
stamps[oneThirdLineIndex][startPosition + wordLength].reInk = false

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
const canvas = new Canvas(width, height)
const ctx = canvas.getContext('2d')
// Fill the canvas with white
ctx.fillStyle = 'white'
ctx.fillRect(0, 0, width, height)

// Loop through the letterList and add the GCODE for each letter
for (let i = 0; i < letterList.length; i++) {
  const hue = Math.floor((i / letterList.length) * 360)
  const letter = letterList[i]
  // Set to up height
  installTool(i + 1, letter)

  // We are going to stamp twice after inking the rubber stamp
  // so we want to only ink the first stamp of those two
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

        if (toStamp.reInk) ink(inkX, inkY)
        stamp(toStamp.x, height - toStamp.y)
        if (toStamp.doubleTap) stamp(inkX, inkY)

        // Lighten the colour for the second stamp
        ctx.fillStyle = `hsla(${hue}, 100%, 50%, 0.8)`
        if (!toStamp.reInk) ctx.fillStyle = `hsla(${hue}, 100%, 50%, 0.4)`
        // Draw the stamp on the canvas, centered on the stamp
        ctx.fillRect(toStamp.x - (stampSize / 2), toStamp.y - (stampSize / 2), stampSize, stampSize)
      }
    }
  }
}

// Add the end
end()

// Write the gcode to a file
fs.writeFileSync(path.join(__dirname, 'output', `${word}.gcode`), gcode)
console.log('Saved: ', path.join('output', `${word}.gcode`))
const outJPG = await canvas.toBuffer('jpeg', {
  quality: 0.7
})

fs.writeFileSync(path.join(__dirname, 'output', `${word}.jpg`), outJPG)
