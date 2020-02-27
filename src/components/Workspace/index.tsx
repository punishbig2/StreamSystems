import {MenuItem, Select, FormControlLabel, Checkbox, FormControl} from '@material-ui/core';
import {MessageBlotter} from 'components/MessageBlotter';
import {BlotterTypes} from 'redux/constants/messageBlotterConstants';
import {PodTile} from 'components/PodTile';
import {WindowManager} from 'components/WindowManager';
import {Currency} from 'interfaces/currency';
import {Strategy} from 'interfaces/strategy';
import {User, UserProfile} from 'interfaces/user';
import React, {ReactElement, useEffect, ReactNode, useCallback} from 'react';
import {connect, MapStateToProps} from 'react-redux';
import {Dispatch} from 'redux';
import {
  addWindow,
  bringToFront,
  loadMarkets,
  minimizeWindow,
  moveWindow,
  removeWindow,
  restoreWindow,
  showToast,
  setWindowAutoSize,
  setWindowTitle,
  setPersonality,
  showUserProfileModal,
  closeUserProfileModal,
  closeErrorModal,
  refAll,
} from 'redux/actions/workspaceActions';
import {ApplicationState} from 'redux/applicationState';
import {WindowTypes} from 'redux/constants/workareaConstants';
import {WorkspaceState, STRM} from 'redux/stateDefs/workspaceState';

import {getAuthenticatedUser} from 'utils/getCurrentUser';
import {SelectEventData} from 'interfaces/selectEventData';
import {ModalWindow} from 'components/ModalWindow';
import {UserProfileModal} from 'components/Workspace/UserProfileForm';
import {ErrorBox} from 'components/ErrorBox';
import {saveUserProfile} from 'redux/actions/userProfileActions';
import {ExecutionBanner} from 'components/ExecutionBanner';

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
  loadMarkets: () => void;
  setPersonality: (personality: string) => void;
  showUserProfileModal: () => void;
  closeUserProfileModal: () => void;
  refAll: (personality: string) => void;
  closeErrorModal: () => void;
  saveUserProfile: (useremail: string, newProfile: UserProfile) => void;
}

interface OwnProps {
  id: string;
  // Global internalRow
  symbols: Currency[];
  products: Strategy[];
  tenors: string[];
  connected: boolean;
  banks: string[];
  userProfile: UserProfile;
}

const cache: { [key: string]: DispatchProps } = {};
const mapDispatchToProps = (dispatch: Dispatch, {id}: OwnProps): DispatchProps => {
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
      showToast: (message: string | null) => dispatch(showToast(id, message)),
      loadMarkets: () => dispatch(loadMarkets(id)),
      setPersonality: (personality: string) =>
        dispatch(setPersonality(id, personality)),
      showUserProfileModal: () => dispatch(showUserProfileModal(id)),
      closeUserProfileModal: () => dispatch(closeUserProfileModal(id)),
      refAll: (personality: string) => dispatch(refAll(id, personality)),
      closeErrorModal: () => dispatch(closeErrorModal(id)),
      saveUserProfile: (useremail: string, profile: UserProfile) => dispatch(saveUserProfile(useremail, profile)),
    };
  }
  return cache[id];
};

const mapStateToProps: MapStateToProps<WorkspaceState, OwnProps, ApplicationState> =
  ({workarea}: ApplicationState, ownProps: OwnProps) => workarea.workspaces[ownProps.id];

const withRedux: (ignored: any) => any = connect<WorkspaceState, DispatchProps, OwnProps, ApplicationState>(
  mapStateToProps,
  mapDispatchToProps,
);

type Props = OwnProps & DispatchProps & WorkspaceState;

const createWindow = (windowID: string, workspaceID: string, type: WindowTypes, symbols: Currency[], products: Strategy[], tenors: string[], connected: boolean, user: User, personality: string) => {
  switch (type) {
    case WindowTypes.Empty:
      return null;
    case WindowTypes.PodTile:
      return (
        <PodTile
          id={windowID}
          workspaceID={workspaceID}
          symbols={symbols}
          products={products}
          tenors={tenors}
          user={user}
          connected={connected}
          personality={personality}/>
      );
    case WindowTypes.MessageBlotter:
      return (
        <MessageBlotter
          id={windowID}
          setWindowTitle={(id: string, title: string) => null}
          connected={connected}
          personality={personality}
          blotterType={BlotterTypes.Regular}/>
      );
    default:
      throw new Error(`invalid tile type ${type}`);
  }
};

const Workspace: React.FC<Props> = (props: Props): ReactElement | null => {
  const {symbols, products, tenors, connected} = props;
  const {loadMarkets} = props;

  const user: User = getAuthenticatedUser();

  useEffect(() => {
    loadMarkets();
  }, [loadMarkets]);

  const addWindow = (type: WindowTypes) => {
    switch (type) {
      case WindowTypes.PodTile:
        props.addWindow(WindowTypes.PodTile);
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

  const {personality, id: workspaceID} = props;
  const renderContent = useCallback((windowID: string, type: WindowTypes): ReactElement | null => {
    if (symbols.length === 0 || tenors.length === 0 || products.length === 0)
      return null;
    // Return the new window
    return createWindow(windowID, workspaceID, type, symbols, products, tenors, connected, user, personality);
  }, [connected, personality, products, symbols, tenors, user, workspaceID]);

  const onPersonalityChange = ({target}: React.ChangeEvent<SelectEventData>) => {
    props.setPersonality(target.value as string);
  };

  const {showToast} = props;
  useEffect(() => {
    const errorListener = (event: CustomEvent<string>) => {
      showToast(event.detail);
    };
    document.addEventListener('workspace-error', errorListener as EventListener);
    return () => {
      document.removeEventListener('workspace-error', errorListener as EventListener);
    };
  }, [workspaceID, showToast]);

  const getRightPanelButtons = (): ReactNode => {
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
            onChange={onPersonalityChange}>
            <MenuItem key={STRM} value={STRM}>
              None
            </MenuItem>
            {markets.map((market: string) => (
              <MenuItem key={market} value={market}>
                {market}
              </MenuItem>
            ))}
          </Select>
          <button onClick={() => props.refAll(props.personality)}>
            <i className={'fa fa-eraser'}/> Ref ALL
          </button>
          <button onClick={props.showUserProfileModal}>
            <i className={'fa fa-user'}/> User Prof
          </button>
        </div>
      );
    } else {
      const {userProfile} = props;
      const onOCOChange = ({currentTarget: input}: React.ChangeEvent<HTMLInputElement>) => {
        props.saveUserProfile(user.email, {...userProfile, oco: input.checked});
      };
      return (
        <div className={'broker-buttons'}>
          <FormControl>
            <FormControlLabel
              control={
                <Checkbox
                  id={'oco'}
                  checked={userProfile.oco}
                  name={'oco'}
                  onChange={onOCOChange}/>
              }
              label={'OCO Enabled'}/>
          </FormControl>
        </div>
      );
    }
  };

  return (
    <>
      <div className={'toolbar'}>
        <div className={'content'}>
          <button onClick={() => addWindow(WindowTypes.PodTile)}>
            <i className={'fa fa-plus'}/> Add POD
          </button>
          <button onClick={() => addWindow(WindowTypes.MessageBlotter)}>
            <i className={'fa fa-eye'}/> Add Blotter
          </button>
          <ExecutionBanner/>
          {getRightPanelButtons()}
        </div>
      </div>
      <WindowManager
        toast={props.toast}
        renderContent={renderContent}
        windows={props.windows}
        connected={connected}
        personality={props.personality}
        onClearToast={() => props.showToast(null)}
        onSetWindowTitle={props.setWindowTitle}
        onGeometryChange={props.updateGeometry}
        onWindowClosed={props.removeWindow}
        onWindowMinimized={props.minimizeWindow}
        onWindowRestored={props.restoreWindow}
        onWindowClicked={props.bringToFront}
        onWindowSizeAdjusted={props.setWindowAutoSize}/>
      <ModalWindow render={() => (<UserProfileModal onCancel={props.closeUserProfileModal}/>)}
                   visible={props.isUserProfileModalVisible}/>
      <ModalWindow
        render={() => (
          <ErrorBox
            title={'Oops, there was an error'}
            message={props.errorMessage as string}
            onClose={props.closeErrorModal}/>
        )}
        visible={props.errorMessage !== null}/>
    </>
  );
};

const connected = withRedux(Workspace);
export {connected as Workspace};
