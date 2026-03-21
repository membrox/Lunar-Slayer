#!/usr/bin/env python3
"""
Normalize a spritesheet so that each frame's pixel content is
bottom-centered within a uniform-width cell.

This eliminates "drift" caused by inconsistent frame positioning.

Usage:
    python3 scripts/normalize_spritesheet.py public/Player.png public/Player_normalized.png
"""
import sys
from PIL import Image
import numpy as np


def find_row_groups(alpha, gap_threshold=10):
    """Find groups of rows that contain content, separated by empty gaps."""
    row_has_content = np.any(alpha > 0, axis=1)
    rows = np.where(row_has_content)[0]
    if len(rows) == 0:
        return []

    groups = []
    start = rows[0]
    for i in range(1, len(rows)):
        if rows[i] - rows[i - 1] > gap_threshold:
            groups.append((start, rows[i - 1]))
            start = rows[i]
    groups.append((start, rows[-1]))
    return groups


def find_frame_groups(alpha_row, gap_threshold=5):
    """Find groups of columns that contain content within a row slice."""
    col_has_content = np.any(alpha_row > 0, axis=0)
    cols = np.where(col_has_content)[0]
    if len(cols) == 0:
        return []

    groups = []
    start = cols[0]
    for i in range(1, len(cols)):
        if cols[i] - cols[i - 1] > gap_threshold:
            groups.append((start, cols[i - 1]))
            start = cols[i]
    groups.append((start, cols[-1]))
    return groups


def normalize_spritesheet(input_path, output_path):
    img = Image.open(input_path).convert("RGBA")
    data = np.array(img)
    alpha = data[:, :, 3]
    h, w = alpha.shape

    print(f"Input: {input_path} ({w}x{h})")

    row_groups = find_row_groups(alpha)
    print(f"Found {len(row_groups)} row(s) of sprites")

    # Analyze all frames across all rows
    all_rows_frames = []
    max_content_w = 0
    max_content_h = 0

    for row_idx, (row_top, row_bottom) in enumerate(row_groups):
        row_alpha = alpha[row_top : row_bottom + 1, :]
        frame_cols = find_frame_groups(row_alpha)
        print(f"  Row {row_idx}: y={row_top}-{row_bottom}, {len(frame_cols)} frames")

        frames = []
        for f_idx, (col_left, col_right) in enumerate(frame_cols):
            # Get tight bounding box of content within this frame region
            frame_alpha = alpha[row_top : row_bottom + 1, col_left : col_right + 1]
            content_rows = np.where(np.any(frame_alpha > 0, axis=1))[0]
            content_cols = np.where(np.any(frame_alpha > 0, axis=0))[0]

            if len(content_rows) == 0 or len(content_cols) == 0:
                continue

            # Content bounding box in image coordinates
            content_top = row_top + content_rows[0]
            content_bottom = row_top + content_rows[-1]
            content_left = col_left + content_cols[0]
            content_right = col_left + content_cols[-1]

            content_w = content_right - content_left + 1
            content_h = content_bottom - content_top + 1

            max_content_w = max(max_content_w, content_w)
            max_content_h = max(max_content_h, content_h)

            frames.append(
                {
                    "idx": f_idx,
                    "content_box": (
                        content_left,
                        content_top,
                        content_right,
                        content_bottom,
                    ),
                    "content_w": content_w,
                    "content_h": content_h,
                }
            )

        all_rows_frames.append(frames)

    # Add some padding
    cell_w = max_content_w + 4  # 2px padding each side
    cell_h = max_content_h + 4

    # Make cell_w even for clean division
    if cell_w % 2 != 0:
        cell_w += 1

    num_cols = max(len(frames) for frames in all_rows_frames)
    num_rows = len(all_rows_frames)

    out_w = cell_w * num_cols
    out_h = cell_h * num_rows

    print(f"\nNormalized cell size: {cell_w}x{cell_h}")
    print(f"Output grid: {num_cols} cols x {num_rows} rows = {out_w}x{out_h}")

    # Create output image
    out_img = Image.new("RGBA", (out_w, out_h), (0, 0, 0, 0))

    for row_idx, frames in enumerate(all_rows_frames):
        for frame in frames:
            cl, ct, cr, cb = frame["content_box"]
            content = img.crop((cl, ct, cr + 1, cb + 1))
            cw, ch = content.size

            # Bottom-center the content within the cell
            dest_x = (row_idx * 0) + frame["idx"] * cell_w + (cell_w - cw) // 2
            dest_y = row_idx * cell_h + (cell_h - ch)  # bottom-aligned

            out_img.paste(content, (dest_x, dest_y))

    out_img.save(output_path)
    print(f"\nSaved: {output_path} ({out_w}x{out_h})")
    print(f"frameWidth: {cell_w}, frameHeight: {cell_h}")
    print(f"Frames per row: {num_cols}")

    return cell_w, cell_h, num_cols, num_rows


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(f"Usage: {sys.argv[0]} <input.png> <output.png>")
        sys.exit(1)

    normalize_spritesheet(sys.argv[1], sys.argv[2])
