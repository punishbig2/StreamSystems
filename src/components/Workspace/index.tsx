import { WindowManager } from 'components/WindowManager';
import { User, UserWorkspace } from 'interfaces/user';
import React, { ReactElement, useEffect, useState } from 'react';
import { WindowTypes } from 'redux/constants/workareaConstants';
import { STRM } from 'redux/stateDefs/workspaceState';
import { ModalWindow } from 'components/ModalWindow';
import { UserProfileModal } from 'components/Workspace/UserProfile';
import { ErrorBox } from 'components/ErrorBox';
import { ExecutionBanner } from 'components/ExecutionBanner';
import { observer } from 'mobx-react';
import { WorkspaceStore } from 'mobx/stores/workspaceStore';
import { MenuItem, Select } from '@material-ui/core';
import { SelectEventData } from 'interfaces/selectEventData';
import { Currency } from 'interfaces/currency';
import { PodTileStore } from 'mobx/stores/podTileStore';
import { MessagesStore } from 'mobx/stores/messagesStore';
import { PodTile } from 'components/PodTile';
import { MessageBlotter } from 'components/MessageBlotter';
import { BlotterTypes } from 'redux/constants/messageBlotterConstants';
import { PodTileTitle } from 'components/PodTile/title';

interface OwnProps {
  id: string;
  user: User;
  tenors: string[];
  currencies: Currency[];
  strategies: string[];
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
  const onPersonalityChange = ({ target }: React.ChangeEvent<SelectEventData>) => {
    store.setPersonality(target.value as string);
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

  const getContentRenderer = (id: string, type: WindowTypes) => {
    switch (type) {
      case WindowTypes.PodTile:
        return (contentProps: any, contentStore: PodTileStore | MessagesStore | null) => {
          if (contentStore instanceof PodTileStore) {
            return (
              <PodTile id={id}
                       personality={store.personality}
                       connected={props.connected}
                       store={contentStore}
                       currencies={props.currencies}
                       strategies={props.strategies}
                       tenors={props.tenors}
                       user={props.user}
                       {...contentProps}/>
            );
          } else {
            throw new Error('invalid type of store specified');
          }
        };
      case WindowTypes.MessageBlotter:
        return (contentProps: any, contentStore: PodTileStore | MessagesStore | null) => {
          if (contentStore instanceof MessagesStore) {
            return (
              <MessageBlotter id={id}
                              personality={store.personality}
                              blotterType={BlotterTypes.Regular}
                              connected={props.connected}
                              user={props.user}
                              {...contentProps}/>
            );
          } else {
            throw new Error('invalid type of store specified');
          }
        };
    }
    throw new Error('invalid type of window specified');
  };

  const getTitleRenderer = (id: string, type: WindowTypes) => {
    switch (type) {
      case WindowTypes.PodTile:
        return (contentProps: any, contentStore: PodTileStore | MessagesStore | null) => {
          if (contentStore instanceof PodTileStore) {
            return <PodTileTitle strategies={props.strategies} currencies={props.currencies} store={contentStore}/>;
          } else {
            throw new Error('invalid type of store specified');
          }
        };
      case WindowTypes.MessageBlotter:
        return (contentProps: any, contentStore: PodTileStore | MessagesStore | null) => (
          <h1>Blotter</h1>
        );
    }
    return () => null;
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
          user={props.user}
          connected={props.connected}
          isDefaultWorkspace={props.isDefault}
          toast={store.toast}
          windows={store.windows}
          getTitleRenderer={getTitleRenderer}
          getContentRenderer={getContentRenderer}
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
