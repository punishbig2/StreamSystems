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
import { ReactTileManager } from "components/ReactTileManager";
import { UserProfileModal } from "components/Workspace/UserProfile";
import strings from "locales";
import { observer } from "mobx-react";
import { ContentStore, isPodTileStore } from "mobx/stores/contentStore";
import {
  TradingWorkspaceStore,
  TradingWorkspaceStoreContext,
} from "mobx/stores/tradingWorkspaceStore";
import workareaStore, { isTradingWorkspace } from "mobx/stores/workareaStore";
import React, { ReactElement, useMemo } from "react";
import { STRM } from "stateDefs/workspaceState";
import { Product } from "types/product";
import { Role } from "types/role";
import { SelectEventData } from "types/selectEventData";
import { Symbol } from "types/symbol";
import { TileType } from "types/tileType";
import { User } from "types/user";
import { PodStoreContext } from "mobx/stores/podStore";

interface Props {
  readonly index: number;
  readonly tenors: ReadonlyArray<string>;
  readonly currencies: ReadonlyArray<Symbol>;
  readonly strategies: ReadonlyArray<Product>;
  readonly banks: ReadonlyArray<string>;
  readonly isDefault: boolean;
  readonly visible: boolean;
}

const NotPodStoreError = new Error(
  "invalid type of content store for pod tile"
);

const useDropdownStyles = makeStyles({
  root: {
    height: 30,
    lineHeight: "18px",
  },
});

export const TradingWorkspace: React.FC<Props> = observer(
  (props: Props): ReactElement | null => {
    const dropdownClasses = useDropdownStyles();
    const user: User = workareaStore.user;
    const isBroker: boolean = useMemo((): boolean => {
      const { roles } = user;
      return roles.includes(Role.Broker);
    }, [user]);
    const store = React.useContext<TradingWorkspaceStore>(
      TradingWorkspaceStoreContext
    );
    if (!isTradingWorkspace(store)) throw new Error("invalid store type");

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
      if (typeof store.addTile === "function") {
        store.addTile(TileType.PodTile);
      }
    };

    const onAddMessageBlotterTile = () => {
      store.addTile(TileType.MessageBlotter);
    };

    const getContentRenderer = (id: string, type: TileType) => {
      switch (type) {
        case TileType.PodTile:
          return (contentStore: ContentStore | null) => {
            if (isPodTileStore(contentStore)) {
              return (
                <PodStoreContext.Provider value={contentStore}>
                  <PodTile
                    currencies={props.currencies}
                    tenors={props.tenors}
                  />
                </PodStoreContext.Provider>
              );
            } else {
              throw NotPodStoreError;
            }
          };
        case TileType.MessageBlotter:
          return () => {
            return (
              <MessageBlotter id={id} blotterType={BlotterTypes.Regular} />
            );
          };
      }
      throw new Error("invalid type of window specified");
    };

    const getTitleRenderer = (id: string, type: TileType) => {
      switch (type) {
        case TileType.PodTile:
          return (contentStore: ContentStore | null) => {
            if (isPodTileStore(contentStore)) {
              return (
                <PodStoreContext.Provider value={contentStore}>
                  <PodTileTitle
                    strategies={contentStore.strategies}
                    currencies={props.currencies}
                  />
                </PodStoreContext.Provider>
              );
            } else {
              throw NotPodStoreError;
            }
          };
        case TileType.MessageBlotter:
          return () => <h1>Blotter</h1>;
      }
      return () => null;
    };

    const getWorkspaceContentView = (): ReactElement => {
      return (
        <TradingWorkspaceStoreContext.Provider value={store}>
          <div className={"workspace"}>
            <ReactTileManager
              tiles={store.tiles}
              getTitleRenderer={getTitleRenderer}
              getContentRenderer={getContentRenderer}
              isDefaultWorkspace={props.isDefault}
              onWindowClose={store.removeTile}
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
          </div>
        </TradingWorkspaceStoreContext.Provider>
      );
    };

    if (store.loading) {
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
