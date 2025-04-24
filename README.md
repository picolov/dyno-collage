# Dyno Collage

<div align="center">
  <img src="https://github.com/picolov/dyno-collage/blob/master/dyno.png" alt="Dyno Collage Logo" width="200" />
</div>

[![npm version](https://img.shields.io/npm/v/dyno-collage.svg?style=flat-square)](https://www.npmjs.com/package/dyno-collage)
[![npm downloads](https://img.shields.io/npm/dm/dyno-collage.svg?style=flat-square)](https://www.npmjs.com/package/dyno-collage)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![Bun](https://img.shields.io/badge/Bun-1.0.0-blue?style=flat-square)](https://bun.sh)

A dynamic library to generate image collage with text and images.

## ✨ Features

- 🖼️ Combine images and text in a single collage
- 📐 Precise positioning with percentage-based coordinates
- 🔄 Scale images to any size
- 🔄 Rotate both images and text
- 📝 Customizable text with font size control
- 🚀 Real-time preview with auto-updates
- 🛡️ Error handling with fallback display

## 📦 Installation

```bash
npm install --save dyno-collage
```

## 🚀 Quick Start

```javascript
const size = { width: 800, height: 600 };

const content = [
  '#text:Welcome;position 50,10;font-size 24;rotate 15',
  'https://example.com/logo.png;position 30,30;scale 0.8;rotate -45'
];

const imageBuffer = await generateCollage(size, content);
```

## 📝 Content Instructions Format

Each line in the content array follows this format:
```
value;position x,y;style1 value1;style2 value2
```

Where `value` can be:
- Text: `#text:Your text here`
- Image URL: `https://example.com/image.png`

Available styles:
- `position x,y`: Position in percentage (0-100)
- `scale value`: Scale factor (1.0 = original size)
- `rotate degrees`: Rotation in degrees
- `font-size size`: Font size for text elements

## 📚 API Reference

### `generateCollage(size, content)`

- `size`: Object with `width` and `height` properties
- `content`: Array of strings with values and styling instructions

Returns: Promise resolving to a Buffer containing the PNG image
