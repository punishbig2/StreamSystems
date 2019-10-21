import {Geometry} from 'components/structures/geometry';
import {Point} from 'components/structures/point';
import {
  GRAB_TILE,
  INSERT_TILE_BEFORE,
  RELEASE_TILE,
  SET_TILE_DOCKED,
  UPDATE_BOUNDING_BOX, UPDATE_CHILDREN,
} from 'components/Tiles/Grid/constants';
import {Layout} from 'components/Tiles/Grid/layout';
import {Props} from 'components/Tiles/Grid/props';
import {reducer} from 'components/Tiles/Grid/reducer';
import {State} from 'components/Tiles/Grid/state';
import {TileManager} from 'components/Tiles/Grid/tileManager';
import {TileList} from 'components/Tiles/Grid/tileList';
import {Tile} from 'components/Tiles/TileController';
import {Content} from 'components/Tiles/TileController/content';
import {TitleBar} from 'components/Tiles/TileController/TitleBar';
import {Action} from 'interfaces/action';
import React, {Children, ReactNode, useEffect, useLayoutEffect, useReducer, useState} from 'react';

const initialState: State = {
  tiles: new TileManager(),
};

export const Grid: React.FC<Props> = (props: Props) => {
  const [state, dispatch] = useReducer<(state: State, Action: Action) => State>(reducer, initialState);
  const {tiles, grabbedId} = state;
  // Get the child items (all must be tiles)
  const {children} = props;
  // Reference to the container
  const [reference, setReference] = useState<HTMLDivElement | null>(null);

  const tileGrabber = (tile: TileList) => (event: React.MouseEvent) => {
    event.preventDefault();
    // Dispatch the grab action
    dispatch(new Action(GRAB_TILE, {tile, grabbedAt: new Point(event.clientX, event.clientY)}));
  };

  const toggleTileDocked = (tile: TileList) => dispatch(new Action(SET_TILE_DOCKED, {tile, isDocked: !tile.isDocked}));
  // Update the bounding box when it changes
  useLayoutEffect(() => {
    if (reference === null)
      return;
    const onResize = () => {
      dispatch(new Action(UPDATE_BOUNDING_BOX, reference.getBoundingClientRect()));
    };
    onResize();
    // Watch future resize
    window.addEventListener('resize', onResize);
    return () => {
      // Remove the watcher
      window.removeEventListener('resize', onResize);
    };
  }, [reference]);

  useEffect(() => {
    if (grabbedId === undefined)
      return;
    const release = () => dispatch(new Action(RELEASE_TILE, grabbedId));
    // If the user releases the mouse button, we call this
    document.addEventListener('mouseup', release);
    return () => {
      // Remove the listener as it's no longer needed
      document.removeEventListener('mouseup', release);
    };
  }, [grabbedId]);

  const onInsertTile = (tile: TileList) => () => {
    const {insertId} = state;
    if (!insertId)
      return;
    dispatch(new Action(INSERT_TILE_BEFORE, {target: tile.id, source: insertId}));
  };

  useEffect(() => {
    dispatch(new Action(UPDATE_CHILDREN, Children.toArray(children)));
  }, [children]);

  const COLUMN_COUNT: number = 4;
  const getOffsetFrom = (offset: Geometry) => {
    const x = offset.x + offset.width;
    const y = offset.y;
    if (x + offset.width > COLUMN_COUNT * offset.width) {
      return new Geometry(0, y + offset.height, offset.width, offset.height);
    }
    // Return the shifted geometry
    return new Geometry(x, y, offset.width, offset.height);
  };

  const mapper = (tiles: TileManager, fn: (tile: TileList) => ReactNode): ReactNode[] => {
    const {boundingBox} = state;
    if (!boundingBox)
      return [];
    const array: ReactNode[] = new Array<ReactNode>();
    const width: number = boundingBox.width;
    // Initialize the first geometry object (set it to the top left corner)
    let geometry = new Geometry(0, 0, width / COLUMN_COUNT, width / COLUMN_COUNT);
    // Add docking tiles
    let tile: TileList | null = tiles.getFirstDockedTile();
    while (tile) {
      array.push(fn({...tile, geometry}));
      // Update the pointers
      tile = tile.next;
      // Shift the geometry
      geometry = getOffsetFrom(geometry);
    }
    // Add non docked tiles (floating)
    tile = tiles.getFirstFloatingTile();
    while (tile) {
      array.push(fn(tile));
      tile = tile.next;
    }
    console.log(array);
    return array;
  };

  const toTile = (tile: TileList) => {
    const {grabbedId} = state;
    const shouldDrawAway = (grabbedId !== undefined) && tile.isDocked;
    return (
      <Tile
        key={tile.id}
        id={tile.id}
        shouldDrawAway={shouldDrawAway}
        onInsertTile={onInsertTile(tile)}
        grabbedAt={tile.grabbedAt}
        isDocked={tile.isDocked}
        geometry={tile.geometry}>
        <TitleBar
          title={tile.title}
          onToggleDocking={() => toggleTileDocked(tile)}
          onGrab={tileGrabber(tile)}
          isDocked={tile.isDocked}
          onMinimize={() => null}/>
        <Content>
          {tile.content}
          {tile.id}
        </Content>
      </Tile>
    );
  };

  return (
    <Layout ref={setReference}>
      {reference && mapper(tiles, toTile)}
    </Layout>
  );
};


