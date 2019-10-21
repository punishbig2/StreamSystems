import {Point} from 'components/structures/point';
import {TileManager} from 'components/Tiles/Grid/tileManager';
import {TileList} from 'components/Tiles/Grid/tileList';
import {SyntheticEvent} from 'react';

export const setTileDocked = (tiles: TileManager, data: { tile: TileList, isDocked: boolean }): TileManager => {
  const {tile, isDocked} = data;
  // Create a NEW substitute for the target tile
  const substitute: TileList = {...tile, isDocked};
  // Create a new state with a new tiles manager
  return tiles.replace(tile, substitute);
};

export const setTileGrabbed = (tiles: TileManager, data: { tile: TileList, grabbedAt: Point }): TileManager => {
  const {tile, grabbedAt} = data;
  // Create a NEW substitute tile
  const substitute: TileList = {...tile, grabbedAt, isDocked: false};
  // Create a new state with a new tiles manager
  return tiles.replace(tile, substitute);
};

export const setTileReleased = (tiles: TileManager, id: string): TileManager => {
  const tile = tiles.get(id);
  return tiles.replace(tile, {...tile, grabbedAt: undefined});
};

export const swallowEvent = (callback: (event: SyntheticEvent) => void) => (event: SyntheticEvent) => {
  event.stopPropagation();
  callback(event);
};

export const insertTileBefore = (tiles: TileManager, data: { target: string, source: string }): TileManager => {
  return tiles.insertBefore(tiles.get(data.target), tiles.get(data.source));
};
