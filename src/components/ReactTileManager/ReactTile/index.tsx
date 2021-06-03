import { Tile } from "@cib/windows-manager";
import { DefaultWindowButtons } from "components/DefaultWindowButtons";
import { useEventHandlers } from "components/ReactTileManager/hooks/useEventHandlers";
import { useHydrator } from "components/ReactTileManager/hooks/useHydrator";
import { observer } from "mobx-react";
import { ContentStore } from "mobx/stores/contentStore";
import { TileStore, TileStoreContext } from "mobx/stores/tileStore";
import React from "react";
import { TileType } from "types/tileType";

interface OwnProps {
  readonly id: string;
  readonly type: TileType;
  readonly isDefaultWorkspace: boolean;
  readonly fixed?: boolean;
  readonly title: (
    store: ContentStore | null
  ) => React.ReactElement | string | null;
  readonly content: (
    store: ContentStore | null
  ) => React.ReactElement | string | null;
  // readonly onLayoutModify: () => void;
  readonly onClose: (id: string) => void;
}

type Props = React.PropsWithChildren<OwnProps>;

export const ReactTile: React.FC<Props> = observer(
  (props: Props): React.ReactElement => {
    const [tile, setReference] = React.useState<Tile | null>(null);
    const store = React.useContext<TileStore>(TileStoreContext);

    useEventHandlers(tile, store);
    useHydrator(tile, store);

    const onClose = (): void => {
      props.onClose(store.id);
    };
    const onMinimize = (): void => {
      if (tile !== null) {
        tile.minimized = store.setMinimized(!tile.minimized);
      }
    };
    const onResizeToContent = (): void => {
      if (tile !== null) {
        tile.autosize = store.setAutosize(true);
      }
    };
    const getTitleBarButtons = (): React.ReactElement | null => {
      if (props.fixed) return null;
      return (
        <DefaultWindowButtons
          resizeable={props.type === TileType.PodTile}
          onMinimize={onMinimize}
          onResizeToContent={onResizeToContent}
          onClose={onClose}
        />
      );
    };
    return (
      <cib-window id={store.id} ref={setReference} scrollable autosize>
        <div slot={"toolbar"} className={"window-title-bar"}>
          {props.title(store.contentStore)}
          {getTitleBarButtons()}
        </div>
        <div slot={"content"} className={"window-content"}>
          {props.content(store.contentStore)}
        </div>
      </cib-window>
    );
  }
);
