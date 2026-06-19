#!/usr/bin/env python3
"""Build per-row WebP strips from a PNG frame sequence.

Strips are horizontal atlases consumed by the rotation-viewer.js widget.
The strip layout must match the viewer's data-strip-* attributes:
  - data-strip-rows  = rows * x_strips
  - data-strip-frames = cols // x_strips
  - data-x-strips    = x_strips

Usage:
  # Dragon: 24x24 grid, x-strips=2 → 48 strip files of 12 frames each
  python3 scripts/build_strips.py \
    --frames ~/Desktop/Projects/VkRay/outputs/frames-dragon \
    --out assets/imgs/strips/dragon \
    --rows 24 --cols 24 --x-strips 2 --width 900

  # Lucy: 1x48 grid, x-strips=1 → 1 strip file of 48 frames
  python3 scripts/build_strips.py \
    --frames ~/Desktop/Projects/VkRay/outputs/frames-lucy \
    --out assets/imgs/strips/lucy \
    --rows 1 --cols 48 --width 900

  # Armadillo: 3x24 grid, x-strips=2 → 6 strip files of 12 frames each
  # Incremental: skip strips where no frame is newer than the existing strip file
  python3 scripts/build_strips.py \
    --frames ~/Desktop/Projects/VkRay/outputs/frames \
    --out assets/imgs/strips/armadillo \
    --rows 3 --cols 24 --x-strips 2 --width 828 --quality 90 --incremental
"""
import argparse
import os
import sys
from PIL import Image


def strip_needs_rebuild(strip_path, frame_paths):
    """Rebuild if the strip is missing or any of its frame files is newer than it."""
    if not os.path.exists(strip_path):
        return True
    strip_mtime = os.path.getmtime(strip_path)
    for path in frame_paths:
        if os.path.exists(path) and os.path.getmtime(path) > strip_mtime:
            return True
    return False


def build_strips(frames_dir, out_dir, rows, cols, x_strips, frame_width, quality=85, incremental=False):
    frames_dir = os.path.expanduser(frames_dir)
    os.makedirs(out_dir, exist_ok=True)

    sample_path = os.path.join(frames_dir, 'frame_00000.png')
    if not os.path.exists(sample_path):
        sys.exit(f'Error: {sample_path} not found')

    sample = Image.open(sample_path)
    sw, sh = sample.size
    frame_height = round(frame_width * sh / sw)

    if rows is None:
        n_frames = sum(1 for f in os.listdir(frames_dir) if f.startswith('frame_') and f.endswith('.png'))
        rows = -(-n_frames // cols)  # ceil division
        print(f'Auto-detected {n_frames} frames → {rows} y-rows')

    frames_per_strip = cols // x_strips
    total_strips = rows * x_strips

    print(f'Source: {sw}x{sh}  →  frame: {frame_width}x{frame_height}')
    print(f'Grid: {rows} y-rows × {cols} x-cols  (x-strips={x_strips})')
    print(f'Strips: {total_strips} files × {frames_per_strip} frames  =  {frame_width * frames_per_strip}x{frame_height} each')
    print()

    black_frame = None

    for i in range(total_strips):
        yr = i // x_strips
        xi_half = i % x_strips
        frame_start = yr * cols + xi_half * frames_per_strip

        frame_paths = [
            os.path.join(frames_dir, f'frame_{frame_start + col:05d}.png')
            for col in range(frames_per_strip)
        ]
        out_path = os.path.join(out_dir, f'strip_{i:02d}.webp')

        if incremental and not strip_needs_rebuild(out_path, frame_paths):
            print(f'  [{i + 1:2d}/{total_strips}] strip_{i:02d}.webp  skipped (up to date)')
            continue

        strip = Image.new('RGB', (frame_width * frames_per_strip, frame_height))
        for col, path in enumerate(frame_paths):
            if os.path.exists(path):
                frame = Image.open(path).convert('RGB')
                frame = frame.resize((frame_width, frame_height), Image.LANCZOS)
            else:
                if black_frame is None:
                    black_frame = Image.new('RGB', (frame_width, frame_height), (0, 0, 0))
                frame = black_frame
            strip.paste(frame, (col * frame_width, 0))

        strip.save(out_path, 'WEBP', quality=quality, method=6)
        size_kb = os.path.getsize(out_path) // 1024
        print(f'  [{i + 1:2d}/{total_strips}] strip_{i:02d}.webp  {size_kb} KB')

    print('\nDone.')


if __name__ == '__main__':
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--frames',      required=True,      help='Directory of frame_NNNNN.png files')
    ap.add_argument('--out',         required=True,      help='Output directory for strip_NN.webp files')
    ap.add_argument('--rows',        type=int, default=None,  help='Number of Y positions (auto-detected from frame count if omitted)')
    ap.add_argument('--cols',        type=int, required=True, help='Total X positions (cols / x-strips = frames per strip)')
    ap.add_argument('--x-strips',    type=int, default=1,     help='Strip files per y-row (default 1); must divide cols evenly')
    ap.add_argument('--width',       type=int, default=900,   help='Output width per frame in px (default 900)')
    ap.add_argument('--quality',     type=int, default=85,    help='WebP quality 1-100 (default 85)')
    ap.add_argument('--incremental', action='store_true',     help='Skip strips where no frame file is newer than the existing strip')
    a = ap.parse_args()
    if a.cols % a.x_strips != 0:
        sys.exit(f'Error: --cols ({a.cols}) must be divisible by --x-strips ({a.x_strips})')
    build_strips(a.frames, a.out, a.rows, a.cols, a.x_strips, a.width, a.quality, a.incremental)
