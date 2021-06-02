import { MiddleOffice } from "components/MiddleOffice";
import { Welcome } from "components/weolcome";
import { TradingWorkspace } from "components/Workspace";
import { observer } from "mobx-react";
import { MiddleOfficeStoreContext } from "mobx/stores/middleOfficeStore";
import { WorkspaceStoreContext } from "mobx/stores/tradingWorkspaceStore";
import workarea, {
  isMiddleOfficeWorkspace,
  isTradingWorkspace,
} from "mobx/stores/workareaStore";
import React from "react";
import { WorkareaStatus } from "stateDefs/workareaState";
import { Symbol } from "types/symbol";

export const ActiveWorkspace: React.FC = observer(
  (): React.ReactElement | null => {
    const { workspace, currentWorkspaceIndex: index, user } = workarea;
    if (workarea.status === WorkareaStatus.Welcome) return <Welcome />;
    if (user === null) return null;
    const symbols: ReadonlyArray<Symbol> = (() => {
      const { symbols, user } = workarea;
      return symbols.filter((symbol: Symbol): boolean => {
        const { regions } = user;
        if (regions === undefined) return false;
        return regions.includes(symbol.ccyGroup);
      });
    })();
    if (index === null) {
      return null;
    } else if (isMiddleOfficeWorkspace(workspace)) {
      return (
        <MiddleOfficeStoreContext.Provider value={workspace}>
          <MiddleOffice visible={true} />
        </MiddleOfficeStoreContext.Provider>
      );
    } else if (isTradingWorkspace(workspace)) {
      return (
        <WorkspaceStoreContext.Provider value={workspace}>
          <TradingWorkspace
            index={index}
            isDefault={!workspace.modified}
            visible={true}
            tenors={workarea.tenors}
            /* Only filtered symbols */
            currencies={symbols}
            strategies={workarea.strategies}
            banks={workarea.banks}
            onModify={workarea.setWorkspaceModified}
          />
        </WorkspaceStoreContext.Provider>
      );
    } else {
      return null;
    }
  }
);
