// import { ExecutionBlotter } from "components/WindowManager/executionBlotter";
import { Props } from "components/WindowManager/props";
import { WindowElement } from "components/WindowManager/WindowElement";
import {
  WindowDef,
  WorkspaceStore,
  WorkspaceStoreContext,
} from "mobx/stores/workspaceStore";
import React from "react";
import "@cib/window-manager";
import { TileManager } from "@cib/window-manager";

const WindowManager: React.FC<Props> = (
  props: Props
): React.ReactElement | null => {
  const workspaceStore: WorkspaceStore = React.useContext<WorkspaceStore>(
    WorkspaceStoreContext
  );
  const { isDefaultWorkspace: ready, windows } = props;
  const windowManagerRef: React.Ref<TileManager> = React.createRef<TileManager>();

  return (
    <cib-window-manager class={"workspace"} ref={windowManagerRef}>
      {windows.map(
        (window: WindowDef): React.ReactElement => (
          <WindowElement
            id={window.id}
            store={workspaceStore.getWindowStore(window.id, window.type)}
            type={window.type}
            content={props.getContentRenderer(window.id, window.type)}
            title={props.getTitleRenderer(window.id, window.type)}
            key={window.id}
            minimized={window.minimized}
            geometry={window.geometry}
            fitToContent={window.fitToContent}
            isDefaultWorkspace={ready}
            onLayoutModify={props.onLayoutModify}
            onClose={props.onWindowClose}
          />
        )
      )}
    </cib-window-manager>
  );
};

export { WindowManager };
