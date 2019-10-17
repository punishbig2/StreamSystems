import {Geometry} from 'components/structures/geometry';
import {Point} from 'components/structures/point';
import {defaultSize} from 'components/Tiles/constants';
import {Layout} from 'components/Tiles/TileController/layout';
import {ResizeGrip} from 'components/Tiles/TileController/resizeGrip';
import {Wrapper} from 'components/Tiles/TileController/wrapper';
import {Action} from 'interfaces/action';
import React, {ReactElement, ReactNode, useEffect, useReducer, useState} from 'react';

interface Props {
  geometry: Geometry;
  isDocked: boolean;
  id: string;
  children: ReactNode;
  grabbedAt?: Point;
  shouldMove: boolean;
  onInsertTile: () => void;
}

interface State {
  geometry: Geometry;
  grabbedAt?: Point;
  hovering: boolean;
  preparedToInsertBefore: boolean;
}

const initialState: State = {
  geometry: new Geometry(),
  preparedToInsertBefore: false,
  hovering: false,
};

const UPDATE_INTRINSIC_GEOMETRY = 'UPDATE_INTRINSIC_GEOMETRY';
const RESIZE = 'RESIZE';
const MOVE = 'MOVE';
const ENTERING = 'ENTERING';
const GRABBED = 'GRABBED';
const LEAVING = 'LEAVING';
const MAKE_ROOM_FOR_INSERTION = 'MAKE_ROOM_FOR_INSERTION';

const move = (state: State, to: Point, offset: Point | undefined): State => {
  const {geometry} = state;
  if (offset === undefined)
    return state;
  return {...state, geometry: geometry.moveTo(to.x - offset.x, to.y - offset.y), grabbedAt: to};
};

const reducer = (state: State, {type, payload}: Action) => {
  const {geometry} = state;
  switch (type) {
    case MOVE:
      return move(state, payload, state.grabbedAt);
    case UPDATE_INTRINSIC_GEOMETRY:
      return {...state, geometry: payload};
    case GRABBED:
      return {...state, grabbedAt: payload};
    case RESIZE:
      return {...state, geometry: geometry.resize(payload.x, payload.y)};
    case ENTERING:
      return {...state, hovering: true};
    case LEAVING:
      return {...state, hovering: false};
    case MAKE_ROOM_FOR_INSERTION:
      return {...state, preparedToInsertBefore: payload};
    default:
      return state;
  }
};

export const TileController: React.FC<Props> = (props: Props) => {
  const [state, dispatch] = useReducer<typeof reducer>(reducer, initialState);
  const [reference, setReference] = useState<HTMLDivElement | null>(null);
  const {geometry, hovering, preparedToInsertBefore} = state;
  const {grabbedAt} = props;

  useEffect(() => {
    // Update the grabbed status
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
    if (reference === null)
      return;
    const onMouseMove = (event: MouseEvent) => {
      const delta = event.clientX - geometry.x;
      if (delta < geometry.width / 3) {
        dispatch(new Action(MAKE_ROOM_FOR_INSERTION, true));
      } else {
        dispatch(new Action(MAKE_ROOM_FOR_INSERTION, false));
      }
    };

    const onMouseReleased = () => {
      if (preparedToInsertBefore) {
        dispatch(new Action(MAKE_ROOM_FOR_INSERTION, false));
        dispatch(new Action(LEAVING));
        props.onInsertTile();
      }
    };

    if (hovering) {
      reference.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseReleased);
      return () => {
        reference.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseReleased);
      };
    } else {
      dispatch(new Action(MAKE_ROOM_FOR_INSERTION, false));
    }
  }, [reference, hovering, geometry, preparedToInsertBefore, props]);

  useEffect(() => {
    dispatch({type: UPDATE_INTRINSIC_GEOMETRY, payload: props.geometry});
  }, [props.geometry, props.id]);

  const getResizeGrip = (): ReactElement | null => {
    const onResize = (x: number, y: number) => dispatch(new Action(RESIZE, {x, y}));
    if (props.isDocked)
      return null;
    return <ResizeGrip onResize={onResize} size={defaultSize / 24}/>;
  };

  useEffect(() => {
    if (reference === null)
      return;
    if (props.shouldMove && props.isDocked) {
      const onMouseEnter = () => dispatch(new Action(ENTERING));
      const onMouseLeave = () => dispatch(new Action(LEAVING));
      reference.addEventListener('mouseleave', onMouseLeave);
      reference.addEventListener('mouseenter', onMouseEnter);
      return () => {
        reference.removeEventListener('mouseleave', onMouseLeave);
        reference.removeEventListener('mouseenter', onMouseEnter);
      };
    }
  }, [props.shouldMove, props.isDocked, props.id, reference]);

  const style = geometry.toStyle();
  const classes = [
    props.grabbedAt ? 'grabbed' : undefined,
    props.isDocked ? 'docked' : 'floating',
  ];

  return (
    <Layout ref={setReference} style={style} className={classes.join(' ')}>
      <Wrapper moving={preparedToInsertBefore}>
        {props.children}
      </Wrapper>
      {getResizeGrip()}
    </Layout>
  );
};
