import { Geometry, Tile, TileEvent } from '@cib/windows-manager';
import { TileStore } from 'mobx/stores/tileStore';
import React from 'react';

export const useEventHandlers = (tile: Tile | null, store: TileStore): void => {
  React.useEffect((): VoidFunction | void => {
    if (tile === null) return;
    const onUnderflow = ((event: CustomEvent<'vertical' | 'horizontal'>): void => {
      if (event.detail === 'vertical') {
        tile.scrollable = true;
      }
    }) as EventListener;
    const onResize = ((event: CustomEvent<Geometry>): void => {
      store.saveGeometry(event.detail);
      store.setAutosize(tile.autosize);
    }) as EventListener;
    const onMove = ((event: CustomEvent<Geometry>): void => {
      store.saveGeometry(event.detail);
    }) as EventListener;
    const onDockingChanged = ((event: CustomEvent<boolean>): void => {
      store.setDocked(event.detail);
    }) as EventListener;
    tile.addEventListener(TileEvent.Resized, onResize);
    tile.addEventListener(TileEvent.Moved, onMove);
    tile.addEventListener(TileEvent.DockingChanged, onDockingChanged);
    tile.addEventListener(TileEvent.Underflow, onUnderflow);
    return (): void => {
      tile.removeEventListener(TileEvent.Resized, onResize);
      tile.removeEventListener(TileEvent.Moved, onMove);
      tile.removeEventListener(TileEvent.DockingChanged, onDockingChanged);
      tile.removeEventListener(TileEvent.Underflow, onUnderflow);
    };
  }, [tile, store]);
};
