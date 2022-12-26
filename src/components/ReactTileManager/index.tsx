import { TileManager } from '@cib/windows-manager';
import { MenuItem, Paper } from '@material-ui/core';
import { ExecutionBlotter } from 'components/ReactTileManager/executionBlotter';
import { ReactTile } from 'components/ReactTileManager/ReactTile';
import { noop } from 'lodash';
import { ContentStore } from 'mobx/stores/contentStore';
import { MessageBlotterStoreContext } from 'mobx/stores/messageBlotterStore';
import { TileStore, TileStoreContext } from 'mobx/stores/tileStore';
import {
  TradingWorkspaceStore,
  TradingWorkspaceStoreContext,
} from 'mobx/stores/tradingWorkspaceStore';
import React, { MouseEvent, ReactElement, useCallback, useRef, useState } from 'react';
import { TileType } from 'types/tileType';

interface Props {
  readonly tiles: readonly TileStore[];
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

interface XYPoint {
  readonly x: number;
  readonly y: number;
}

const ReactTileManager: React.FC<Props> = (props: Props): React.ReactElement | null => {
  const { isDefaultWorkspace: ready, tiles } = props;
  const [menuPosition, setMenuPosition] = useState<XYPoint | null>(null);
  const store = React.useContext<TradingWorkspaceStore>(TradingWorkspaceStoreContext);
  const tileManagerRef = useRef<TileManager>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(setTimeout(noop, 0));

  const handleWindowResize = React.useCallback((): void => {
    clearTimeout(timer.current);

    timer.current = setTimeout((): void => {
      const tileManager = tileManagerRef.current;

      for (const tile of tiles) {
        tile.setAutosize(false);
      }

      if (tileManager !== null) {
        tileManager.arrangeTiles();
      }
    }, 50);
  }, [tiles]);

  React.useEffect((): VoidFunction => {
    const onContextMenu = (genericEvent: Event): void => {
      const event = genericEvent as unknown as MouseEvent;
      event.preventDefault();

      setMenuPosition({ x: event.clientX, y: event.clientY });

      const closeOnClick = (): void => {
        document.removeEventListener('click', closeOnClick, true);
        setMenuPosition(null);
      };

      document.addEventListener('click', closeOnClick, true);
    };

    window.addEventListener('contextmenu', onContextMenu);
    window.addEventListener('resize', handleWindowResize);
    return (): void => {
      window.removeEventListener('resize', handleWindowResize);
      window.removeEventListener('contextmenu', onContextMenu);
    };
  }, [handleWindowResize]);

  const arrangeTiles = useCallback((): void => {
    const tileManager = tileManagerRef.current;
    if (tileManager !== null) {
      tileManager.arrangeTiles();
    }
  }, []);

  return (
    <>
      <cib-window-manager ref={tileManagerRef}>
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
        <MessageBlotterStoreContext.Provider value={store.executionBlotter}>
          <ExecutionBlotter />
        </MessageBlotterStoreContext.Provider>
      </cib-window-manager>
      {menuPosition ? (
        <Paper
          style={{
            position: 'absolute',
            top: menuPosition.y,
            left: menuPosition.x,
            zIndex: Number.MAX_SAFE_INTEGER,
          }}
        >
          <MenuItem onClick={arrangeTiles}>Arrange Tiles</MenuItem>
        </Paper>
      ) : null}
    </>
  );
};

export { ReactTileManager };
