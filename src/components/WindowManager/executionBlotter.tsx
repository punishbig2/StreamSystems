import { Geometry, Tile } from "@cib/windows-manager";
import messageBlotterColumns, { BlotterTypes } from "columns/messageBlotter";
import { MessageBlotter } from "components/MessageBlotter";
import { Select } from "components/Select";
import { ColumnSpec } from "components/Table/columnSpecification";
import store from "mobx/stores/messagesStore";
import workareaStore from "mobx/stores/workareaStore";
import React, { ReactElement, useMemo } from "react";
import getStyles, { Styles } from "styles";
import { Role } from "types/role";
import { User } from "types/user";
import { getOptimalWidthFromColumnsSpec } from "utils/getOptimalWidthFromColumnsSpec";
import appStyles from "styles";

interface Props {
  readonly boundingRect: DOMRect;
}

export const ExecutionBlotter: React.FC<Props> = (
  props: Props
): ReactElement | null => {
  const { boundingRect } = props;
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
    (): ReadonlyArray<ColumnSpec> =>
      messageBlotterColumns(BlotterTypes.Executions)[type],
    [type]
  );
  const width: number = getOptimalWidthFromColumnsSpec(columns);
  // Compute the ideal height
  const styles: Styles = getStyles();
  const height: number =
    styles.windowToolbarHeight +
    styles.tableHeaderHeight +
    4 * styles.tableRowHeight;
  const geometry: Geometry = React.useMemo(
    (): Geometry =>
      new Geometry(
        0,
        boundingRect.bottom - height - appStyles().windowFooterSize - 3,
        Math.max(width, 900),
        height
      ),
    [height, boundingRect.bottom, width]
  );
  React.useEffect((): void => {
    if (tile === null) return;
    tile.setGeometry(geometry);
  }, [geometry, tile]);
  const id: string = "___EX_BLOTTER___";
  const { regions } = workareaStore.user;
  return (
    <cib-window ref={setTile} scroll-y fixed-position fixed-size>
      <div slot={"toolbar"} className={"execution-blotter-title"}>
        <h1>Execution Blotter</h1>
        <div className={"right-panel"}>
          <h3>CCY Group</h3>
          <Select
            value={store.ccyGroupFilter}
            list={[
              { name: "All" },
              ...regions.map((ccyGroup): {
                name: string;
              } => ({ name: ccyGroup })),
            ]}
            onChange={(value: string): void => store.setCCYGroupFilter(value)}
          />
        </div>
      </div>
      <div slot={"content"} className={"window-content"}>
        <MessageBlotter
          id={id}
          scrollable={true}
          blotterType={BlotterTypes.Executions}
        />
      </div>
    </cib-window>
  );
};
