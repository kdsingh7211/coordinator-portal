#!/usr/bin/env python3
"""Generate PWA icons for Eureka! Workplace"""
import os

# Create icons directory
os.makedirs('icons', exist_ok=True)

def make_icon_svg(size, bg='#1A1916', fg='#ffffff'):
    s = size
    ratio = s / 192
    bw = int(90 * ratio)
    bh = int(80 * ratio)
    bx = int(50 * ratio)
    topbar_y = int(28 * ratio)
    topbar_h = int(12 * ratio)
    e_y = int(50 * ratio)
    cutout_x = bx + int(22 * ratio)
    cutout_w = bw - int(22 * ratio)
    cutout_h = bh - int(14 * ratio)
    mid_y = e_y + int(30 * ratio)
    mid_h = int(14 * ratio)
    mid_w = int(45 * ratio)

    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {s} {s}">
  <rect width="{s}" height="{s}" rx="{int(38*ratio)}" fill="{bg}"/>
  <rect x="{bx}" y="{topbar_y}" width="{bw}" height="{topbar_h}" rx="2" fill="{fg}"/>
  <rect x="{bx}" y="{e_y}" width="{bw}" height="{bh}" rx="2" fill="{fg}"/>
  <rect x="{cutout_x}" y="{e_y+int(14*ratio)}" width="{cutout_w}" height="{cutout_h}" rx="1" fill="{bg}"/>
  <rect x="{cutout_x}" y="{mid_y}" width="{mid_w}" height="{mid_h}" rx="1" fill="{fg}"/>
</svg>'''

for sz in [192, 512]:
    svg = make_icon_svg(sz)
    with open(f'icons/icon-{sz}.svg', 'w') as f:
        f.write(svg)
    print(f'✅ SVG icon created at icons/icon-{sz}.svg')

with open('icons/icon.svg', 'w') as f:
    f.write(make_icon_svg(192))
print('✅ SVG icon created at icons/icon.svg')
print('ℹ️  For production, convert to PNG at 192x192 and 512x512')
print('   Use: python3 -c "import cairosvg; cairosvg.svg2png(url=\'icons/icon-192.svg\', write_to=\'icons/icon-192.png\', output_width=192, output_height=192)"')
