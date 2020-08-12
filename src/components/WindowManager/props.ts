import { MessagesStore } from "mobx/stores/messagesStore";
import { PodTileStore } from "mobx/stores/podTileStore";
import { WindowTypes } from "mobx/stores/workareaStore";
import { WindowDef } from "mobx/stores/workspaceStore";
import React, { ReactElement } from "react";

export interface Props {
  readonly windows: ReadonlyArray<WindowDef>;
  readonly isDefaultWorkspace: boolean;
  readonly getContentRenderer: (
    id: string,
    type: WindowTypes
  ) => (
    props: any,
    store: PodTileStore | MessagesStore | null
  ) => ReactElement | string | null;
  readonly getTitleRenderer: (
    id: string,
    type: WindowTypes
  ) => (
    props: any,
    store: PodTileStore | MessagesStore | null
  ) => ReactElement | string | null;
  readonly onMouseLeave?: (event: React.MouseEvent<HTMLDivElement>) => void;
  readonly onWindowClose: (id: string) => void;
  readonly onUpdateAllGeometries: (geometries: {
    [id: string]: ClientRect;
  }) => void;
  readonly onLayoutModify: () => void;
}
