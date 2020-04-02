import { WindowManager } from 'components/WindowManager';
import { Currency } from 'interfaces/currency';
import { Strategy } from 'interfaces/strategy';
import { User, UserWorkspace } from 'interfaces/user';
import React, { ReactElement, useEffect, useState } from 'react';
import { WindowTypes } from 'redux/constants/workareaConstants';
import { STRM } from 'redux/stateDefs/workspaceState';
import { ModalWindow } from 'components/ModalWindow';
import { UserProfileModal } from 'components/Workspace/UserProfileForm';
import { ErrorBox } from 'components/ErrorBox';
import { ExecutionBanner } from 'components/ExecutionBanner';
import { observer } from 'mobx-react';
import { WorkspaceStore } from 'mobx/stores/workspace';
import { MenuItem, Select } from '@material-ui/core';
import { SelectEventData } from 'interfaces/selectEventData';
import { createWindow } from 'components/Workspace/createWindow';

interface OwnProps {
  id: string;
  user: User;
  // Global internalRow
  symbols: Currency[];
  products: Strategy[];
  tenors: string[];
  connected: boolean;
  banks: string[];
  userProfile: UserWorkspace;
  isDefault: boolean;
  visible: boolean;
  onModify: (id: string) => void;
}

const Workspace: React.FC<OwnProps> = (props: OwnProps): ReactElement | null => {
  const { id, user } = props;
  const [store, setStore] = useState<WorkspaceStore | null>(null);

  useEffect(() => {
    setStore(new WorkspaceStore(id));
  }, [id]);

  useEffect(() => {
    if (store !== null) {
      // Fist hydrate the store
      store.loadMarkets();
    }
  }, [store]);

  if (store === null)
    return null;
  /*const {personality, id: workspaceID} = props;
  const {setWindowTitle, showToast} = store;

  const renderContent = useCallback(, [connected, personality, products, setWindowTitle, symbols, tenors, user, workspaceID]);

  const

  useEffect(() => {
    const errorListener = (event: CustomEvent<string>) => {
      showToast(event.detail);
    };
    document.addEventListener('workspace-error', errorListener as EventListener);
    return () => {
      document.removeEventListener('workspace-error', errorListener as EventListener);
    };
  }, [workspaceID, showToast]);

  const ;*/

  const onPersonalityChange = ({ target }: React.ChangeEvent<SelectEventData>) => {
    store.setPersonality(target.value as string);
  };

  const renderContent = (wID: string, type: WindowTypes): ReactElement | null => {
    const { symbols, tenors, products, connected } = props;
    const { personality } = store;
    if (symbols.length === 0 || tenors.length === 0 || products.length === 0)
      return <div>no content</div>;
    return createWindow(wID, type, id, symbols, products, tenors, connected, user, personality);
  };

  const getRightPanelButtons = (): ReactElement | null => {
    if (user.isbroker) {
      const { markets } = store;
      const renderValue = (value: unknown): React.ReactNode => {
        return value as string;
      };
      if (markets.length === 0) return null;
      return (
        <div className={'broker-buttons'}>
          <Select value={store.personality} autoWidth={true} renderValue={renderValue}
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
          <button onClick={() => store.superRefAll()}>
            <i className={'fa fa-eraser'}/> Ref ALL
          </button>
          <button onClick={store.showUserProfileModal}>
            <i className={'fa fa-user'}/> User Prof
          </button>
        </div>
      );
    } else {
      return (
        <div className={'broker-buttons'}>
          <button onClick={store.showUserProfileModal}>
            <i className={'fa fa-user'}/> User Prof
          </button>
        </div>
      );
    }
  };

  const onAddPodTile = () => {
    props.onModify(id);
    store.addWindow(WindowTypes.PodTile);
  };

  const onAddMessageBlotterTile = () => {
    props.onModify(id);
    store.addWindow(WindowTypes.MessageBlotter);
  };

  const render = () => {
    return (
      <div className={props.visible ? 'visible' : 'invisible'}>
        <div className={'toolbar'}>
          <div className={'content'}>
            <button onClick={onAddPodTile}>
              <i className={'fa fa-plus'}/> Add POD
            </button>
            <button onClick={onAddMessageBlotterTile}>
              <i className={'fa fa-eye'}/> Add Blotter
            </button>
            <ExecutionBanner/>
            {getRightPanelButtons()}
          </div>
        </div>
        <WindowManager
          connected={props.connected}
          user={props.user}
          isDefaultWorkspace={props.isDefault}
          toast={store.toast}
          renderContent={renderContent}
          windows={store.windows}
          personality={store.personality}
          onLayoutModify={() => props.onModify(id)}
          onClearToast={() => store.showToast(null)}
          onUpdateAllGeometries={store.updateAllGeometries}
          onWindowClose={store.removeWindow}/>
        <ModalWindow render={() => (<UserProfileModal onCancel={store.hideUserProfileModal} user={user}/>)}
                     visible={store.isUserProfileModalVisible}/>
        <ModalWindow
          render={() => (
            <ErrorBox title={'Oops, there was an error'} message={store.errorMessage as string}
                      onClose={store.hideErrorModal}/>
          )}
          visible={store.errorMessage !== null}/>
      </div>
    );
  };
  return render();
};

const observed = observer(Workspace);
export { observed as Workspace };
