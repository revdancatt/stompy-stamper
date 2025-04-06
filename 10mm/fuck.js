import fs from 'fs'
import path from 'path'
import { Canvas } from 'skia-canvas'

// Get the current directory of this file
const __dirname = path.dirname(new URL(import.meta.url).pathname)
const outputDir = path.join(__dirname, 'output')
// Create the output directory if it doesn't exist
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir)

const paperSize = {
  width: 560,
  height: 760
}

const border = {
  left: 30,
  right: 30,
  top: 30,
  bottom: 30
}

/*
const paperSize = {
  width: 148,
  height: 210
}
const border = {
  left: 8,
  right: 8,
  top: 8,
  bottom: 8
}
*/

const flipXY = true

const baseStampSize = 10 // Size of the stamp in mm
const lineHeight = baseStampSize * 1 // Height of the line in mm

const inkPosition = {
  left: 822,
  right: 902,
  top: 330,
  bottom: 280
}

const stampUpHeight = 60
const stampDownHeight = 35
const stampInkHeight = 49

// Note: the stamps we are using for this at 10x10mm, and the letter
// is right in the center of the stamp, we have the full alphabet
// in upper and lower case, the normal punctuation, and numbers.

// const possibleChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789&.!?'
const possibleChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ '
const charSize = {
  A: {
    width: 6.2,
    xNudge: 0,
    yNudge: 0
  },
  B: {
    width: 5.2,
    xNudge: 0,
    yNudge: 0
  },
  C: {
    width: 5.3,
    xNudge: 0,
    yNudge: -0.05
  },
  D: {
    width: 6.5,
    xNudge: 0,
    yNudge: 0
  },
  E: {
    width: 5.3,
    xNudge: 0,
    yNudge: 0
  },
  F: {
    width: 5.2,
    xNudge: 0,
    yNudge: 0
  },
  G: {
    width: 6.4,
    xNudge: 0,
    yNudge: 0
  },
  H: {
    width: 6.4,
    xNudge: 0,
    yNudge: 0
  },
  I: {
    width: 4.8,
    xNudge: 0,
    yNudge: 0
  },
  J: {
    width: 3.9,
    xNudge: 0,
    yNudge: 0
  },
  K: {
    width: 5,
    xNudge: 0.45,
    yNudge: 0
  },
  L: {
    width: 5,
    xNudge: 0,
    yNudge: 0
  },
  M: {
    width: 7.5,
    xNudge: 0,
    yNudge: 0
  },
  N: {
    width: 6.3,
    xNudge: 1.11,
    yNudge: 0
  },
  O: {
    width: 5.8,
    xNudge: 0,
    yNudge: 0
  },
  P: {
    width: 4.9,
    xNudge: 0,
    yNudge: 0
  },
  Q: {
    width: 6,
    xNudge: 0,
    yNudge: 0
  },
  R: {
    width: 6,
    xNudge: -0.1,
    yNudge: -0.1
  },
  S: {
    width: 4.8,
    xNudge: 0,
    yNudge: 0
  },
  T: {
    width: 5.9,
    xNudge: 0,
    yNudge: -0.05
  },
  U: {
    width: 5,
    xNudge: 0.9,
    yNudge: 0
  },
  V: {
    width: 6.3,
    xNudge: 0,
    yNudge: 0
  },
  W: {
    width: 8,
    xNudge: 0,
    yNudge: 0
  },
  X: {
    width: 6.2,
    xNudge: 0,
    yNudge: 0
  },
  Y: {
    width: 6.1,
    xNudge: 0,
    yNudge: 0
  },
  Z: {
    width: 5.8,
    xNudge: 0,
    yNudge: 0
  },
  a: {
    width: 8,
    xNudge: 0,
    yNudge: 0
  },
  b: {
    width: 8,
    xNudge: 0,
    yNudge: 0
  },
  c: {
    width: 8,
    xNudge: 0,
    yNudge: 0
  },
  d: {
    width: 8,
    xNudge: 0,
    yNudge: 0
  },
  e: {
    width: 8,
    xNudge: 0,
    yNudge: 0
  },
  f: {
    width: 8,
    xNudge: 0,
    yNudge: 0
  },
  g: {
    width: 8,
    xNudge: 0,
    yNudge: 0
  },
  h: {
    width: 8,
    xNudge: 0,
    yNudge: 0
  },
  i: {
    width: 8,
    xNudge: 0,
    yNudge: 0
  },
  j: {
    width: 8,
    xNudge: 0,
    yNudge: 0
  },
  k: {
    width: 8,
    xNudge: 0,
    yNudge: 0
  },
  l: {
    width: 8,
    xNudge: 0,
    yNudge: 0
  },
  m: {
    width: 8,
    xNudge: 0,
    yNudge: 0
  },
  n: {
    width: 8,
    xNudge: 0,
    yNudge: 0
  },
  o: {
    width: 8,
    xNudge: 0,
    yNudge: 0
  },
  p: {
    width: 8,
    xNudge: 0,
    yNudge: 0
  },
  q: {
    width: 8,
    xNudge: 0,
    yNudge: 0
  },
  r: {
    width: 8,
    xNudge: 0,
    yNudge: 0
  },
  s: {
    width: 8,
    xNudge: 0,
    yNudge: 0
  },
  t: {
    width: 8,
    xNudge: 0,
    yNudge: 0
  },
  u: {
    width: 8,
    xNudge: 0,
    yNudge: 0
  },
  v: {
    width: 8,
    xNudge: 0,
    yNudge: 0
  },
  w: {
    width: 8,
    xNudge: 0,
    yNudge: 0
  },
  x: {
    width: 8,
    xNudge: 0,
    yNudge: 0
  },
  y: {
    width: 8,
    xNudge: 0,
    yNudge: 0
  },
  z: {
    width: 8,
    xNudge: 0,
    yNudge: 0
  },
  0: {
    width: 8,
    xNudge: 0,
    yNudge: 0
  },
  1: {
    width: 8,
    xNudge: 0,
    yNudge: 0
  },
  2: {
    width: 8,
    xNudge: 0,
    yNudge: 0
  },
  3: {
    width: 8,
    xNudge: 0,
    yNudge: 0
  },
  4: {
    width: 8,
    xNudge: 0,
    yNudge: 0
  },
  5: {
    width: 8,
    xNudge: 0,
    yNudge: 0
  },
  6: {
    width: 8,
    xNudge: 0,
    yNudge: 0
  },
  7: {
    width: 8,
    xNudge: 0,
    yNudge: 0
  },
  8: {
    width: 8,
    xNudge: 0,
    yNudge: 0
  },
  9: {
    width: 8,
    xNudge: 0,
    yNudge: 0
  },
  '&': {
    width: 6.4,
    xNudge: 0,
    yNudge: 0
  },
  '.': {
    width: 3,
    xNudge: 0,
    yNudge: 0
  },
  '!': {
    width: 8,
    xNudge: 0,
    yNudge: 0
  },
  '?': {
    width: 8,
    xNudge: 0,
    yNudge: 0
  },
  ' ': {
    width: 10,
    xNudge: 0,
    yNudge: 0
  }
}

const words = ['FUCK', 'FUCK', 'FUCK', 'FUCK', 'FUCKITY', 'FUCKITY', 'FUCKING', 'FUCK', 'FUCK', 'FUCK', 'FUCK', 'FUCKITY', 'FUCKITY', 'FUCKING', 'FUCKER']
const validLetters = []
// Build up unique list of letters needed from all words
for (const word of words) {
  for (const letter of word) {
    if (!validLetters.includes(letter)) {
      validLetters.push(letter)
    }
  }
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
  let thisWord = words[Math.floor(Math.random() * words.length)]
  let letterIndex = 0
  while (x < paperSize.width - (border.left + border.right)) {
    // Now we want to get the next character from the possibleChars string
    const char = thisWord[letterIndex]
    thisRowOfLetters.push({
      char,
      x: x + charSize[char].xNudge,
      y: y + charSize[char].yNudge
    })
    const charWidth = charSize[char].width
    x += charWidth
    letterIndex++
    if (letterIndex >= thisWord.length) {
      thisRowOfLetters.push({
        char: ' ',
        x: x + charSize[' '].xNudge,
        y: y + charSize[' '].yNudge
      })
      x += 10
      letterIndex = 0
      thisWord = words[Math.floor(Math.random() * words.length)]
    }
  }

  // Now pop letters from the end of the row until we pop a space
  while (thisRowOfLetters[thisRowOfLetters.length - 1].char !== ' ') {
    thisRowOfLetters.pop()
  }
  thisRowOfLetters.pop()

  // Now that we have the row of letters we want to center them, so we need to
  // work out the total space on the left and right of the row, and then divide
  // that by 2 to get the offset.
  let totalLetterWidth = 0
  thisRowOfLetters.forEach(letter => {
    totalLetterWidth += charSize[letter.char].width
  })

  const totalSpace = paperSize.width - totalLetterWidth
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
( Paper Dimensions[WxH mm]: ${flipXY ? paperSize.height : paperSize.width}, ${flipXY ? paperSize.width : paperSize.height} )
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
for (const char of validLetters) {
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
    if (flipXY) {
      stamp(yPercent * paperSize.height, xPercent * paperSize.width)
    } else {
      stamp(xPercent * paperSize.width, paperSize.height - (yPercent * paperSize.height))
    }
  })
}

end()

// Now we want to save the canvas to a file
const fileName = path.join(outputDir, 'fuck.png')
const outPNG = await canvas.toBuffer('png', {
  quality: 0.7
})
fs.writeFileSync(fileName, outPNG)

// Now we want to save the GCODE to a file
const gcodeFileName = path.join(outputDir, 'fuck.gcode')
fs.writeFileSync(gcodeFileName, gcode)

console.log('Done!')
