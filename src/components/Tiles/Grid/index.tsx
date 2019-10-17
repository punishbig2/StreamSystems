import {Point} from 'components/structures/point';
import {
  GRAB_TILE,
  INSERT_TILE_BEFORE,
  RELEASE_GRABBED_TILE,
  SET_TILE_DOCKED,
  UPDATE_BOUNDING_BOX,
} from 'components/Tiles/Grid/constants';
import {Layout} from 'components/Tiles/Grid/layout';
import {Props} from 'components/Tiles/Grid/props';
import {reducer} from 'components/Tiles/Grid/reducer';
import {State} from 'components/Tiles/Grid/state';
import {TileManager} from 'components/Tiles/Grid/tileManager';
import {TileState} from 'components/Tiles/Grid/tileState';
import {TileController} from 'components/Tiles/TileController';
import {Content} from 'components/Tiles/TileController/content';
import {TitleBar} from 'components/Tiles/TileController/TitleBar';
import {Action} from 'interfaces/action';
import React, {Children, ReactElement, ReactNode, useEffect, useLayoutEffect, useReducer, useState} from 'react';

const initialState: State = {
  tiles: new TileManager(),
};

export const Grid: React.FC<Props> = (props: Props) => {
  const [state, dispatch] = useReducer<typeof reducer>(reducer, initialState);
  const {tiles, grabbed} = state;
  // Get the child items (all must be tiles)
  const {children} = props;
  // Reference to the container
  const [reference, setReference] = useState<HTMLDivElement | null>(null);

  const tileGrabber = (tile: TileState) => (event: React.MouseEvent) => {
    event.preventDefault();
    // Dispatch the grab action
    dispatch(new Action(GRAB_TILE, {tile, grabbedAt: new Point(event.clientX, event.clientY)}));
  };

  const toggleTileDocked = (tile: TileState) => dispatch(new Action(SET_TILE_DOCKED, {tile, isDocked: !tile.isDocked}));
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

  // If a tile is "grabbed" by the mouse install DOM event handlers on it
  // to allow it to move and to undock it.
  useEffect(() => {
    if (grabbed === undefined)
      return;
    const release = () => dispatch(new Action(RELEASE_GRABBED_TILE));
    // Call this function to undock the tile on first movement
    // Install an event listener to release the tile when the mouse
    // is released
    document.addEventListener('mouseup', release);
    return () => {
      // Always cleanup, memory leaks and dangling handlers cause many
      // bugs.
      document.removeEventListener('mouseup', release);
    };
  }, [grabbed]);

  const mapChildren = (child: ReactNode) => {
    const {props: childProps} = child as ReactElement;
    const {grabbed} = state;
    // Get the inherited id
    const id: string = childProps.id;
    // We have one tile per child and if it doesn't yet exist we register it
    // immediately
    const tile: TileState = tiles.findTileByIdOrCreate(id);
    const onInsertTile = () => {
      if (grabbed === undefined)
        throw new Error('attempted to insert a non-grabbed tile');
      dispatch(new Action(INSERT_TILE_BEFORE, {target: tile, id: grabbed.id}));
    };
    const shouldMove = !!grabbed;
    const unwrap = ({geometry, grabbedAt, isDocked}: TileState) => ({geometry, grabbedAt, isDocked});
    return (
      <TileController key={id} id={id} shouldMove={shouldMove} onInsertTile={onInsertTile} {...unwrap(tile)}>
        <TitleBar
          title={childProps.title}
          onToggleDocking={() => toggleTileDocked(tile)}
          onGrab={tileGrabber(tile)}
          isDocked={tile.isDocked}
          onMinimize={() => null}/>
        {/* we don't mess with the actual content */}
        <Content>{child}</Content>
      </TileController>
    );
  };

  return (
    <Layout ref={setReference}>
      {reference && Children.map(children, mapChildren)}
    </Layout>
  );
};


