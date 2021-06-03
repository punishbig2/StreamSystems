import { Tile, Geometry } from "@cib/windows-manager";
import { TileStore } from "mobx/stores/tileStore";
import React from "react";
import { idealBlotterHeight } from "utils/idealBlotterHeight";
import { runInNextLoop } from "utils/runInNextLoop";

export const useHydrator = (tile: Tile | null, store: TileStore): void => {
  const { hydrated } = store;
  React.useEffect((): void => {
    if (tile === null || !hydrated) return;
    runInNextLoop((): void => {
      const geometry = store.geometry;
      if (geometry === null) {
        if (!store.autosize) {
          tile.adjustToContent({ height: idealBlotterHeight() });
        } else {
          tile.adjustToContent();
        }
        tile.moveToBestPosition();
      } else {
        tile.setGeometry(
          new Geometry(geometry.x, geometry.y, geometry.width, geometry.height)
        );
      }
      tile.autosize = store.autosize;
      tile.docked = store.docked;
      tile.minimized = store.minimized;
    });
  }, [tile, hydrated, store]);
};
