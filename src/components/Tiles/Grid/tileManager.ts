import {TileState} from 'components/Tiles/Grid/tileState';
import {Geometry} from 'components/structures/geometry';

const COLUMN_COUNT: number = 4;

export class TileManager {
  private readonly map: Map<string | number | symbol, TileState>;
  private head: TileState | null;
  private unitWidth: number;

  constructor(map: Map<string | number | symbol, TileState> = new Map<string | number | symbol, TileState>()) {
    this.unitWidth = window.innerWidth / COLUMN_COUNT;
    this.map = map;
    this.head = null;
  }

  private add = (target: TileState) => {
    if (this.head === null) {
      this.head = target;
    } else {
      let cursor: TileState = this.head;
      while (cursor.next !== null)
        cursor = cursor.next;
      cursor.next = target;
      target.prev = cursor;
    }
  };

  public insertBefore = (target: TileState, tile: TileState): TileManager => {
    const replacement: TileManager = new TileManager(this.map);
    const prev: TileState | null = target.prev;
    // If there was tile before the target tile, now it's next
    // will be the new tile
    if (prev !== null) {
      replacement.head = this.head;
      prev.next = tile;
    } else {
      replacement.head = tile;
    }
    // Set inserted tile's neighbors
    tile.next = target;
    tile.prev = prev;
    // This tile is docked now
    tile.isDocked = true;
    tile.grabbedAt = undefined;
    // The target tile is now after the new inserted one
    target.prev = tile;
    // Ensure we have copied the linked list to the
    // new object
    // Update geometries and yet generate a new object
    return replacement.updateGeometries();
  };

  public replace = (tile: TileState, substitute: TileState): TileManager => {
    const {map, head} = this;
    if (tile.id !== substitute.id) {
      throw new Error('you are not supposed to swap tiles with this method');
    }
    // Clone the map
    const mapClone = new Map<string | number | symbol, TileState>(map.entries());
    // Create a new object to replace the reference
    const replacement: TileManager = new TileManager(mapClone);
    // If the tile was docked/un-docked update the linked list
    if (tile.isDocked !== substitute.isDocked) {
      // If tile was un-docked remove it from the linked list
      if (!substitute.isDocked) {
        const prev: TileState | null = substitute.prev;
        const next: TileState | null = substitute.next;
        if (prev !== null)
          prev.next = next;
        if (next != null)
          next.prev = prev;
        // Unlink the substitute that will replace
        substitute.prev = null;
        substitute.next = null;
      } else {
        this.add(substitute);
      }
    }
    // Delete from the map the old tile
    mapClone.delete(tile.id);
    // Replace the tile in the map with the new one
    mapClone.set(tile.id, substitute);
    // Don't change the head
    replacement.head = head;
    // Return the replacement
    return replacement.updateGeometries();
  };

  public updateGeometries = (width?: number): TileManager => {
    const replacement = new TileManager(this.map);
    // Update the "unit width"
    this.unitWidth = width !== undefined ? width / COLUMN_COUNT - 1 : this.unitWidth;
    // Now use this value
    const {unitWidth} = this;
    let tile = this.head;
    while (tile) {
      if (!tile.isDocked)
        throw new Error('a tile must be docked to be in the list');
      const prev: TileState | null = tile.prev;
      if (prev === null) {
        tile.geometry = new Geometry(0, 0, unitWidth, unitWidth);
      } else {
        const {geometry} = prev;
        const overflows: boolean = geometry.x + 2 * unitWidth > COLUMN_COUNT * unitWidth;
        const x: number = overflows ? 0 : geometry.x + unitWidth;
        const y: number = overflows ? geometry.y + unitWidth : geometry.y;
        // Ok just this time, alter the object in place
        tile.geometry = new Geometry(x, y, unitWidth, unitWidth);
      }
      tile = tile.next;
    }
    replacement.head = this.head;
    return replacement;
  };

  public findTileByIdOrCreate = (key: string | number | symbol): TileState => {
    const {map} = this;
    if (map.has(key) === false) {
      const tile: TileState = {
        id: key,
        geometry: new Geometry(),
        isDocked: true,
        readyToInsertBefore: false,
        next: null,
        prev: null,
      };
      // Register the tile to the manager ...
      map.set(key, tile);
      // Link the previous tile
      this.add(tile);
    }
    // We are 100% sure that this exists ...
    return map.get(key) as TileState;
  };
}
