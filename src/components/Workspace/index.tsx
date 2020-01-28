import {MenuItem, Select} from '@material-ui/core';
import {MessageBlotter} from 'components/MessageBlotter';
import {BlotterTypes} from 'redux/constants/messageBlotterConstants';
import {TOB} from 'components/TOB';
import {WindowManager} from 'components/WindowManager';
import {Currency} from 'interfaces/currency';
import {Strategy} from 'interfaces/strategy';
import {TOBRowStatus} from 'interfaces/tobRow';
import {User} from 'interfaces/user';
import React, {ReactElement, useCallback, useEffect, ReactNode} from 'react';
import {connect} from 'react-redux';
import {Dispatch} from 'redux';
import {
  addWindow,
  bringToFront,
  loadMarkets,
  minimizeWindow,
  moveWindow,
  removeWindow,
  restoreWindow,
  setToast,
  setWindowAutoSize,
  setWindowTitle,
  toolbarHide,
  toolbarShow,
  toolbarTogglePin,
  toolbarTryShow,
  setPersonality,
  showUserProfileModal,
  closeUserProfileModal,
  closeErrorModal,
  refAll,
} from 'redux/actions/workspaceActions';
import {ApplicationState} from 'redux/applicationState';
import {WindowTypes} from 'redux/constants/workareaConstants';
import {dynamicStateMapper} from 'redux/dynamicStateMapper';
import {WorkspaceState, STRM} from 'redux/stateDefs/workspaceState';

import {getAuthenticatedUser} from 'utils/getCurrentUser';
import {SelectEventData} from 'interfaces/selectEventData';
import {ModalWindow} from 'components/ModalWindow';
import {UserProfileModal} from 'components/Workspace/UserProfileForm';
import {ErrorBox} from 'components/ErrorBox';

interface DispatchProps {
  addWindow: (type: WindowTypes) => void;
  updateGeometry: (id: string, geometry: ClientRect, resized: boolean) => void;
  removeWindow: (id: string) => void;
  minimizeWindow: (id: string) => void;
  restoreWindow: (id: string) => void;
  setWindowTitle: (id: string, title: string) => void;
  bringToFront: (id: string) => void;
  setWindowAutoSize: (id: string) => void;
  showToast: (message: string | null) => void;
  toolbarTryShow: () => void;
  toolbarHide: () => void;
  toolbarShow: () => void;
  toolbarTogglePin: () => void;
  loadMarkets: () => void;
  setPersonality: (personality: string) => void;
  showUserProfileModal: () => void;
  closeUserProfileModal: () => void;
  refAll: () => void;
  closeErrorModal: () => void;
}

interface OwnProps {
  id: string;
  // Global row
  symbols: Currency[];
  products: Strategy[];
  tenors: string[];
  connected: boolean;
  banks: string[];
}

const cache: { [key: string]: DispatchProps } = {};
const mapDispatchToProps = (
  dispatch: Dispatch,
  {id}: OwnProps,
): DispatchProps => {
  if (!cache[id]) {
    cache[id] = {
      addWindow: (type: WindowTypes) => dispatch(addWindow(id, type)),
      updateGeometry: (
        windowId: string,
        geometry: ClientRect,
        resized: boolean,
      ) => dispatch(moveWindow(id, windowId, geometry, resized)),
      removeWindow: (windowId: string) => dispatch(removeWindow(id, windowId)),
      minimizeWindow: (windowId: string) =>
        dispatch(minimizeWindow(id, windowId)),
      restoreWindow: (windowId: string) =>
        dispatch(restoreWindow(id, windowId)),
      setWindowTitle: (windowId: string, title: string) =>
        dispatch(setWindowTitle(id, windowId, title)),
      bringToFront: (windowId: string) => dispatch(bringToFront(id, windowId)),
      setWindowAutoSize: (windowId: string) =>
        dispatch(setWindowAutoSize(id, windowId)),
      showToast: (message: string | null) => dispatch(setToast(id, message)),
      toolbarShow: () => dispatch(toolbarShow(id)),
      toolbarTryShow: () => dispatch(toolbarTryShow(id)),
      toolbarHide: () => dispatch(toolbarHide(id)),
      toolbarTogglePin: () => dispatch(toolbarTogglePin(id)),
      loadMarkets: () => dispatch(loadMarkets(id)),
      setPersonality: (personality: string) =>
        dispatch(setPersonality(id, personality)),
      showUserProfileModal: () => dispatch(showUserProfileModal(id)),
      closeUserProfileModal: () => dispatch(closeUserProfileModal(id)),
      refAll: () => dispatch(refAll(id)),
      closeErrorModal: () => dispatch(closeErrorModal(id)),
    };
  }
  return cache[id];
};

const withRedux: (ignored: any) => any = connect<WorkspaceState,
  DispatchProps,
  OwnProps,
  ApplicationState>(
  dynamicStateMapper<WorkspaceState, OwnProps, ApplicationState>(),
  mapDispatchToProps,
);

type Props = OwnProps & DispatchProps & WorkspaceState;

const createWindow = (
  id: string,
  type: WindowTypes,
  symbols: Currency[],
  products: Strategy[],
  tenors: string[],
  connected: boolean,
  user: User,
  setWindowTitle: (id: string, title: string) => void,
  onRowError: (status: TOBRowStatus) => void,
  personality: string,
) => {
  switch (type) {
    case WindowTypes.TOB:
      return (
        <TOB
          id={id}
          symbols={symbols}
          products={products}
          tenors={tenors}
          user={user}
          connected={connected}
          setWindowTitle={setWindowTitle}
          onRowError={onRowError}
          personality={personality}
        />
      );
    case WindowTypes.MessageBlotter:
      return (
        <MessageBlotter
          id={id}
          setWindowTitle={setWindowTitle}
          connected={connected}
          personality={personality}
          blotterType={BlotterTypes.Regular}
        />
      );
    default:
      throw new Error(`invalid tile type ${type}`);
  }
};

const objectToCssClass = (object: any, base: string) => {
  const classes: string[] = [base];
  for (const key of Object.getOwnPropertyNames(object)) {
    if (object[key]) {
      classes.push(key);
    }
  }
  return classes.join(' ');
};

const Workspace: React.FC<Props> = (props: Props): ReactElement | null => {
  const {toolbarState} = props;
  const {symbols, products, tenors, connected} = props;
  const {toolbarTryShow, toolbarShow, toolbarHide, toolbarTogglePin} = props;
  const {showToast, setWindowTitle, loadMarkets} = props;

  const user: User = getAuthenticatedUser();

  const onMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.clientY < 48) {
      if (toolbarState.hovering && !toolbarState.visible) return;
      toolbarTryShow();
    } else {
      toolbarHide();
    }
  };

  const onMouseLeave = () => {
    props.toolbarHide();
  };

  useEffect(() => {
    loadMarkets();
  }, [loadMarkets]);

  useEffect(() => {
    if (!toolbarState.hovering) return;
    const timer = setTimeout(() => {
      toolbarShow();
    }, 1500);
    // Of the mouse is clicked then we may want to do something else
    // like grab a window so cancel the visibility trigger
    document.addEventListener('mousedown', toolbarHide, true);
    // Also cancel if the mouse goes out of the page
    document.addEventListener('mouseleave', toolbarHide, true);
    return () => {
      document.removeEventListener('mouseleave', toolbarHide, true);
      document.removeEventListener('mousedown', toolbarHide, true);
      clearTimeout(timer);
    };
  }, [toolbarHide, toolbarShow, toolbarState.hovering]);

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

  const onRowError = useCallback(
    (status: TOBRowStatus) => {
      switch (status) {
        case TOBRowStatus.Normal:
          break;
        case TOBRowStatus.InvertedMarketsError:
          showToast('Inverted Markets Not Allowed');
          break;
        case TOBRowStatus.NegativePrice:
          showToast('Negative Prices Not Allowed');
          break;
        case TOBRowStatus.IncompleteError:
          break;
        case TOBRowStatus.CreatingOrder:
          break;
      }
    },
    [showToast],
  );

  const renderContent = (
    id: string,
    type: WindowTypes,
  ): ReactElement | null => {
    const {personality} = props;
    if (symbols.length === 0 || tenors.length === 0 || products.length === 0)
      return null;
    return createWindow(
      id,
      type,
      symbols,
      products,
      tenors,
      connected,
      user,
      setWindowTitle,
      onRowError,
      personality,
    );
  };

  const onPersonalityChange = ({
                                 target,
                               }: React.ChangeEvent<SelectEventData>) => {
    props.setPersonality(target.value as string);
  };

  const getBrokerButtons = (): ReactNode => {
    const user: User = getAuthenticatedUser();
    if (user.isbroker) {
      const {markets} = props;
      const renderValue = (value: unknown): React.ReactNode => {
        return value as string;
      };
      if (markets.length === 0) return null;
      return (
        <div className={'broker-buttons'}>
          <Select
            value={props.personality}
            autoWidth={true}
            renderValue={renderValue}
            onChange={onPersonalityChange}
          >
            <MenuItem key={STRM} value={STRM}>
              None
            </MenuItem>
            {markets.map((market: string) => (
              <MenuItem key={market} value={market}>
                {market}
              </MenuItem>
            ))}
          </Select>
          <button onClick={props.refAll}>
            <i className={'fa fa-eraser'}/> Ref ALL
          </button>
          <button onClick={props.showUserProfileModal}>
            <i className={'fa fa-user'}/> User Prof
          </button>
        </div>
      );
    } else {
      return null;
    }
  };

  return (
    <>
      <div
        className={objectToCssClass(toolbarState, 'toolbar')}
        onMouseLeave={onMouseLeave}
      >
        <div className={'content'}>
          <button onClick={() => addWindow(WindowTypes.TOB)}>
            <i className={'fa fa-plus'}/> Add POD
          </button>
          <button onClick={() => addWindow(WindowTypes.MessageBlotter)}>
            <i className={'fa fa-eye'}/> Add Blotter
          </button>
          {getBrokerButtons()}
          <div className={'pin'} onClick={toolbarTogglePin}>
            <i
              className={
                'fa ' + (toolbarState.pinned ? 'fa-lock' : 'fa-unlock')
              }
            />
          </div>
        </div>
      </div>
      <WindowManager
        toast={props.toast}
        renderContent={renderContent}
        windows={props.windows}
        toolbarPinned={toolbarState.pinned}
        connected={connected}
        personality={props.personality}
        onClearToast={() => props.showToast(null)}
        onMouseMove={onMouseMove}
        onSetWindowTitle={props.setWindowTitle}
        onGeometryChange={props.updateGeometry}
        onWindowClosed={props.removeWindow}
        onWindowMinimized={props.minimizeWindow}
        onWindowRestored={props.restoreWindow}
        onWindowClicked={props.bringToFront}
        onWindowSizeAdjusted={props.setWindowAutoSize}
      />
      <ModalWindow
        render={() => (
          <UserProfileModal onCancel={props.closeUserProfileModal}/>
        )}
        visible={props.isUserProfileModalVisible}
      />
      <ModalWindow
        render={() => (
          <ErrorBox
            title={'Oops, there was an error'}
            message={props.errorMessage as string}
            onClose={props.closeErrorModal}
          />
        )}
        visible={props.errorMessage !== null}
      />
    </>
  );
};

const connected = withRedux(Workspace);
export {connected as Workspace};
