import { Geometry, Tile, TileEvent } from "@cib/windows-manager";
import { BlotterTypes } from "columns/messageBlotter";
import { MessageBlotter } from "components/MessageBlotter";
import { getOptimalExecutionsBlotterGeometry } from "components/ReactTileManager/helpers/getOptimalExecutionsBlotterGeometry";
import { useExecutionBlotterSize } from "components/ReactTileManager/hooks/useExecutionBlotterSize";
import { Select } from "components/Select";
import { MessagesStore, MessagesStoreContext } from "mobx/stores/messagesStore";
import {
  TradingWorkspaceStore,
  TradingWorkspaceStoreContext,
} from "mobx/stores/tradingWorkspaceStore";
import workareaStore from "mobx/stores/workareaStore";
import React, { ReactElement } from "react";
import { runInNextLoop } from "utils/runInNextLoop";

export const ExecutionBlotter: React.FC = (): ReactElement | null => {
  const messagesStore: MessagesStore =
    React.useContext<MessagesStore>(MessagesStoreContext);
  const store = React.useContext<TradingWorkspaceStore>(
    TradingWorkspaceStoreContext
  );
  const { lastGeometry: geometry, isNew } = store.executionBlotter;
  const [tile, setTile] = React.useState<Tile | null>(null);
  const { width, height } = useExecutionBlotterSize();
  React.useEffect((): void => {
    if (tile === null) return;
    runInNextLoop((): void => {
      const newGeometry = ((): Geometry => {
        if (isNew) {
          return getOptimalExecutionsBlotterGeometry(tile, width, height);
        } else {
          return geometry;
        }
      })();
      tile.setGeometry(newGeometry);
      store.saveExecutionBlotterGeometry(newGeometry);
    });
  }, [geometry, height, isNew, store, tile, width]);
  React.useEffect((): (() => void) | void => {
    if (tile === null) return;
    const updateGeometry = ((event: CustomEvent<Geometry>): void => {
      store.saveExecutionBlotterGeometry(event.detail);
    }) as EventListener;
    tile.addEventListener(TileEvent.Moved, updateGeometry);
    tile.addEventListener(TileEvent.Resized, updateGeometry);
    return (): void => {
      tile.removeEventListener(TileEvent.Moved, updateGeometry);
      tile.removeEventListener(TileEvent.Resized, updateGeometry);
    };
  }, [store, tile]);
  const { regions } = workareaStore.user;
  return (
    <cib-window ref={setTile} scrollable transparent>
      <div slot={"toolbar"} className={"execution-blotter-title"}>
        <h1>Execution Blotter</h1>
        <div className={"right-panel"}>
          <h3>CCY Group</h3>
          <Select
            value={messagesStore.ccyGroupFilter}
            disabled={!workareaStore.connected}
            list={[
              { name: "All" },
              ...regions.map((ccyGroup): {
                name: string;
              } => ({ name: ccyGroup })),
            ]}
            onChange={(value: string): void =>
              messagesStore.setCCYGroupFilter(value)
            }
          />
        </div>
      </div>
      <div slot={"content"} className={"window-content"}>
        <MessageBlotter
          id={"executions"}
          blotterType={BlotterTypes.Executions}
        />
      </div>
    </cib-window>
  );
};
