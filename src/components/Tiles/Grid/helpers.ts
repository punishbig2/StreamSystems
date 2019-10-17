import {Point} from 'components/structures/point';
import {State} from 'components/Tiles/Grid/state';
import {TileState} from 'components/Tiles/Grid/tileState';
import {SyntheticEvent} from 'react';

export const setTileDocked = (state: State, {tile, isDocked}: { tile: TileState, isDocked: boolean }): State => {
  const {tiles} = state;
  // Create a NEW substitute for the target tile
  const substitute: TileState = {...tile, isDocked};
  // Create a new state with a new tiles manager
  return {...state, tiles: tiles.replace(tile, substitute)};
};

export const updateGeometries = (state: State, rectangle: ClientRect): State => {
  const {tiles} = state;
  return {...state, tiles: tiles.updateGeometries(rectangle.width)};
};

export const setTileGrabbed = (state: State, {tile, grabbedAt}: { tile: TileState, grabbedAt: Point }): State => {
  const {tiles} = state;
  // Create a NEW substitute tile
  const substitute: TileState = {...tile, grabbedAt, isDocked: false};
  // Create a new state with a new tiles manager
  return {...state, tiles: tiles.replace(tile, substitute), grabbed: substitute};
};

export const setTileReleased = (state: State): State => {
  const {tiles} = state;
  const tile: TileState | undefined = state.grabbed;
  if (tile === undefined)
    throw new Error('you cannot release a tile, there is no grabbed tile');
  // Build a new state from the changes
  return {...state, tiles: tiles.replace(tile, {...tile, grabbedAt: undefined}), grabbed: undefined};
};

export const ignoreAndRun = (callback: (event: SyntheticEvent) => void) => (event: SyntheticEvent) => {
  event.stopPropagation();
  // Now run
  callback(event);
};

export const insertTileBefore = (state: State, target: TileState, sourceId: string): State => {
  const {tiles} = state;
  return {...state, tiles: tiles.insertBefore(target, tiles.findTileByIdOrCreate(sourceId))};
};
