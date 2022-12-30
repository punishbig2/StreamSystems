import { Tile } from '@cib/windows-manager';
import { DefaultWindowButtons } from 'components/DefaultWindowButtons';
import { useEventHandlers } from 'components/ReactTileManager/hooks/useEventHandlers';
import { useHydrator } from 'components/ReactTileManager/hooks/useHydrator';
import { ContentStore } from 'mobx/stores/contentStore';
import { TileStore, TileStoreContext } from 'mobx/stores/tileStore';
import { observer } from 'mobx-react';
import React from 'react';
import { TileType } from 'types/tileType';

interface OwnProps {
  readonly id: string;
  readonly type: TileType;
  readonly isDefaultWorkspace: boolean;
  readonly fixed?: boolean;
  readonly title: (store: ContentStore | null) => React.ReactElement | string | null;
  readonly content: (store: ContentStore | null) => React.ReactElement | string | null;
  // readonly onLayoutModify: () => void;
  readonly onClose: (id: string) => void;
}

type Props = React.PropsWithChildren<OwnProps>;

export const ReactTile: React.FC<Props> = observer((props: Props): React.ReactElement | null => {
  const [tile, setReference] = React.useState<Tile | null>(null);
  const store = React.useContext<TileStore>(TileStoreContext);
  const ready = useHydrator(tile, store);

  useEventHandlers(tile, store);

  React.useEffect((): void => {
    if (tile === null) {
      return;
    }

    const { style } = tile;
    // Set visible when ready
    style.visibility = ready ? 'visible' : 'hidden';
  }, [ready, tile]);

  const onClose = React.useCallback((): void => {
    props.onClose(store.id);
  }, [props, store.id]);

  const onMinimize = React.useCallback((): void => {
    if (tile !== null) {
      tile.minimized = store.setMinimized(!tile.minimized);
    }
  }, [store, tile]);

  const onResizeToContent = React.useCallback((): void => {
    if (tile !== null) {
      tile.autosize = store.setAutosize(true);
    }
  }, [store, tile]);

  const getTitleBarButtons = (): React.ReactElement | null => {
    if (props.fixed) {
      return null;
    }

    return (
      <DefaultWindowButtons
        resizeable={props.type === TileType.PodTile}
        onMinimize={onMinimize}
        onResizeToContent={onResizeToContent}
        onClose={onClose}
      />
    );
  };

  const handleWindowResize = React.useCallback((): void => {
    if (tile === null) {
      return;
    }

    if (tile.autosize) {
      onResizeToContent();
    } else if (tile.sticky) {
      // Do nothing for now
      console.warn('sticky tile needs to be relocated');
    } else if (tile.docked) {
      // Do nothing for now
    }
  }, [onResizeToContent, tile]);

  React.useEffect((): VoidFunction => {
    window.addEventListener('resize', handleWindowResize);
    return (): void => {
      window.removeEventListener('resize', handleWindowResize);
    };
  }, [handleWindowResize]);

  return (
    <cib-window id={store.id} ref={setReference} scrollable autosize>
      <div slot="toolbar" className="window-title-bar">
        {props.title(store.contentStore)}
        {getTitleBarButtons()}
      </div>
      <div slot="content" className="window-content">
        {props.content(store.contentStore)}
      </div>
    </cib-window>
  );
});
