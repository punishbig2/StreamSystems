import {Point} from 'components/structures/point';
import {TileList} from 'components/Tiles/Grid/tileList';
import {Geometry} from 'components/structures/geometry';
import {ReactElement, ReactNode} from 'react';

const compare = (tile: TileList, other: TileList): boolean => {
  if (tile.id !== other.id)
    return false;
  if (tile.isDocked !== other.isDocked)
    return false;
  if (tile.grabbedAt !== other.grabbedAt)
    return false;
  if (tile.geometry !== other.geometry)
    return false;
  return tile.title === other.title;

};

class Tile implements TileList {
  public content: ReactNode;
  public geometry: Geometry;
  public grabbedAt?: Point;
  public id: string;
  public isDocked: boolean;
  public next: TileList | null;
  public prev: TileList | null;
  public readyToInsertBefore: boolean;
  public title: (props: any) => ReactElement;

  constructor(node: ReactElement) {
    const {title, id} = node.props;
    this.id = id;
    this.geometry = new Geometry();
    this.isDocked = true;
    this.readyToInsertBefore = false;
    this.title = title;
    this.content = node;
    this.next = null;
    this.prev = null;
  }
}

class List {
  public static remove = (list: TileList | null, tile: TileList): TileList | null => {
    if (tile === null)
      throw new Error('removeFromList(): invalid `tile\' parameter `null\'');
    if (list === null)
      return list;
    const next: TileList | null = tile.next;
    const prev: TileList | null = tile.prev;
    // Unlink the removed tile
    tile.next = null;
    tile.prev = null;
    if (next)
      next.prev = prev;
    if (prev === null) {
      return next;
    } else {
      prev.next = next;
    }
    // Return the original head
    return list;
  };

  public static replace = (list: TileList | null, oldTile: TileList, newTile: TileList): TileList | null => {
    const prev: TileList | null = oldTile.prev;
    const next: TileList | null = oldTile.next;
    console.log(List.toString(list));
    newTile.prev = prev;
    newTile.next = next;
    if (next)
      next.prev = newTile;
    if (prev) {
      prev.next = newTile;
    } else {
      return newTile;
    }
    return list;
  };

  public static insert = (list: TileList | null, cursor: TileList, tile: TileList): TileList => {
    if (list === null)
      return tile;
    const prev: TileList | null = cursor.prev;
    tile.prev = prev;
    tile.next = cursor;
    // Link target tile back
    cursor.prev = tile;
    if (prev) {
      prev.next = tile;
    } else {
      return tile;
    }
    return list;
  };

  public static add = (list: TileList | null, tile: TileList): TileList | null => {
    if (list)
      list.prev = tile;
    tile.next = list;
    return tile;
  };

  public static toString = (list: TileList | null) => {
    const nodes: string[] = [];
    let cursor: TileList | null = list;
    while (cursor !== null) {
      nodes.push(cursor.id);
      cursor = cursor.next;
    }
    nodes.push('null');
    return nodes.join(' => ');
  };

}

export class TileManager {
  private readonly map: Map<string, TileList>;
  private floating: TileList | null;
  private docked: TileList | null;

  constructor(
    map: Map<string, TileList> = new Map<string, TileList>(),
    docked: TileList | null = null,
    floating: TileList | null = null,
  ) {
    this.docked = docked;
    this.map = map;
    this.floating = floating;
  }

  public fromReactNodeArray = (nodes: ReactNode[]): TileManager => {
    const {map} = this;
    const manager: TileManager = new TileManager();
    // Traverse all the nodes and create new elements or update existing ones
    nodes.forEach((node: ReactNode) => {
      const element = node as ReactElement;
      const {props} = element;
      // Get the original tile if any
      const getExistingOrCreate = (id: string): TileList => {
        const existing: TileList | undefined = map.get(id);
        if (existing === undefined) {
          return new Tile(element);
        } else {
          return {...existing, next: null, prev: null};
        }
      };
      // Add a new tile
      const tile: TileList = getExistingOrCreate(props.id);
      // Add a reference to the linked list
      manager.addDockedTile(tile);
      if (tile.isDocked) {
        manager.register(tile);
      }
    });
    return manager;
  };

  public register = (tile: TileList) => {
    const {map} = this;
    if (map.has(tile.id))
      throw new Error('attempting to add the same tile again, this must be a bug');
    map.set(tile.id, tile);
  };

  public getFirstDockedTile = (): TileList | null => this.docked;
  public getFirstFloatingTile = (): TileList | null => this.floating;

  private addDockedTile = (tile: TileList) => {
    this.docked = List.add(this.docked, tile);
  };

  public insertBefore = (target: TileList, tile: TileList): TileManager => {
    const clone: TileManager = new TileManager(this.map, this.docked, this.floating);
    // Remove the tile from the floating list
    clone.floating = List.remove(clone.floating, tile);
    // Insert the tile at a given point
    clone.docked = List.insert(clone.docked, target, {...tile, isDocked: true, grabbedAt: undefined});
    return clone;
  };

  public replace = (oldTile: TileList, newTile: TileList): TileManager => {
    const {map} = this;
    if (oldTile.id !== newTile.id)
      throw new Error('you are not supposed to swap tiles with this method');

    console.log(List.toString(this.docked));
    if (compare(oldTile, newTile))
      return this;
    // Clone the map
    const mapClone = new Map<string, TileList>(map.entries());
    // Create a new object to replace the reference
    const clone: TileManager = new TileManager(mapClone, this.docked, this.floating);
    if (oldTile.isDocked) {
      clone.floating = List.replace(clone.floating, oldTile, newTile);
    } else {
      clone.docked = List.replace(clone.docked, oldTile, newTile);
    }
    // If the tile was docked/un-docked update the linked lists
    if (oldTile.isDocked !== newTile.isDocked) {
      if (!newTile.isDocked) {
        clone.floating = List.add(clone.floating, newTile);
        clone.docked = List.remove(clone.docked, oldTile);
      }
    }
    // Delete from the map the old tile
    mapClone.delete(oldTile.id);
    // Replace the tile in the map with the new one
    mapClone.set(oldTile.id, newTile);
    // Return the replacement
    return clone;
  };

  public get = (id: string): TileList => {
    const {map} = this;
    if (!map.has(id))
      throw new Error(`tile with id \`${id}' not found in the map`);
    return map.get(id) as TileList;
  };
}
