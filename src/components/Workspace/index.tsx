import {HTMLSelect} from '@blueprintjs/core';
import {MessageBlotter} from 'components/MessageBlotter';
import {TOBTile} from 'components/TOBTile';
import {Toolbar} from 'components/Toolbar';
import {WindowManager} from 'components/WindowManager';
import {Strategy} from 'interfaces/strategy';
import {User} from 'interfaces/user';
import {Window} from 'interfaces/window';
import strings from 'locales';
import React, {ReactElement, useEffect, useReducer} from 'react';
import {connect} from 'react-redux';
import {Dispatch} from 'redux';
import {Action} from 'redux/action';
import {createAction} from 'redux/actionCreator';
import {addWindow, moveWindow} from 'redux/actions/workspaceActions';
import {ApplicationState} from 'redux/applicationState';
import {WindowTypes} from 'redux/constants/workareaConstants';
import {dynamicStateMapper} from 'redux/dynamicStateMapper';
import {WorkspaceState} from 'redux/stateDefs/workspaceState';

interface DispatchProps {
  addWindow: (type: WindowTypes) => void;
  updateGeometry: (id: string, geometry: ClientRect) => void;
}

interface OwnProps {
  id: string;
  // Global row
  symbols: string[],
  products: Strategy[],
  tenors: string[],
  // FIXME: should be filled from the authentication process
  user: User;
}

const mapDispatchToProps = (dispatch: Dispatch, {id}: OwnProps): DispatchProps => ({
  addWindow: (type: WindowTypes) => dispatch(addWindow(id, type)),
  updateGeometry: (windowId: string, geometry: ClientRect) => dispatch(moveWindow(id, windowId, geometry)),
});

const withRedux: (ignored: any) => any = connect<WorkspaceState, DispatchProps, OwnProps, ApplicationState>(
  dynamicStateMapper<WorkspaceState, ApplicationState>(),
  mapDispatchToProps,
);

type Props = OwnProps & DispatchProps & WorkspaceState;

const SetElements: string = 'SetElements';

type TilesMap = { [id: string]: ReactElement };

interface CacheState {
  renderedWindows: TilesMap;
}

const reducer = (state: CacheState, {type, data}: Action<string>): CacheState => {
  if (type === SetElements) {
    return {...state, renderedWindows: data};
  } else {
    return state;
  }
};

const createTile = (tile: Window, symbols: string[], products: Strategy[], tenors: string[], user: User) => {
  switch (tile.type) {
    case WindowTypes.TOB:
      return <TOBTile id={tile.id} symbols={symbols} products={products} tenors={tenors} user={user}/>;
    case WindowTypes.MessageBlotter:
      return <MessageBlotter user={user}/>;
    default:
      throw new Error(`invalid tile type ${tile.type}`);
  }
};

const Workspace: React.FC<OwnProps> = withRedux((props: Props): ReactElement | null => {
  const [state, dispatch] = useReducer<typeof reducer>(reducer, {renderedWindows: {}});
  const {windows, symbols, products, tenors, user} = props;
  useEffect(() => {
    if (!windows)
      return;
    const entries: [string, Window][] = Object.entries(windows);
    const items: TilesMap = entries.reduce((items: TilesMap, [key, tile]: [string, Window]): TilesMap => {
      // Make this seekable via the id
      items[key] = createTile(tile, symbols, products, tenors, user);
      // Return the accumulator
      return items;
    }, {});
    // When we're done
    dispatch(createAction(SetElements, items));
  }, [windows, symbols, products, tenors, user]);

  const addWindow = ({target: {value}}: { target: HTMLSelectElement }) => {
    switch (value) {
      case '1':
        props.addWindow(WindowTypes.TOB);
        break;
      case '2':
        props.addWindow(WindowTypes.MessageBlotter);
        break;
      case '3':
        props.addWindow(WindowTypes.Empty);
        break;
      default:
        break;
    }
  };

  const renderWindow = (window: Window): ReactElement => {
    return state.renderedWindows[window.id];
  };

  return (
    <React.Fragment>
      <Toolbar>
        <HTMLSelect value={-1} onChange={addWindow}>
          <option value={-1} disabled>{strings.AddNewWindow}</option>
          <option value={1}>TOB Window</option>
          <option value={2}>Message Blotter</option>
        </HTMLSelect>
      </Toolbar>
      <WindowManager windows={props.windows} renderWindow={renderWindow} onGeometryChange={props.updateGeometry}/>
    </React.Fragment>
  );
});

export {Workspace};
