import type { Particle } from './types';

/**
 * Spatial hash grid for O(n) neighbor lookups instead of O(n²).
 * Supports toroidal wrapping — particles near edges correctly find
 * neighbors on the opposite side of the world.
 */
export class SpatialHash {
  private cellSize: number;
  private grid: Map<number, Particle[]>;
  private cellsW: number = 0;
  private cellsH: number = 0;

  // Reusable result buffer to avoid per-call allocations
  private resultBuffer: Particle[] = [];

  constructor(cellSize: number) {
    this.cellSize = Math.max(cellSize, 1);
    this.grid = new Map();
  }

  /** Set world dimensions for toroidal cell wrapping */
  setWorldSize(w: number, h: number) {
    this.cellsW = Math.max(1, Math.ceil(w / this.cellSize));
    this.cellsH = Math.max(1, Math.ceil(h / this.cellSize));
  }

  clear() {
    this.grid.clear();
  }

  private key(cx: number, cy: number): number {
    // Pack two 16-bit ints into one number — avoids string keys
    return ((cx & 0xffff) << 16) | (cy & 0xffff);
  }

  add(p: Particle) {
    const cx = Math.floor(p.x / this.cellSize);
    const cy = Math.floor(p.y / this.cellSize);
    const k = this.key(cx, cy);
    let list = this.grid.get(k);
    if (!list) {
      list = [];
      this.grid.set(k, list);
    }
    list.push(p);
  }

  /**
   * Get particles near (x, y), wrapping toroidally.
   * Returns a shared buffer — caller must consume before next call.
   */
  getNearby(x: number, y: number): Particle[] {
    const cx = Math.floor(x / this.cellSize);
    const cy = Math.floor(y / this.cellSize);
    const buf = this.resultBuffer;
    buf.length = 0;

    const cw = this.cellsW;
    const ch = this.cellsH;

    for (let dx = -1; dx <= 1; dx++) {
      // Toroidal cell wrap
      let ncx = cx + dx;
      if (ncx < 0) ncx += cw;
      else if (ncx >= cw) ncx -= cw;

      for (let dy = -1; dy <= 1; dy++) {
        let ncy = cy + dy;
        if (ncy < 0) ncy += ch;
        else if (ncy >= ch) ncy -= ch;

        const list = this.grid.get(this.key(ncx, ncy));
        if (list) {
          for (let i = 0; i < list.length; i++) buf.push(list[i]);
        }
      }
    }
    return buf;
  }
}
