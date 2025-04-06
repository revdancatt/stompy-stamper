import fs from 'fs'
import path from 'path'
import { Canvas } from 'skia-canvas'

// Get the current directory of this file
const __dirname = path.dirname(new URL(import.meta.url).pathname)
const outputDir = path.join(__dirname, 'output')
// Create the output directory if it doesn't exist
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir)

const paperSize = {
  width: 210,
  height: 297
}
const border = {
  left: 20,
  right: 20,
  top: 20,
  bottom: 20
}

const baseStampSize = 10 // Size of the stamp in mm
const lineHeight = baseStampSize * 1 // Height of the line in mm

const inkPosition = {
  left: 290,
  right: 370,
  top: 164,
  bottom: 114
}

const stampUpHeight = 60
const stampDownHeight = 35
const stampInkHeight = 49

// Note: the stamps we are using for this at 10x10mm, and the letter
// is right in the center of the stamp, we have the full alphabet
// in upper and lower case, the normal punctuation, and numbers.

// const possibleChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789&.!?'
const possibleChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const charSize = {
  A: 6.2,
  B: 5.2,
  C: 5.3,
  D: 6.5,
  E: 5.3,
  F: 4.7,
  G: 6.4,
  H: 6.4,
  I: 3.7,
  J: 3.9,
  K: 5.9,
  L: 5,
  M: 7.5,
  N: 6.3,
  O: 5.8,
  P: 4.9,
  Q: 6,
  R: 6,
  S: 4.8,
  T: 5.9,
  U: 6.5,
  V: 6.3,
  W: 8,
  X: 6.2,
  Y: 6.1,
  Z: 5.8,
  a: 8,
  b: 8,
  c: 8,
  d: 8,
  e: 8,
  f: 8,
  g: 8,
  h: 8,
  i: 8,
  j: 8,
  k: 8,
  l: 8,
  m: 8,
  n: 8,
  o: 8,
  p: 8,
  q: 8,
  r: 8,
  s: 8,
  t: 8,
  u: 8,
  v: 8,
  w: 8,
  x: 8,
  y: 8,
  z: 8,
  0: 8,
  1: 8,
  2: 8,
  3: 8,
  4: 8,
  5: 8,
  6: 8,
  7: 8,
  8: 8,
  9: 8,
  '&': 6.4,
  '.': 3,
  '!': 8,
  '?': 8
}

const stampPositionMap = {}

// We are now going to fill the stampPositionMap with the positions of the stamps
// first I want to calculate the vertical height we have
const rows = Math.floor((paperSize.height - border.top - border.bottom) / lineHeight)
const yOffset = (paperSize.height - (rows * lineHeight)) / 2

// Now we're going to fill the page line at a time, starting at the top
let y = yOffset
while (y < paperSize.height - yOffset + lineHeight) {
  // Assume the letter we are going to use is 8mm wide, we want to set the center of the letter
  // on the left border.
  let x = 0
  const thisRowOfLetters = []
  while (x < paperSize.width - (border.left + border.right)) {
    // Now we want to get the next character from the possibleChars string
    const char = possibleChars[Math.floor(Math.random() * possibleChars.length)]
    thisRowOfLetters.push({
      char,
      x,
      y
    })
    const charWidth = charSize[char]
    x += charWidth
  }
  // Now that we have the row of letters we want to center them, so we need to
  // work out the total space on the left and right of the row, and then divide
  // that by 2 to get the offset.
  const totalSpace = paperSize.width - (x - charSize[thisRowOfLetters[thisRowOfLetters.length - 1].char])
  const offset = totalSpace / 2
  thisRowOfLetters.forEach(letter => {
    letter.x += offset
  })
  // Now that we've adjusted them, we can go through the rows of letters and add them
  // to the stampPositionMap
  thisRowOfLetters.forEach(letter => {
    if (!stampPositionMap[letter.char]) stampPositionMap[letter.char] = []
    stampPositionMap[letter.char].push({
      x: letter.x,
      y: letter.y,
      reink: true
    })
  })
  y += lineHeight
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

const stamp = (x, y) => {
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
( Paper Dimensions[WxH mm]: ${paperSize.width}, ${paperSize.height} )
( Install Height: 5.5)
( Scaling 1 )
( XY Offsets: 0, 0 )
( Rotation: 180)
( AccelX: 3000 )
( AccelY: 3000 )
G90\n`

inkPosition.inkRange = {
  left: inkPosition.left + baseStampSize * 0.75,
  right: inkPosition.right - baseStampSize * 0.75,
  top: inkPosition.top - baseStampSize * 0.75,
  bottom: inkPosition.bottom + baseStampSize * 0.75
}

// Now we want to draw the canvas so we can preview the layout, as
// the paper size in mm is pretty small, we want to scale it up by 10x
const scale = 10
const canvas = new Canvas(paperSize.width * scale, paperSize.height * scale)

// Now we want to draw the stampPositionMap on the canvas, so we'll
// loop through the possibleChars and draw a tiny dot at each position
const ctx = canvas.getContext('2d')
ctx.fillStyle = 'white'
ctx.fillRect(0, 0, canvas.width, canvas.height)
// Set the font size and align to center
const fontSize = 8 * scale
ctx.font = `${fontSize}px monospace`
ctx.textAlign = 'center'

// Loop through the possibleChars
for (const char of possibleChars) {
  // Grab all the positions for this character
  const positions = stampPositionMap[char]
  // Get the index of the character in the possibleChars array
  const index = possibleChars.indexOf(char)
  // Calculate the hue for the color to preview the character
  const huePercent = index / possibleChars.length
  const hue = huePercent * 360
  ctx.fillStyle = `hsl(${hue}, 100%, 50%)`

  // Install the tool on the machine
  installTool(index, char)

  // Loop through the positions and draw the character at the correct position
  positions.forEach(position => {
    // Calculate the position of the character on the canvas
    const x = position.x * scale + scale / 2
    const y = position.y * scale + scale / 2 + fontSize / 2.5
    // Grab the percentage of the position on the canvas so we
    // can calculate the stamp positions relative to the
    // paper size
    const xPercent = x / canvas.width
    const yPercent = y / canvas.height

    // Grab a random position on the ink page to reink the stamp
    const inkX = inkPosition.inkRange.left + Math.random() * (inkPosition.inkRange.right - inkPosition.inkRange.left)
    const inkY = inkPosition.inkRange.bottom + Math.random() * (inkPosition.inkRange.top - inkPosition.inkRange.bottom)

    // Draw the character on the canvas
    ctx.fillText(char, x, y)
    // If the character needs to be reinked, return to the ink pad
    if (position.reink) ink(inkX, inkY)
    // Stamp the character on the paper
    stamp(xPercent * paperSize.width, paperSize.height - (yPercent * paperSize.height))
  })
}

end()

// Now we want to save the canvas to a file
const fileName = path.join(outputDir, '10mm.png')
const outPNG = await canvas.toBuffer('png', {
  quality: 0.7
})
fs.writeFileSync(fileName, outPNG)

// Now we want to save the GCODE to a file
const gcodeFileName = path.join(outputDir, '10mm.gcode')
fs.writeFileSync(gcodeFileName, gcode)

console.log('Done!')
