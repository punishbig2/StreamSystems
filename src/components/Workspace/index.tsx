import { MenuItem, Select } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
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
import {
  WorkspaceStore,
  WorkspaceStoreContext,
} from "mobx/stores/workspaceStore";
import React, { ReactElement, useMemo } from "react";
import { STRM } from "stateDefs/workspaceState";
import { Product } from "types/product";
import { Role } from "types/role";
import { SelectEventData } from "types/selectEventData";
import { Symbol } from "types/symbol";
import { User } from "types/user";

interface Props {
  readonly id: string;
  readonly tenors: ReadonlyArray<string>;
  readonly currencies: ReadonlyArray<Symbol>;
  readonly strategies: ReadonlyArray<Product>;
  readonly banks: ReadonlyArray<string>;
  readonly isDefault: boolean;
  readonly visible: boolean;
  readonly onModify: (id: string) => void;
  readonly store: WorkspaceStore;
}

const useDropdownStyles = makeStyles({
  root: {
    height: 30,
    lineHeight: "18px",
  },
});

export const TradingWorkspace: React.FC<Props> = observer(
  (props: Props): ReactElement | null => {
    const { id, store } = props;
    const dropdownClasses = useDropdownStyles();
    const user: User = workareaStore.user;
    const isBroker: boolean = useMemo((): boolean => {
      const { roles } = user;
      return roles.includes(Role.Broker);
    }, [user]);

    if (store === null) return null;
    const onPersonalityChange = ({
      target,
    }: React.ChangeEvent<SelectEventData>) => {
      store.setPersonality(target.value as string);
    };

    const getRightPanelButtons = (): ReactElement | null => {
      if (isBroker) {
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
              classes={dropdownClasses}
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
                  tenors={props.tenors}
                  connected={contentProps.connected}
                  scrollable={contentProps.scrollable}
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
                  strategies={contentStore.strategies}
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
        <WorkspaceStoreContext.Provider value={store}>
          <WindowManager
            windows={store.windows}
            getTitleRenderer={getTitleRenderer}
            getContentRenderer={getContentRenderer}
            isDefaultWorkspace={props.isDefault}
            onLayoutModify={(): void => props.onModify(id)}
            // onUpdateAllGeometries={store.updateAllGeometries}
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
        </WorkspaceStoreContext.Provider>
      );
    };

    if (!!store.busyMessage) {
      return (
        <ProgressView
          value={store.progress}
          message={"Please wait while we load your workspace"}
          title={"Loading: Workspace"}
        />
      );
    }

    return (
      <div className={props.visible ? "visible" : "hidden"}>
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
  }
);
