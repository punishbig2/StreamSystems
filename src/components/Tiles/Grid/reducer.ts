import {
  GRAB_TILE, INSERT_TILE_BEFORE,
  RELEASE_GRABBED_TILE,
  SET_TILE_DOCKED,
  UPDATE_BOUNDING_BOX,
} from 'components/Tiles/Grid/constants';
import {State} from 'components/Tiles/Grid/state';
import {
  insertTileBefore,
  setTileDocked,
  setTileGrabbed,
  setTileReleased,
  updateGeometries,
} from 'components/Tiles/Grid/helpers';
import {Action} from 'interfaces/action';

export const reducer = (state: State, {type, payload}: Action) => {
  switch (type) {
    case UPDATE_BOUNDING_BOX:
      return updateGeometries(state, payload);
    case GRAB_TILE:
      return setTileGrabbed(state, payload);
    case RELEASE_GRABBED_TILE:
      return setTileReleased(state);
    case SET_TILE_DOCKED:
      return setTileDocked(state, payload /* tile, value */);
    case INSERT_TILE_BEFORE:
      return insertTileBefore(state, payload.target, payload.id);
    default:
      return state;
  }
};
