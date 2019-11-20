import {MessageBlotter} from 'components/MessageBlotter';
import {TOB} from 'components/TOB';
import {Toolbar} from 'components/Toolbar';
import {WindowManager} from 'components/WindowManager';
import {Strategy} from 'interfaces/strategy';
import {User} from 'interfaces/user';
import React, {ReactElement} from 'react';
import {connect} from 'react-redux';
import {Dispatch} from 'redux';
import {addWindow, moveWindow, removeWindow} from 'redux/actions/workspaceActions';
import {ApplicationState} from 'redux/applicationState';
import {WindowTypes} from 'redux/constants/workareaConstants';
import {dynamicStateMapper} from 'redux/dynamicStateMapper';
import {WorkspaceState} from 'redux/stateDefs/workspaceState';

import {store} from 'redux/store';

interface DispatchProps {
  addWindow: (type: WindowTypes) => void;
  updateGeometry: (id: string, geometry: ClientRect) => void;
  removeWindow: (id: string) => void;
}

interface OwnProps {
  id: string;
  // Global row
  symbols: string[],
  products: Strategy[],
  tenors: string[],
}

const mapDispatchToProps = (dispatch: Dispatch, {id}: OwnProps): DispatchProps => ({
  addWindow: (type: WindowTypes) => dispatch(addWindow(id, type)),
  updateGeometry: (windowId: string, geometry: ClientRect) => dispatch(moveWindow(id, windowId, geometry)),
  removeWindow: (windowId: string) => dispatch(removeWindow(id, windowId)),
});

const withRedux: (ignored: any) => any = connect<WorkspaceState, DispatchProps, OwnProps, ApplicationState>(
  dynamicStateMapper<WorkspaceState, OwnProps, ApplicationState>(),
  mapDispatchToProps,
);

type Props = OwnProps & DispatchProps & WorkspaceState;

const createWindow = (id: string, type: WindowTypes, symbols: string[], products: Strategy[], tenors: string[], user: User) => {
  switch (type) {
    case WindowTypes.TOB:
      return <TOB id={id} symbols={symbols} products={products} tenors={tenors} user={user}/>;
    case WindowTypes.MessageBlotter:
      return <MessageBlotter/>;
    default:
      throw new Error(`invalid tile type ${type}`);
  }
};

const Workspace: React.FC<OwnProps> = withRedux((props: Props): ReactElement | null => {
  const {symbols, products, tenors} = props;
  const {auth: {user}} = store.getState();

  const addWindow = (type: WindowTypes) => {
    switch (type) {
      case WindowTypes.TOB:
        props.addWindow(WindowTypes.TOB);
        break;
      case WindowTypes.MessageBlotter:
        props.addWindow(WindowTypes.MessageBlotter);
        break;
      case WindowTypes.Empty:
        props.addWindow(WindowTypes.Empty);
        break;
      default:
        break;
    }
  };

  const renderContent = (id: string, type: WindowTypes): ReactElement | null => {
    if (symbols.length === 0 || tenors.length === 0 || products.length === 0)
      return null;
    return createWindow(id, type, symbols, products, tenors, user);
  };

  return (
    <React.Fragment>
      <Toolbar>
        <button onClick={() => addWindow(WindowTypes.TOB)}>Add POD</button>
        <button onClick={() => addWindow(WindowTypes.MessageBlotter)}>Add Monitor</button>
      </Toolbar>
      <WindowManager
        windows={props.windows}
        renderContent={renderContent}
        onGeometryChange={props.updateGeometry}
        onWindowClosed={props.removeWindow}/>
    </React.Fragment>
  );
});

export {Workspace};
