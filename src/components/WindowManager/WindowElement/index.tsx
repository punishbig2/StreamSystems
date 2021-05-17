import { DefaultWindowButtons } from "components/DefaultWindowButtons";
import { observer } from "mobx-react";

import { MessagesStore } from "mobx/stores/messagesStore";
import { PodTileStore } from "mobx/stores/podTileStore";
import { WindowStore } from "mobx/stores/windowStore";
import { WindowTypes } from "mobx/stores/workareaStore";
import React from "react";
import { Tile, Geometry } from "window-manager";
import { TileEvent } from "window-manager/dist/src/tile";

interface OwnProps {
  readonly id: string;
  readonly geometry?: ClientRect;
  readonly minimized?: boolean;
  readonly type: WindowTypes;
  readonly isDefaultWorkspace: boolean;
  readonly fitToContent: boolean;
  readonly fixed?: boolean;
  readonly store: WindowStore;
  readonly title: (
    props: any,
    store: PodTileStore | MessagesStore | null
  ) => React.ReactElement | string | null;
  readonly content: (
    props: any,
    store: PodTileStore | MessagesStore | null
  ) => React.ReactElement | string | null;
  readonly onLayoutModify: () => void;
  readonly onClose: (id: string) => void;
}

type Props = React.PropsWithChildren<OwnProps>;

export const WindowElement: React.FC<Props> = observer(
  (props: Props): React.ReactElement => {
    const [tile, setReference] = React.useState<Tile | null>(null);
    const { fixed, store } = props;
    const { hydrated } = store;
    React.useEffect((): void => {
      if (tile === null || !hydrated) return;
      const geometry = store.savedGeometry;
      if (geometry === null) {
        tile.moveToBestPosition();
      } else {
        tile.autosize = store.autosize;
        tile.docked = store.docked;
        tile.minimized = store.minimized;
        tile.setGeometry(
          new Geometry(geometry.x, geometry.y, geometry.width, geometry.height)
        );
      }
    }, [tile, hydrated, store]);
    React.useEffect((): (() => void) | void => {
      if (tile === null) return;
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
      return (): void => {
        tile.removeEventListener(TileEvent.Resized, onResize);
        tile.removeEventListener(TileEvent.Moved, onMove);
        tile.removeEventListener(TileEvent.DockingChanged, onDockingChanged);
      };
    }, [tile, store]);
    const onClose = () => {
      props.onClose(store.id);
      props.onLayoutModify();
    };
    const onMinimize = () => {
      if (tile !== null) {
        tile.minimized = store.setMinimized(!tile.minimized);
      }
      props.onLayoutModify();
    };
    const onResizeToContent = () => {
      if (tile !== null) {
        tile.autosize = store.setAutosize(true);
      }
      props.onLayoutModify();
    };
    const getTitleBarButtons = (): React.ReactElement | null => {
      if (fixed) return null;
      return (
        <DefaultWindowButtons
          onMinimize={onMinimize}
          onResizeToContent={onResizeToContent}
          onClose={onClose}
        />
      );
    };
    const contentProps = {
      scrollable: !(tile !== null && tile.autosize),
    };
    return (
      <cib-window ref={setReference} id={store.id} minimized autosize>
        <div slot={"toolbar"} className={"window-title-bar"}>
          {props.title(contentProps, store.contentStore)}
          {getTitleBarButtons()}
        </div>
        <div slot={"content"} className={"window-content"}>
          {props.content(contentProps, store.contentStore)}
        </div>
      </cib-window>
    );
  }
);
