import {Geometry} from 'components/structures/geometry';
import {Point} from 'components/structures/point';
import {defaultSize} from 'components/Tiles/constants';
import {
  ENTERING,
  GRABBED,
  HOVER_MOVE,
  LEAVING,
  DRAW_AWAY_FOR_INSERTION,
  MOVE,
  RESIZE,
  UPDATE_INTRINSIC_GEOMETRY,
} from 'components/Tiles/TileController/constants';
import {Layout} from 'components/Tiles/TileController/layout';
import {Props} from 'components/Tiles/TileController/props';
import {reducer} from 'components/Tiles/TileController/reducer';
import {ResizeGrip} from 'components/Tiles/TileController/resizeGrip';
import {State} from 'components/Tiles/TileController/state';
import {Wrapper} from 'components/Tiles/TileController/wrapper';
import {Action} from 'interfaces/action';
import React, {ReactElement, useCallback, useEffect, useReducer, useState} from 'react';

const initialState: State = {
  geometry: new Geometry(),
  drawingAway: false,
  hovering: false,
};

export const Tile: React.FC<Props> = (props: Props) => {
  const [state, dispatch] = useReducer<typeof reducer>(reducer, initialState);
  const [reference, setReference] = useState<HTMLDivElement | null>(null);
  const {geometry, drawingAway, hovering, hoveringAt} = state;
  const {grabbedAt, shouldDrawAway, onInsertTile, id} = props;

  useEffect(() => {
    // Update the grabbedId status
    dispatch(new Action(GRABBED, grabbedAt));
    if (!grabbedAt)
      return;
    const move = (event: MouseEvent) => {
      // Dispatch a `MOVE' action to move the tile
      dispatch(new Action(MOVE, {x: event.clientX, y: event.clientY}));
    };
    // Install an event listener that will make the tile move
    document.addEventListener('mousemove', move);
    return () => {
      document.removeEventListener('mousemove', move);
    };
  }, [grabbedAt]);

  useEffect(() => {
    if (hoveringAt) {
      const delta = hoveringAt.x - geometry.x;
      if (delta < geometry.width / 3) {
        const timer: number = setTimeout(() => {
          dispatch(new Action(DRAW_AWAY_FOR_INSERTION, true));
        }, 300);
        return () => clearTimeout(timer);
      } else {
        dispatch(new Action(DRAW_AWAY_FOR_INSERTION, false));
      }
    }
  }, [geometry, hoveringAt]);

  const onMouseLeave = () => dispatch(new Action(LEAVING));
  const onMouseMove = (event: MouseEvent) => dispatch(new Action(HOVER_MOVE, Point.fromEvent(event)));
  const onMouseEnter = () => dispatch(new Action(ENTERING));

  const shouldTrackMouse = shouldDrawAway && hovering;
  const addEventListener = useCallback((event: string, handler: any, capture: boolean = false) => {
    if (reference === null)
      return;
    reference.addEventListener(event, handler, capture);
  }, [reference]);

  const removeEventListener = useCallback((event: string, handler: any, capture: boolean = false) => {
    if (reference === null)
      return;
    reference.removeEventListener(event, handler, capture);
  }, [reference]);

  useEffect(() => {
    if (shouldTrackMouse) {
      addEventListener('mousemove', onMouseMove, true);
      return () => {
        removeEventListener('mousemove', onMouseMove, true);
      };
    } else {
      dispatch(new Action(DRAW_AWAY_FOR_INSERTION, false));
    }
  }, [addEventListener, removeEventListener, shouldTrackMouse]);

  useEffect(() => {
    const onInsertTileHelper = () => onInsertTile();
    if (drawingAway) {
      addEventListener('mouseup', onInsertTileHelper);
      return () => {
        removeEventListener('mouseup', onInsertTileHelper);
      };
    }
  }, [addEventListener, removeEventListener, drawingAway, onInsertTile, id]);

  useEffect(() => {
    dispatch({type: UPDATE_INTRINSIC_GEOMETRY, payload: props.geometry});
  }, [props.geometry, id]);

  const style = geometry.toStyle();
  const classes = [
    props.grabbedAt ? 'grabbed' : undefined,
    props.isDocked ? 'docked' : 'floating',
  ];

  const getResizeGrip = (): ReactElement | null => {
    const onResize = (x: number, y: number) => dispatch(new Action(RESIZE, {x, y}));
    if (props.isDocked)
      return null;
    return <ResizeGrip onResize={onResize} size={defaultSize / 24}/>;
  };

  return (
    <Layout
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      ref={setReference} style={style}
      className={classes.join(' ')}>
      <Wrapper moving={drawingAway}>
        {props.children}
      </Wrapper>
      {getResizeGrip()}
    </Layout>
  );
};
