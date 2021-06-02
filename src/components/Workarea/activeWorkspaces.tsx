import { MiddleOffice } from "components/MiddleOffice";
import { Welcome } from "components/weolcome";
import { TradingWorkspace } from "components/Workspace";
import {
  MiddleOfficeStore,
  MiddleOfficeStoreContext,
} from "mobx/stores/middleOfficeStore";
import {
  TradingWorkspaceStore,
  WorkspaceStoreContext,
} from "mobx/stores/tradingWorkspaceStore";
import store from "mobx/stores/workareaStore";
import React from "react";
import { WorkareaStatus } from "stateDefs/workareaState";
import { Symbol } from "types/symbol";

export const ActiveWorkspace: React.FC = (): React.ReactElement | null => {
  const { workspace, user } = store;
  if (store.status === WorkareaStatus.Welcome) return <Welcome />;
  if (user === null) return null;
  const symbols: ReadonlyArray<Symbol> = (() => {
    const { symbols, user } = store;
    return symbols.filter((symbol: Symbol): boolean => {
      const { regions } = user;
      if (regions === undefined) return false;
      return regions.includes(symbol.ccyGroup);
    });
  })();
  if (workspace instanceof MiddleOfficeStore) {
    return (
      <MiddleOfficeStoreContext.Provider value={workspace}>
        <MiddleOffice visible={true} />
      </MiddleOfficeStoreContext.Provider>
    );
  } else if (workspace instanceof TradingWorkspaceStore) {
    return (
      <WorkspaceStoreContext.Provider value={workspace} key={workspace.id}>
        <TradingWorkspace
          id={workspace.id}
          isDefault={!workspace.modified}
          visible={true}
          tenors={store.tenors}
          /* Only filtered symbols */
          currencies={symbols}
          strategies={store.strategies}
          banks={store.banks}
          onModify={store.setWorkspaceModified}
        />
      </WorkspaceStoreContext.Provider>
    );
  } else {
    return null;
  }
};
