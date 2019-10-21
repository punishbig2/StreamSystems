import {Geometry} from 'components/structures/geometry';
import {
  GRAB_TILE, INSERT_TILE_BEFORE,
  RELEASE_TILE,
  SET_TILE_DOCKED,
  UPDATE_BOUNDING_BOX, UPDATE_CHILDREN,
} from 'components/Tiles/Grid/constants';
import {State} from 'components/Tiles/Grid/state';
import {
  insertTileBefore,
  setTileDocked,
  setTileGrabbed,
  setTileReleased,
} from 'components/Tiles/Grid/helpers';
import {TileList} from 'components/Tiles/Grid/tileList';
import {Action} from 'interfaces/action';

const getTileId = ({tile}: { tile: TileList }): string => tile.id;

export const reducer = (state: State, {type, payload}: Action): State => {
  const {tiles} = state;
  switch (type) {
    case UPDATE_BOUNDING_BOX:
      return {...state, boundingBox: Geometry.fromClientRect(payload)};
    case RELEASE_TILE:
      return {...state, tiles: setTileReleased(tiles, payload), grabbedId: undefined, insertId: undefined};
    case GRAB_TILE:
      return {
        ...state,
        tiles: setTileGrabbed(tiles, payload),
        grabbedId: getTileId(payload),
        insertId: getTileId(payload),
      };
    case SET_TILE_DOCKED:
      return {...state, tiles: setTileDocked(tiles, payload)};
    case INSERT_TILE_BEFORE:
      console.log(state);
      if (!state.insertId)
        throw new Error('there is no tile to insert');
      return {...state, tiles: insertTileBefore(tiles, payload), insertId: undefined};
    case UPDATE_CHILDREN:
      return {...state, tiles: tiles.fromReactNodeArray(payload)};
    default:
      return state;
  }
};
