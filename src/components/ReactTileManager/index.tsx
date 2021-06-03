import { TileManager } from "@cib/windows-manager";
import { ExecutionBlotter } from "components/ReactTileManager/executionBlotter";
import { ReactTile } from "components/ReactTileManager/ReactTile";
import { ContentStore } from "mobx/stores/contentStore";
import {
  MessageBlotterStore,
  MessageBlotterStoreContext,
} from "mobx/stores/messageBlotterStore";
import { TileStore, TileStoreContext } from "mobx/stores/tileStore";
import workareaStore from "mobx/stores/workareaStore";
import React, { ReactElement } from "react";

import ResizeObserver from "resize-observer-polyfill";
import { TileType } from "types/tileType";

interface Props {
  readonly tiles: ReadonlyArray<TileStore>;
  readonly isDefaultWorkspace: boolean;
  readonly getContentRenderer: (
    id: string,
    type: TileType
  ) => (store: ContentStore | null) => ReactElement | string | null;
  readonly getTitleRenderer: (
    id: string,
    type: TileType
  ) => (store: ContentStore | null) => ReactElement | string | null;
  readonly onMouseLeave?: (event: React.MouseEvent<HTMLDivElement>) => void;
  readonly onWindowClose: (id: string) => void;
}

const ReactTileManager: React.FC<Props> = (
  props: Props
): React.ReactElement | null => {
  const [boundingRect, setBoundingRect] = React.useState<DOMRect>(
    new DOMRect(0, 0, window.innerWidth, window.innerHeight)
  );
  const [tileManager, setTileManager] = React.useState<TileManager | null>(
    null
  );
  React.useEffect((): void | (() => void) => {
    if (tileManager === null) return;
    const observer = new ResizeObserver((): void => {
      setBoundingRect(tileManager.getBoundingClientRect());
    });
    observer.observe(tileManager);
    return (): void => observer.disconnect();
  }, [tileManager]);
  const { isDefaultWorkspace: ready, tiles } = props;
  return (
    <cib-window-manager ref={setTileManager}>
      {tiles.map(
        (tile: TileStore): React.ReactElement => (
          <TileStoreContext.Provider value={tile} key={tile.id}>
            <ReactTile
              id={tile.id}
              type={tile.type}
              content={props.getContentRenderer(tile.id, tile.type)}
              title={props.getTitleRenderer(tile.id, tile.type)}
              isDefaultWorkspace={ready}
              onClose={props.onWindowClose}
            />
          </TileStoreContext.Provider>
        )
      )}
      <MessageBlotterStoreContext.Provider
        value={MessageBlotterStore.executionsBlotter(workareaStore.user)}
      >
        <ExecutionBlotter boundingRect={boundingRect} />
      </MessageBlotterStoreContext.Provider>
    </cib-window-manager>
  );
};

export { ReactTileManager };
