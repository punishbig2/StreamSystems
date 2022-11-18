import { Geometry, Tile } from '@cib/windows-manager';
import { TileStore } from 'mobx/stores/tileStore';
import React from 'react';
import { idealBlotterHeight } from 'utils/idealBlotterHeight';
import { runInNextLoop } from 'utils/runInNextLoop';

export const useHydrator = (tile: Tile | null, store: TileStore): boolean => {
  const [ready, setReady] = React.useState<boolean>(false);
  const { hydrated } = store;
  React.useEffect((): void => {
    if (tile === null || !hydrated) return;
    runInNextLoop((): void => {
      const geometry = store.geometry;
      tile.autosize = store.autosize;
      tile.docked = store.docked;
      tile.minimized = store.minimized;
      if (geometry === null) {
        if (!store.autosize) {
          tile.adjustToContent({ height: idealBlotterHeight() });
        } else {
          tile.adjustToContent();
        }
        tile.moveToBestPosition();
        // This way, it does remember where it was if we refresh
        store.saveGeometry(Geometry.fromPositionAndSize(tile.position, tile.size));
        setReady(true);
      } else {
        tile.setGeometry(new Geometry(geometry.x, geometry.y, geometry.width, geometry.height));
        setReady(true);
      }
    });
  }, [tile, hydrated, store]);

  return ready;
};
