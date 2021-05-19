import { ExecutionBlotter } from "components/WindowManager/executionBlotter";
import { Props } from "components/WindowManager/props";
import { WindowElement } from "components/WindowManager/WindowElement";
import {
  WindowDef,
  WorkspaceStore,
  WorkspaceStoreContext,
} from "mobx/stores/workspaceStore";
import React from "react";
import { TileManager } from "@cib/windows-manager";

import ResizeObserver from "resize-observer-polyfill";

const WindowManager: React.FC<Props> = (
  props: Props
): React.ReactElement | null => {
  const [boundingRect, setBoundingRect] = React.useState<DOMRect>(
    new DOMRect(0, 0, window.innerWidth, window.innerHeight)
  );
  const [tileManager, setTileManager] = React.useState<TileManager | null>(
    null
  );
  const workspaceStore: WorkspaceStore = React.useContext<WorkspaceStore>(
    WorkspaceStoreContext
  );
  React.useEffect((): void | (() => void) => {
    if (tileManager === null) return;
    const observer = new ResizeObserver((): void => {
      setBoundingRect(tileManager.getBoundingClientRect());
    });
    observer.observe(tileManager);
    return (): void => observer.disconnect();
  }, [tileManager]);
  const { isDefaultWorkspace: ready, windows } = props;
  return (
    <cib-window-manager ref={setTileManager}>
      {windows.map(
        (window: WindowDef): React.ReactElement => (
          <WindowElement
            id={window.id}
            store={workspaceStore.getWindowStore(window.id, window.type)}
            type={window.type}
            content={props.getContentRenderer(window.id, window.type)}
            title={props.getTitleRenderer(window.id, window.type)}
            key={window.id}
            isDefaultWorkspace={ready}
            onLayoutModify={props.onLayoutModify}
            onClose={props.onWindowClose}
          />
        )
      )}
      <ExecutionBlotter boundingRect={boundingRect} />
    </cib-window-manager>
  );
};

export { WindowManager };
