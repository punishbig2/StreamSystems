import { Geometry, Tile } from "@cib/windows-manager";
import messageBlotterColumns, { BlotterTypes } from "columns/messageBlotter";
import { MessageBlotter } from "components/MessageBlotter";
import { Select } from "components/Select";
import { TableColumn } from "components/Table/tableColumn";
import { MessagesStore, MessagesStoreContext } from "mobx/stores/messagesStore";
import workareaStore from "mobx/stores/workareaStore";
import React, { ReactElement, useMemo } from "react";
import { Role } from "types/role";
import { User } from "types/user";
import { getOptimalWidthFromColumnsSpec } from "utils/getOptimalWidthFromColumnsSpec";
import { idealBlotterHeight } from "utils/idealBlotterHeight";

interface Props {
  readonly boundingRect: DOMRect;
}

export const ExecutionBlotter: React.FC<Props> = (
  props: Props
): ReactElement | null => {
  const { boundingRect } = props;
  const messagesStore: MessagesStore = React.useContext<MessagesStore>(
    MessagesStoreContext
  );
  const user: User = workareaStore.user;
  const [tile, setTile] = React.useState<Tile | null>(null);
  const isBroker: boolean = useMemo((): boolean => {
    const { roles } = user;
    return roles.includes(Role.Broker);
  }, [user]);
  const type: "normal" | "broker" = React.useMemo(
    (): "normal" | "broker" => (isBroker ? "broker" : "normal"),
    [isBroker]
  );
  const columns = React.useMemo(
    (): ReadonlyArray<TableColumn> =>
      messageBlotterColumns(BlotterTypes.Executions)[type],
    [type]
  );
  const width: number = getOptimalWidthFromColumnsSpec(columns);
  // Compute the ideal height
  const height: number = idealBlotterHeight();
  const geometry: Geometry = React.useMemo(
    (): Geometry =>
      new Geometry(
        0,
        boundingRect.bottom - height,
        Math.max(width, 900),
        height
      ),
    [height, boundingRect.bottom, width]
  );
  React.useEffect((): void => {
    if (tile === null) return;
    tile.setGeometry(geometry);
  }, [geometry, tile]);
  const { regions } = workareaStore.user;
  return (
    <cib-window ref={setTile} scrollable static>
      <div slot={"toolbar"} className={"execution-blotter-title"}>
        <h1>Execution Blotter</h1>
        <div className={"right-panel"}>
          <h3>CCY Group</h3>
          <Select
            value={messagesStore.ccyGroupFilter}
            list={[
              { name: "All" },
              ...regions.map((ccyGroup): {
                name: string;
              } => ({ name: ccyGroup })),
            ]}
            onChange={(value: string): void =>
              messagesStore.setCCYGroupFilter(value)
            }
          />
        </div>
      </div>
      <div slot={"content"} className={"window-content"}>
        <MessageBlotter
          id={"executions"}
          blotterType={BlotterTypes.Executions}
        />
      </div>
    </cib-window>
  );
};
