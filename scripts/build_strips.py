#!/usr/bin/env python3
"""Build per-row WebP strips from a PNG frame sequence.

Each strip is a single-row horizontal atlas: [frame_0 | frame_1 | ... | frame_N-1].
For an xy-axis viewer with rows R and cols C, this produces R strips of C frames each.
For an x-axis viewer, a single strip containing all frames is produced.

Usage:
  python3 scripts/build_strips.py \
    --frames ~/Desktop/Projects/VkRay/outputs/frames-dragon \
    --out assets/images/strips/dragon \
    --rows 24 --cols 24 --width 700

  python3 scripts/build_strips.py \
    --frames ~/Desktop/Projects/VkRay/outputs/frames-lucy \
    --out assets/images/strips/lucy \
    --rows 1 --cols N --width 700
"""
import argparse
import os
import sys
from PIL import Image


def build_strips(frames_dir, out_dir, rows, cols, frame_width, quality=85):
    frames_dir = os.path.expanduser(frames_dir)
    os.makedirs(out_dir, exist_ok=True)

    sample_path = os.path.join(frames_dir, 'frame_00000.png')
    if not os.path.exists(sample_path):
        sys.exit(f'Error: {sample_path} not found')

    sample = Image.open(sample_path)
    sw, sh = sample.size
    frame_height = round(frame_width * sh / sw)
    total = rows * cols
    print(f'Source: {sw}x{sh}  →  frame: {frame_width}x{frame_height}')
    print(f'Grid: {rows} rows × {cols} cols = {total} frames')
    print(f'Strip size: {frame_width * cols}x{frame_height}  ×{rows} strips')
    print()

    for row in range(rows):
        strip = Image.new('RGBA', (frame_width * cols, frame_height))
        for col in range(cols):
            idx = row * cols + col
            path = os.path.join(frames_dir, f'frame_{idx:05d}.png')
            if not os.path.exists(path):
                sys.exit(f'Error: missing {path}')
            frame = Image.open(path).convert('RGBA')
            frame = frame.resize((frame_width, frame_height), Image.LANCZOS)
            strip.paste(frame, (col * frame_width, 0))

        out_path = os.path.join(out_dir, f'strip_{row:02d}.webp')
        strip.save(out_path, 'WEBP', quality=quality, method=6)
        size_kb = os.path.getsize(out_path) // 1024
        print(f'  [{row + 1:2d}/{rows}] strip_{row:02d}.webp  {size_kb} KB')

    print('\nDone.')


if __name__ == '__main__':
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--frames',  required=True, help='Directory of frame_NNNNN.png files')
    ap.add_argument('--out',     required=True, help='Output directory for strip_NN.webp files')
    ap.add_argument('--rows',    type=int, required=True, help='Number of strips (Y positions)')
    ap.add_argument('--cols',    type=int, required=True, help='Frames per strip (X positions)')
    ap.add_argument('--width',   type=int, default=700,   help='Output width per frame in px (default 700)')
    ap.add_argument('--quality', type=int, default=85,    help='WebP quality 1-100 (default 85)')
    a = ap.parse_args()
    build_strips(a.frames, a.out, a.rows, a.cols, a.width, a.quality)
