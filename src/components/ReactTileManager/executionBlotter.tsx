import { Geometry, Tile, TileEvent } from '@cib/windows-manager';
import { BlotterTypes } from 'columns/messageBlotter';
import { MessageBlotter } from 'components/MessageBlotter';
import { ExportButton } from 'components/MessageBlotter/controls/exportButton';
import { getOptimalExecutionsBlotterGeometry } from 'components/ReactTileManager/helpers/getOptimalExecutionsBlotterGeometry';
import { useExecutionBlotterSize } from 'components/ReactTileManager/hooks/useExecutionBlotterSize';
import { Select } from 'components/Select';
import { MessageBlotterStore, MessageBlotterStoreContext } from 'mobx/stores/messageBlotterStore';
import workareaStore from 'mobx/stores/workareaStore';
import { observer } from 'mobx-react';
import React, { ReactElement } from 'react';
import { runInNextLoop } from 'utils/runInNextLoop';

export const ExecutionBlotter: React.FC = observer((): ReactElement | null => {
  const store = React.useContext<MessageBlotterStore>(MessageBlotterStoreContext);

  const { user } = workareaStore;
  const { lastGeometry: geometry, isNew } = store;
  const [tile, setTile] = React.useState<Tile | null>(null);
  const { width, height } = useExecutionBlotterSize();

  React.useEffect((): void => {
    if (tile === null) {
      return;
    }

    runInNextLoop((): void => {
      const newGeometry = ((): Geometry => {
        if (isNew) {
          return getOptimalExecutionsBlotterGeometry(tile, width, height);
        } else {
          return geometry;
        }
      })();

      tile.setGeometry(newGeometry);
    });
  }, [geometry, height, isNew, store, tile, width]);

  React.useEffect((): VoidFunction | void => {
    if (tile === null) return;

    const updateGeometry = ((event: CustomEvent<Geometry>): void => {
      store.setLastGeometry(event.detail, false);
    }) as EventListener;

    tile.addEventListener(TileEvent.Moved, updateGeometry);
    tile.addEventListener(TileEvent.Resized, updateGeometry);
    return (): void => {
      tile.removeEventListener(TileEvent.Moved, updateGeometry);
      tile.removeEventListener(TileEvent.Resized, updateGeometry);
    };
  }, [store, tile]);

  React.useEffect((): void => {
    store.setOwner(user);
  }, [store, user]);

  const { regions } = workareaStore.user;

  const groups = React.useMemo((): ReadonlyArray<{ readonly name: string }> => {
    return [
      { name: 'All' },
      ...regions.map(
        (
          ccyGroup
        ): {
          name: string;
        } => ({ name: ccyGroup })
      ),
    ];
  }, [regions]);

  const handleGroupChange = React.useCallback(
    (value: string): void => store.setCurrencyGroupFilter(value),
    [store]
  );

  const restore = React.useCallback((): void => {
    if (tile === null) {
      return;
    }

    runInNextLoop((): void => {
      const newGeometry = getOptimalExecutionsBlotterGeometry(tile, width, height);

      store.setLastGeometry(newGeometry, true);
      tile.setGeometry(newGeometry);
    });
  }, [height, store, tile, width]);

  const handleWindowResize = React.useCallback((): void => {
    if (store.docked) {
      setTimeout(restore, 0);
    }
  }, [restore]);

  React.useEffect((): VoidFunction => {
    window.addEventListener('resize', handleWindowResize);

    return (): void => {
      window.removeEventListener('resize', handleWindowResize);
    };
  }, [handleWindowResize]);

  if (store.docked) {
    return (
      <cib-window ref={setTile} sticky scrollable transparent>
        <div slot="toolbar" className="execution-blotter-title">
          <h1>Execution Blotter</h1>
          <ExportButton blotterType={BlotterTypes.Executions} />

          <div className="right-panel">
            <h3>CCY Group</h3>
            <Select
              testId="execution-blotter-currency-group"
              value={store.currencyGroupFilter}
              disabled={!workareaStore.connected}
              list={groups}
              onChange={handleGroupChange}
            />
          </div>
        </div>
        <div slot="content" className="window-content">
          <MessageBlotter id="executions" blotterType={BlotterTypes.Executions} />
        </div>
      </cib-window>
    );
  } else {
    return (
      <cib-window ref={setTile} scrollable transparent>
        <div slot="toolbar" className="execution-blotter-title">
          <h1>Execution Blotter</h1>
          <ExportButton blotterType={BlotterTypes.Executions} />

          <div className="right-panel">
            <h3>CCY Group</h3>
            <Select
              testId="execution-blotter-currency-group"
              value={store.currencyGroupFilter}
              disabled={!workareaStore.connected}
              list={groups}
              onChange={handleGroupChange}
            />
            <div className="window-button" onClick={restore}>
              <i className="fa fa-border-style" />
            </div>
          </div>
        </div>
        <div slot="content" className="window-content">
          <MessageBlotter id="executions" blotterType={BlotterTypes.Executions} />
        </div>
      </cib-window>
    );
  }
});
