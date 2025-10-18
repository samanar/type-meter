# macOS Tray Icon Setup

For macOS, the tray icon should be a **Template Image** for proper menu bar integration.

## Template Image Requirements

1. **Name**: Should end with `Template.png` (e.g., `trayTemplate.png`)
2. **Format**: PNG with transparency
3. **Size**: 22x22 pixels (or 16x16, 44x44 for @2x retina)
4. **Color**: Monochrome - black shape on transparent background
5. **Style**: Simple, recognizable icon that works in both light and dark menu bars

## Creating the Icon

You can create a proper macOS template icon using:

```bash
# Using ImageMagick (if installed)
convert tray.png -resize 22x22 -colorspace gray -negate trayTemplate.png

# Or create manually in any image editor:
# - Make it 22x22 pixels
# - Use black (#000000) for the icon shape
# - Use transparent background
# - Keep it simple and monochrome
```

## Current Fallback

The app will automatically fall back to using `tray.png` if `trayTemplate.png` is not found, resizing it to 22x22 pixels for macOS.

For best results, create a proper template icon that follows Apple's Human Interface Guidelines:
https://developer.apple.com/design/human-interface-guidelines/menu-bar-extras