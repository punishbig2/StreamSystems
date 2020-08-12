import { MenuItem, Select } from "@material-ui/core";
import { BlotterTypes } from "columns/messageBlotter";
import { CommissionRates } from "components/CommissionRates";
import { ErrorBox } from "components/ErrorBox";
import { ExecutionBanner } from "components/ExecutionBanner";
import { MessageBlotter } from "components/MessageBlotter";
import { ModalWindow } from "components/ModalWindow";
import { PodTile } from "components/PodTile";
import { PodTileTitle } from "components/PodTile/title";
import { ProgressView } from "components/progressView";
import { WindowManager } from "components/WindowManager";
import { UserProfileModal } from "components/Workspace/UserProfile";
import strings from "locales";
import { observer } from "mobx-react";
import { MessagesStore } from "mobx/stores/messagesStore";
import { PodTileStore } from "mobx/stores/podTileStore";
import workareaStore, { WindowTypes } from "mobx/stores/workareaStore";
import { WorkspaceStore } from "mobx/stores/workspaceStore";
import React, { ReactElement, useEffect, useState } from "react";
import { STRM } from "stateDefs/workspaceState";
import { SelectEventData } from "types/selectEventData";
import { Strategy } from "types/strategy";
import { Symbol } from "types/symbol";
import { User } from "types/user";

interface Props {
  readonly id: string;
  readonly tenors: ReadonlyArray<string>;
  readonly currencies: ReadonlyArray<Symbol>;
  readonly strategies: ReadonlyArray<Strategy>;
  readonly banks: ReadonlyArray<string>;
  readonly isDefault: boolean;
  readonly visible: boolean;
  readonly onModify: (id: string) => void;
}

const Workspace: React.FC<Props> = (props: Props): ReactElement | null => {
  const { id } = props;
  const [store, setStore] = useState<WorkspaceStore | null>(null);

  useEffect(() => {
    setStore(new WorkspaceStore(id));
  }, [id]);

  if (store === null) return null;
  const onPersonalityChange = ({
    target,
  }: React.ChangeEvent<SelectEventData>) => {
    store.setPersonality(target.value as string);
  };

  const getRightPanelButtons = (): ReactElement | null => {
    const user: User = workareaStore.user;
    if (user.isbroker) {
      const { banks } = workareaStore;
      const renderValue = (value: unknown): React.ReactNode => {
        return value as string;
      };
      if (banks.length === 0) return null;
      return (
        <div className={"broker-buttons"}>
          <Select
            value={workareaStore.personality}
            autoWidth={true}
            renderValue={renderValue}
            onChange={onPersonalityChange}
          >
            <MenuItem key={STRM} value={STRM}>
              None
            </MenuItem>
            {banks.map((market: string) => (
              <MenuItem key={market} value={market}>
                {market}
              </MenuItem>
            ))}
          </Select>
          <button onClick={() => store.superRefAll()}>
            <i className={"fa fa-eraser"} /> Ref ALL
          </button>
          <button onClick={store.showUserProfileModal}>
            <i className={"fa fa-user"} /> User Prof
          </button>
        </div>
      );
    } else {
      return (
        <div className={"broker-buttons"}>
          <button onClick={store.showUserProfileModal}>
            <i className={"fa fa-user"} /> User Prof
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
        return (
          contentProps: any,
          contentStore: PodTileStore | MessagesStore | null
        ) => {
          if (contentStore instanceof PodTileStore) {
            return (
              <PodTile
                id={id}
                store={contentStore}
                currencies={props.currencies}
                strategies={props.strategies}
                tenors={props.tenors}
                {...contentProps}
              />
            );
          } else {
            throw new Error("invalid type of store specified");
          }
        };
      case WindowTypes.MessageBlotter:
        return (
          contentProps: any,
          contentStore: PodTileStore | MessagesStore | null
        ) => {
          if (contentStore instanceof MessagesStore) {
            return (
              <MessageBlotter
                id={id}
                blotterType={BlotterTypes.Regular}
                {...contentProps}
              />
            );
          } else {
            throw new Error("invalid type of store specified");
          }
        };
    }
    throw new Error("invalid type of window specified");
  };

  const getTitleRenderer = (id: string, type: WindowTypes) => {
    switch (type) {
      case WindowTypes.PodTile:
        return (
          contentProps: any,
          contentStore: PodTileStore | MessagesStore | null
        ) => {
          if (contentStore instanceof PodTileStore) {
            return (
              <PodTileTitle
                strategies={props.strategies}
                currencies={props.currencies}
                store={contentStore}
              />
            );
          } else {
            throw new Error("invalid type of store specified");
          }
        };
      case WindowTypes.MessageBlotter:
        return () => <h1>Blotter</h1>;
    }
    return () => null;
  };

  const getWorkspaceContentView = (): ReactElement => {
    return (
      <>
        <WindowManager
          windows={store.windows}
          getTitleRenderer={getTitleRenderer}
          getContentRenderer={getContentRenderer}
          isDefaultWorkspace={props.isDefault}
          onLayoutModify={() => props.onModify(id)}
          onUpdateAllGeometries={store.updateAllGeometries}
          onWindowClose={store.removeWindow}
        />
        <ModalWindow
          render={() => (
            <ErrorBox
              title={strings.ErrorModalTitle}
              message={store.errorMessage as string}
              onClose={store.hideErrorModal}
            />
          )}
          isOpen={store.errorMessage !== null}
        />
      </>
    );
  };

  if (!!store.busyMessage) {
    return (
      <ProgressView
        value={50}
        message={"Please wait while we load your workspace"}
        title={"Loading: Workspace"}
      />
    );
  }

  return (
    <div className={props.visible ? "visible" : "invisible"}>
      <div className={"toolbar"}>
        <div className={"content"}>
          <button onClick={onAddPodTile}>
            <i className={"fa fa-plus"} /> Add POD
          </button>
          <button onClick={onAddMessageBlotterTile}>
            <i className={"fa fa-eye"} /> Add Blotter
          </button>
          <ExecutionBanner />
          <CommissionRates />
          {getRightPanelButtons()}
        </div>
      </div>
      {getWorkspaceContentView()}
      <ModalWindow
        render={() => (
          <UserProfileModal onCancel={store.hideUserProfileModal} />
        )}
        isOpen={store.isUserProfileModalVisible}
      />
    </div>
  );
};
// <!-- ModalWindow render={renderLoadingModal} visible={!!store.busyMessage} /-->

const observed = observer(Workspace);
export { observed as TradingWorkspace };
