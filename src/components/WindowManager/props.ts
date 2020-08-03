import { MessagesStore } from "mobx/stores/messagesStore";
import { PodTileStore } from "mobx/stores/podTileStore";
import { WindowTypes } from "mobx/stores/workareaStore";
import { WindowDef } from "mobx/stores/workspaceStore";
import React, { ReactElement } from "react";

export interface Props {
  toast: string | null;
  windows: WindowDef[];
  isDefaultWorkspace: boolean;
  getContentRenderer: (
    id: string,
    type: WindowTypes
  ) => (
    props: any,
    store: PodTileStore | MessagesStore | null
  ) => ReactElement | string | null;
  getTitleRenderer: (
    id: string,
    type: WindowTypes
  ) => (
    props: any,
    store: PodTileStore | MessagesStore | null
  ) => ReactElement | string | null;
  onMouseLeave?: (event: React.MouseEvent<HTMLDivElement>) => void;
  onWindowClose: (id: string) => void;
  onClearToast: () => void;
  onUpdateAllGeometries: (geometries: { [id: string]: ClientRect }) => void;
  onLayoutModify: () => void;
}
