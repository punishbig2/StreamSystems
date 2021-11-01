import { MiddleOffice } from "components/MiddleOffice";
import { Welcome } from "components/weolcome";
import { TradingWorkspace } from "components/TradingWorkspace";
import { observer } from "mobx-react";
import { MiddleOfficeStoreContext } from "mobx/stores/middleOfficeStore";
import { TradingWorkspaceStoreContext } from "mobx/stores/tradingWorkspaceStore";
import workarea, {
  isMiddleOfficeWorkspace,
  isTradingWorkspace,
} from "mobx/stores/workareaStore";
import React from "react";
import { WorkareaStatus } from "stateDefs/workareaState";
import { Symbol } from "types/symbol";
import { Workspace } from "types/workspace";

export const Workspaces: React.FC = observer((): React.ReactElement | null => {
  const { workspaces, currentWorkspaceIndex, user } = workarea;
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

  const elements = workspaces.map(
    (workspace: Workspace, index: number): React.ReactElement | null => {
      const style = {
        display: index === currentWorkspaceIndex ? "initial" : "none",
      };
      const key = index.toString();
      if (isMiddleOfficeWorkspace(workspace)) {
        return (
          <div style={style} key={key}>
            <MiddleOfficeStoreContext.Provider value={workspace}>
              <MiddleOffice visible={true} />
            </MiddleOfficeStoreContext.Provider>
          </div>
        );
      } else if (isTradingWorkspace(workspace)) {
        return (
          <div style={style} key={key}>
            <TradingWorkspaceStoreContext.Provider value={workspace}>
              <TradingWorkspace
                index={index}
                isDefault={!workspace.modified}
                visible={true}
                tenors={workarea.tenors}
                /* Only filtered symbols */
                currencies={symbols}
                strategies={workarea.strategies}
                banks={workarea.banks}
              />
            </TradingWorkspaceStoreContext.Provider>
          </div>
        );
      } else {
        return null;
      }
    }
  );

  return <>{elements}</>;
});
