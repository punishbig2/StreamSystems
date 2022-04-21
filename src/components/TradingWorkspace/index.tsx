import { CommissionRates } from "components/CommissionRates";
import { ExecutionBanner } from "components/ExecutionBanner";
import { ModalWindow } from "components/ModalWindow";
import { ProgressView } from "components/progressView";
import { RightPanelButtons } from "components/TradingWorkspace/rightPanelButtons";
import { UserProfileModal } from "components/TradingWorkspace/UserProfile";
import { ContentView } from "components/TradingWorkspace/contentView";
import { observer } from "mobx-react";
import {
  TradingWorkspaceStore,
  TradingWorkspaceStoreContext,
} from "mobx/stores/tradingWorkspaceStore";
import workareaStore, { isTradingWorkspace } from "mobx/stores/workareaStore";
import React, { ReactElement, useMemo } from "react";
import { Product } from "types/product";
import { hasRole, Role } from "types/role";
import { Symbol } from "types/symbol";
import { TileType } from "types/tileType";
import { User } from "types/user";
import { BrokerageStoreContext } from "mobx/stores/brokerageStore";
import { TileStore } from "mobx/stores/tileStore";

interface Props {
  readonly index: number;
  readonly tenors: ReadonlyArray<string>;
  readonly currencies: ReadonlyArray<Symbol>;
  readonly strategies: ReadonlyArray<Product>;
  readonly banks: ReadonlyArray<string>;
  readonly isDefault: boolean;
  readonly visible: boolean;
}

export const TradingWorkspace: React.FC<Props> = observer(
  (props: Props): ReactElement | null => {
    const user: User = workareaStore.user;
    const isBroker: boolean = useMemo((): boolean => {
      const { roles } = user;
      return hasRole(roles, Role.Broker);
    }, [user]);

    const store = React.useContext<TradingWorkspaceStore>(
      TradingWorkspaceStoreContext
    );
    const { tiles, reffingAll } = store;
    const [refAllDisabled, setRefAllDisabled] = React.useState<boolean>(false);
    if (!isTradingWorkspace(store)) throw new Error("invalid store type");

    React.useEffect((): void | VoidFunction => {
      if (!reffingAll) return;

      const timer = setInterval((): void => {
        const someTileHasOrders = tiles.some(
          (tile: TileStore): boolean => tile.hasOrders
        );
        setRefAllDisabled(someTileHasOrders);

        if (!someTileHasOrders) {
          store.setReffingAll(false);
        }
      }, 200);

      return (): void => {
        clearInterval(timer);
      };
    }, [reffingAll, store, tiles]);

    const onAddPodTile = () => {
      if (typeof store.addTile === "function") {
        store.addTile(TileType.PodTile);
      }
    };

    const onAddMessageBlotterTile = () => {
      store.addTile(TileType.MessageBlotter);
    };

    if (store.loading) {
      return (
        <ProgressView
          value={50}
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
            <BrokerageStoreContext.Provider value={store.brokerageStore}>
              <CommissionRates />
            </BrokerageStoreContext.Provider>
            <RightPanelButtons
              isBroker={isBroker}
              refAllDisabled={refAllDisabled}
              onPersonalityChange={store.setPersonality}
              onShowProfileModal={store.showUserProfileModal}
              onRefAll={store.superRefAll}
            />
          </div>
        </div>
        <TradingWorkspaceStoreContext.Provider value={store}>
          <ContentView
            tiles={store.tiles}
            isDefault={props.isDefault}
            currencies={props.currencies}
            tenors={props.tenors}
            visible={props.visible}
            errorMessage={store.errorMessage}
            onCloseErrorModal={(): void => store.hideErrorModal()}
            onRemoveTile={(id: string) => store.removeTile(id)}
          />
        </TradingWorkspaceStoreContext.Provider>
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
