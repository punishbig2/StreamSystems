import {MessageBlotter} from 'components/MessageBlotter';
import {TOB} from 'components/TOB';
import {WindowManager} from 'components/WindowManager';
import {Currency} from 'interfaces/currency';
import {Strategy} from 'interfaces/strategy';
import {TOBRowStatus} from 'interfaces/tobRow';
import {User} from 'interfaces/user';
import React, {ReactElement, useCallback, useEffect, useState} from 'react';
import {connect} from 'react-redux';
import {Dispatch} from 'redux';
import {
  addWindow,
  bringToFront,
  minimizeWindow,
  moveWindow,
  removeWindow,
  restoreWindow,
  setToast,
  setWindowAutoSize,
  setWindowTitle,
} from 'redux/actions/workspaceActions';
import {ApplicationState} from 'redux/applicationState';
import {WindowTypes} from 'redux/constants/workareaConstants';
import {dynamicStateMapper} from 'redux/dynamicStateMapper';
import {WorkspaceState} from 'redux/stateDefs/workspaceState';

import {getAuthenticatedUser} from 'utils/getCurrentUser';

interface DispatchProps {
  addWindow: (type: WindowTypes) => void;
  updateGeometry: (id: string, geometry: ClientRect) => void;
  removeWindow: (id: string) => void;
  minimizeWindow: (id: string) => void;
  restoreWindow: (id: string) => void;
  setWindowTitle: (id: string, title: string) => void;
  bringToFront: (id: string) => void;
  setWindowAutoSize: (id: string) => void;
  showToast: (message: string | null) => void;
}

interface OwnProps {
  id: string;
  // Global row
  symbols: Currency[],
  products: Strategy[],
  tenors: string[],
  connected: boolean;
}

const mapDispatchToProps = (dispatch: Dispatch, {id}: OwnProps): DispatchProps => ({
  addWindow: (type: WindowTypes) => dispatch(addWindow(id, type)),
  updateGeometry: (windowId: string, geometry: ClientRect) => dispatch(moveWindow(id, windowId, geometry)),
  removeWindow: (windowId: string) => dispatch(removeWindow(id, windowId)),
  minimizeWindow: (windowId: string) => dispatch(minimizeWindow(id, windowId)),
  restoreWindow: (windowId: string) => dispatch(restoreWindow(id, windowId)),
  setWindowTitle: (windowId: string, title: string) => dispatch(setWindowTitle(id, windowId, title)),
  bringToFront: (windowId: string) => dispatch(bringToFront(id, windowId)),
  setWindowAutoSize: (windowId: string) => dispatch(setWindowAutoSize(id, windowId)),
  showToast: (message: string | null) => dispatch(setToast(id, message)),
});

const withRedux: (ignored: any) => any = connect<WorkspaceState, DispatchProps, OwnProps, ApplicationState>(
  dynamicStateMapper<WorkspaceState, OwnProps, ApplicationState>(),
  mapDispatchToProps,
);

type Props = OwnProps & DispatchProps & WorkspaceState;

const createWindow = (id: string,
                      type: WindowTypes,
                      symbols: Currency[],
                      products: Strategy[],
                      tenors: string[],
                      user: User, setWindowTitle: (id: string, title: string) => void,
                      onRowError: (status: TOBRowStatus) => void) => {

  switch (type) {
    case WindowTypes.TOB:
      return <TOB id={id} symbols={symbols} products={products} tenors={tenors} user={user}
                  setWindowTitle={setWindowTitle} onRowError={onRowError}/>;
    case WindowTypes.MessageBlotter:
      return <MessageBlotter id={id} setWindowTitle={setWindowTitle}/>;
    default:
      throw new Error(`invalid tile type ${type}`);
  }
};

interface ToolbarState {
  hovering: boolean;
  visible: boolean;
}

const Workspace: React.FC<OwnProps> = withRedux((props: Props): ReactElement | null => {
  const [toolbarState, setToolbarState] = useState<ToolbarState>({hovering: false, visible: false});
  const {symbols, products, tenors} = props;
  const {showToast} = props;
  const user: User = getAuthenticatedUser();

  const onMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.clientY < 48) {
      setToolbarState({hovering: true, visible: false});
    } else {
      setToolbarState({hovering: false, visible: false});
    }
  };

  const onMouseLeave = () => {
    setToolbarState({hovering: false, visible: false});
  };

  useEffect(() => {
    if (!toolbarState.hovering)
      return;
    const timer = setTimeout(() => {
      setToolbarState({hovering: false, visible: true});
    }, 1500);
    const forceCancel = () => setToolbarState({hovering: false, visible: false});
    // Of the mouse is clicked then we may want to do something else
    // like grab a window so cancel the visibility trigger
    document.addEventListener('mousedown', forceCancel, true);
    // Also cancel if the mouse goes out of the page
    document.addEventListener('mouseleave', forceCancel, true);
    return () => {
      document.removeEventListener('mouseleave', forceCancel, true);
      document.removeEventListener('mousedown', forceCancel, true);
      clearTimeout(timer);
    };
  }, [toolbarState.hovering]);

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

  const onRowError = useCallback((status: TOBRowStatus) => {
    switch (status) {
      case TOBRowStatus.Normal:
        break;
      case TOBRowStatus.InvertedMarketsError:
        showToast('Inverted Markets Not Allowed');
        break;
      case TOBRowStatus.IncompleteError:
        break;
      case TOBRowStatus.CreatingOrder:
        break;
    }
  }, [showToast]);

  const renderContent = (id: string, type: WindowTypes): ReactElement | null => {
    if (symbols.length === 0 || tenors.length === 0 || products.length === 0)
      return null;
    return createWindow(id, type, symbols, products, tenors, user, props.setWindowTitle, onRowError);
  };

  const toolbarClasses = ['toolbar'];
  if (toolbarState.visible)
    toolbarClasses.push('visible');
  if (toolbarState.hovering)
    toolbarClasses.push('hovering');

  return (
    <>
      <div className={toolbarClasses.join(' ')} onMouseLeave={onMouseLeave}>
        <div className={'content'}>
          <button onClick={() => addWindow(WindowTypes.TOB)}>Add POD</button>
          <button onClick={() => addWindow(WindowTypes.MessageBlotter)}>Add Monitor</button>
        </div>
      </div>
      <WindowManager
        toast={props.toast}
        renderContent={renderContent}
        windows={props.windows}
        onClearToast={() => props.showToast(null)}
        onMouseMove={onMouseMove}
        onSetWindowTitle={props.setWindowTitle}
        onGeometryChange={props.updateGeometry}
        onWindowClosed={props.removeWindow}
        onWindowMinimized={props.minimizeWindow}
        onWindowRestored={props.restoreWindow}
        onWindowClicked={props.bringToFront}
        onWindowSizeAdjusted={props.setWindowAutoSize}/>
    </>
  );
});

export {Workspace};
