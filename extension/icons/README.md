# Icon Placeholder

The extension needs icon files at these sizes:
- icon16.png (16x16)
- icon32.png (32x32)
- icon48.png (48x48)
- icon128.png (128x128)

## Temporary Setup

For now, you can:
1. Use any PNG image and rename it to these sizes
2. Or generate icons using tools like:
   - https://www.favicon-generator.org/
   - Photoshop/GIMP/Figma
   - Online icon makers

## Suggested Design

- Shield icon with green (#33ff00) terminal aesthetic
- Black background (#000000)
- Sharp edges (no rounded corners)
- Terminal CLI style

## Quick Fix

Copy any PNG file 4 times in this directory:
```bash
# Example if you have a logo.png
cp logo.png icon16.png
cp logo.png icon32.png
cp logo.png icon48.png
cp logo.png icon128.png
```

Browser will auto-scale for now. Add proper sized icons later for production.
