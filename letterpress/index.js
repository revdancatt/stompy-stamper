import fs from 'fs'
import path from 'path'
import { Canvas } from 'skia-canvas'
import { setFlipXY, setStampUpHeight, setStampDownHeight, setStampInkHeight, start, installTool, ink, stamp, end } from './gcode.js'

const __dirname = path.dirname(new URL(import.meta.url).pathname)
const outputDir = path.join(__dirname, 'output')

// Create the output directory if it doesn't exist
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir)

// Get command line arguments
const args = process.argv.slice(2)

// Check we have the correct number of arguments
if (args.length !== 3) {
  console.log('Please provide three arguments:')
  console.log('1. Config file')
  console.log('2. Font file')
  console.log('3. Input file')
  process.exit(1)
}

const [configFile, fontFile, inputFile] = args

// Check all files exist
const filesToCheck = [configFile, fontFile, inputFile]
const missingFiles = filesToCheck.filter(file => !fs.existsSync(file))

if (missingFiles.length > 0) {
  console.log('The following files do not exist:')
  missingFiles.forEach(file => console.log(`- ${file}`))
  process.exit(1)
}

// Read the config file
const config = JSON.parse(fs.readFileSync(configFile, 'utf8'))

// Read the font file
const font = JSON.parse(fs.readFileSync(fontFile, 'utf8'))
const validLetters = Object.keys(font.glyphs)

// Read the input file
let input = fs.readFileSync(inputFile, 'utf8').toUpperCase()
// Remove any characters that are not in the validLetters array
input = input.split('').filter(letter => validLetters.includes(letter)).join('')

const dpi = 300
const mmPerInch = 25.4
const mmToPixels = dpi / mmPerInch

// Working in mm, I'm going to want to slowly fill the page with letters, a bit
// like a letterpress printer. So we are going to need to make rows of letters
// at a time, which involves building up the rows one by one.
// And we'll be adding words to each row one at a time, working out if we can
// fit the next word in, and if not, moving onto the next row.
// So we need to read the input file, and for each line, we need to split it into
// words, and then we need to work out if we can fit the next word in the current
// row. If we can't, we need to move onto the next row.

// First we need to split the input into lines
const inputLines = input.split('\n')
// This is going to hold the rows of letterpress we are going to print
const currentRow = []
const letterpressRows = []
let currentInputLine = 0
let currentInputLineWords = inputLines[currentInputLine].split(' ')
let currentInputLineWordIndex = 0
const spaceWidth = font.glyphs[' '].width

// This is the starting position of the letterpress
let x = config.border.left - spaceWidth // Start the first word back on space

let finished = false
let escapeCounter = 0

while (!finished && escapeCounter < 1000) {
  const currentWord = currentInputLineWords[currentInputLineWordIndex]
  // work out the width of the current word by adding up the widths of the letters
  const currentWordWidth = currentWord.split('').reduce((acc, letter) => acc + font.glyphs[letter].width, 0)
  const rightEdgeOfCurrentWord = x + spaceWidth + currentWordWidth

  // If the right edge of the current word is NOT past the right border then we can
  // add the letters in the current word to the current row one at a time, starting
  // with a space, and then adding the letters one by one.
  if (rightEdgeOfCurrentWord > config.width - config.border.right) {
    // If the right edge of the current word is past the right border then we need
    // to move onto the next row.
    letterpressRows.push(JSON.parse(JSON.stringify(currentRow)))
    currentRow.length = 0
    x = config.border.left - spaceWidth
  }
  // Add the space to the current row
  currentRow.push({
    letter: ' ',
    x
  })
  x += spaceWidth

  // Add the letters in the current word to the current row
  currentWord.split('').forEach(letter => {
    currentRow.push({
      letter,
      x
    })
    // Move the x position to the right edge of the current letter
    x += font.glyphs[letter].width
  })

  // Increase the current input line word index
  currentInputLineWordIndex++

  // If we have reached the end of the current input line then we need to move
  // onto the next input line.
  if (currentInputLineWordIndex >= currentInputLineWords.length) {
    // If we have reached the end of the current input line then have finished
    // the letterpress row, so we need to push it onto the letterpressRows array
    // and reset the current row.
    letterpressRows.push(JSON.parse(JSON.stringify(currentRow)))
    currentRow.length = 0
    x = config.border.left - spaceWidth
    // Move onto the next input line
    currentInputLine++
    // If we have reached the end of the input lines then we have finished
    if (currentInputLine >= inputLines.length) {
      finished = true
    } else {
      currentInputLineWords = inputLines[currentInputLine].split(' ')
      currentInputLineWordIndex = 0
    }
  }

  escapeCounter++
}

// Now we have a space at the start of each row, so we need to remove it
letterpressRows.forEach(row => {
  row.shift()
})

// Now I want to go through each row and work out the full width of the row
// which means adding up the widths of all the letters in the row
const rowWidths = letterpressRows.map(row => {
  return row.reduce((acc, letter) => acc + font.glyphs[letter.letter].width, 0)
})
// If the config.hAlign is "right", then we need to work out how much space there
// is between the right edge of the row and the right border
if (config.hAlign === 'right') {
  rowWidths.forEach((rowWidth, index) => {
    const spaceWidth = (config.width - (config.border.left + config.border.right) - rowWidth)
    letterpressRows[index].forEach(letter => {
      letter.x += spaceWidth
    })
  })
}

// If the config.hAlign is "center", then we need to work out how much space there
// is between the left edge of the row and the left border
if (config.hAlign === 'center') {
  rowWidths.forEach((rowWidth, index) => {
    const spaceWidth = (config.width - (config.border.left + config.border.right) - rowWidth) / 2
    letterpressRows[index].forEach(letter => {
      letter.x += spaceWidth
    })
  })
}

// If the config.hAlign is "justified", then we need to work out how much space there
// between each letter, so if there's 14 letters in the row, there are 13 spaces between
// them, and we need to divide the spaceWidth by the number of spaces
// But as we need to shift all the letters ro the right, we need to move each one
// as a multipule of the letters position in the row
if (config.hAlign === 'justified') {
  rowWidths.forEach((rowWidth, index) => {
    const spaceWidth = (config.width - (config.border.left + config.border.right) - rowWidth) / (letterpressRows[index].length - 1)
    letterpressRows[index].forEach((letter, letterIndex) => {
      letter.x += letterIndex * spaceWidth
    })
  })
}

const startY = config.border.top
// Work out the height of all the letterpress rows
const totalHeight = letterpressRows.length * font.size.height * config.lineHeight
// Work out the y position of the bottom of the last row
const endY = (startY + totalHeight)
const bottomBorder = config.height - config.border.bottom
const bottomDiff = bottomBorder - endY + (font.size.height * (config.lineHeight - 1))

let yShift = 0
const thisLineHeight = config.lineHeight

// If the config.vAlign is "bottom", then we need to work out how much space there
// is between the bottom of the last row and the bottom border
if (config.vAlign === 'bottom') {
  yShift = bottomDiff
}

// If we are using the "middle" alignment, then we need to work out the y shift
// so that the bottom of the last row is in the middle of the page
if (config.vAlign === 'middle') {
  yShift = bottomDiff / 2
}

if (config.vAlign === 'fill') {
  // If we are filling the page, then we want to work out a y shift per row
  // so that the rows are as close to the bottom of
  // the page as possible
  yShift = bottomDiff / (letterpressRows.length - 1)
  // Now go through each row, and work out the y position of the row, and
  // set the y position of each letter in the row to the y position of the row
  // plus the y shift
  letterpressRows.forEach((row, rowIndex) => {
    row.forEach(letter => {
      letter.y = startY + (rowIndex * font.size.height * thisLineHeight) + (yShift * rowIndex)
    })
  })
} else {
  // Now go through each row, and work out the y position of the row, and
  // set the y position of each letter in the row to the y position of the row
  // plus the y shift
  letterpressRows.forEach((row, rowIndex) => {
    row.forEach(letter => {
      letter.y = startY + (rowIndex * font.size.height * thisLineHeight) + yShift
    })
  })
}
const stamps = {}
const usedLetters = []

const width = config.width * mmToPixels
const height = config.height * mmToPixels

// Create a canvas
const canvas = new Canvas(width, height)

// Create a context
const ctx = canvas.getContext('2d')

// Set the font
// ctx.font = `${font.size * mmToPixels * 10}px monospace`
ctx.font = `${font.size.width * mmToPixels}px monospace`
ctx.textAlign = 'center'
ctx.textBaseline = 'middle'

// Fill the canvas with a white background
ctx.fillStyle = 'white'
ctx.fillRect(0, 0, width, height)

// Draw the border
ctx.strokeStyle = 'black'
ctx.fillStyle = 'black'
ctx.lineWidth = 1
ctx.strokeRect(config.border.left * mmToPixels, config.border.top * mmToPixels, width - config.border.left * mmToPixels - config.border.right * mmToPixels, height - config.border.top * mmToPixels - config.border.bottom * mmToPixels)

// Draw the letterpress rows
// let y = config.border.top * mmToPixels
letterpressRows.forEach(row => {
  row.forEach(letter => {
    const x = letter.x * mmToPixels
    const y = letter.y * mmToPixels
    const width = font.glyphs[letter.letter].width * mmToPixels
    const height = font.size.height * mmToPixels
    // Calculate the center of the letter
    // Calculate the center of the letter
    const centerX = x + width / 2
    const centerY = y + height / 2

    // Draw the letter
    ctx.fillStyle = 'black'
    ctx.fillText(letter.letter, centerX, centerY)

    // Draw the border of the letter
    ctx.strokeRect(x, y, width, height)
    // Now draw a tiny circle at the center of the letter
    ctx.fillStyle = 'red'
    ctx.beginPath()
    ctx.arc(centerX, centerY, 0.25 * mmToPixels, 0, Math.PI * 2)
    ctx.fill()

    // If the letter has not been used before then we want to add it to the
    // usedLetters array
    if (!usedLetters.includes(letter.letter)) {
      usedLetters.push(letter.letter)
      stamps[letter.letter] = []
    }
    stamps[letter.letter].push({
      x: (centerX / mmToPixels) + font.glyphs[letter.letter].xNudge,
      y: (centerY / mmToPixels) + font.glyphs[letter.letter].yNudge
    })
  })
  // y += font.size.height * config.lineHeight * mmToPixels
})

const fileName = path.join(outputDir, (inputFile.split('/').pop().split('.').slice(0, -1)) + (configFile.split('/').pop().split('.').slice(0, -1)) + (fontFile.split('/').pop().split('.').slice(0, -1)) + '.png')
const outPNG = await canvas.toBuffer('png', {
  quality: 0.7
})
fs.writeFileSync(fileName, outPNG)

// Set the paper size, and all the settings from the config file
const paperSize = { width: config.width, height: config.height }
if (config.rotated) setFlipXY(true)
setStampUpHeight(config.setStampUpHeight)
setStampDownHeight(config.setStampDownHeight)
setStampInkHeight(config.stampInkHeight)

let gcode = start(paperSize, '')

usedLetters.forEach((letter, index) => {
  gcode = installTool(index, letter, gcode)
  stamps[letter].forEach(letterStamp => {
    const inkX = Math.random() * (config.inkPosition.right - config.inkPosition.left - font.size.width) + config.inkPosition.left + font.size.width / 2
    const inkY = Math.random() * (config.inkPosition.top - config.inkPosition.bottom - font.size.height) + config.inkPosition.bottom + font.size.height / 2
    gcode = ink(inkX, inkY, gcode)
    if (config.rotated) {
      gcode = stamp(letterStamp.y, letterStamp.x, gcode)
    } else {
      gcode = stamp(letterStamp.x, paperSize.height - letterStamp.y, gcode)
    }
  })
})
gcode = end(gcode)

// Write the gcode to a file
const gcodeFileName = path.join(outputDir, (inputFile.split('/').pop().split('.').slice(0, -1)) + (configFile.split('/').pop().split('.').slice(0, -1)) + (fontFile.split('/').pop().split('.').slice(0, -1)) + '.gcode')
fs.writeFileSync(gcodeFileName, gcode)

// Write the used letters to a file
const usedLettersFileName = path.join(outputDir, (inputFile.split('/').pop().split('.').slice(0, -1)) + (configFile.split('/').pop().split('.').slice(0, -1)) + (fontFile.split('/').pop().split('.').slice(0, -1)) + '.txt')
fs.writeFileSync(usedLettersFileName, usedLetters.join('\n'))

console.log('Done!')
