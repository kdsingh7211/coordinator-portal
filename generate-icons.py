#!/usr/bin/env python3
"""Generate PWA icons for CoordPortal"""
import os

# Create icons directory
os.makedirs('icons', exist_ok=True)

# Minimal SVG icon
svg = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192">
  <rect width="192" height="192" rx="40" fill="#1A1916"/>
  <rect x="52" y="56" width="88" height="10" rx="5" fill="#3B82F6"/>
  <rect x="52" y="80" width="70" height="8" rx="4" fill="#6B6860"/>
  <rect x="52" y="100" width="80" height="8" rx="4" fill="#6B6860"/>
  <rect x="52" y="120" width="60" height="8" rx="4" fill="#6B6860"/>
  <circle cx="142" cy="130" r="22" fill="#2563EB"/>
  <text x="142" y="137" text-anchor="middle" font-size="20" fill="white" font-family="sans-serif" font-weight="bold">C</text>
</svg>'''

with open('icons/icon.svg', 'w') as f:
    f.write(svg)

print("✅ SVG icon created at icons/icon.svg")
print("ℹ️  For production, convert to PNG at 192x192 and 512x512")
print("   Use: https://cloudconvert.com/svg-to-png or Inkscape")
