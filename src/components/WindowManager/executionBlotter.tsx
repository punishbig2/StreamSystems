import messageBlotterColumns, { BlotterTypes } from "columns/messageBlotter";
import { MessageBlotter } from "components/MessageBlotter";
import { Select } from "components/Select";
import { ColumnSpec } from "components/Table/columnSpecification";
import { WindowElement } from "components/WindowManager/WindowElement";
import workareaStore, { WindowTypes } from "mobx/stores/workareaStore";
import React, { ReactElement, useMemo } from "react";
import getStyles, { Styles } from "styles";
import { Role } from "types/role";
import { User } from "types/user";
import { getOptimalWidthFromColumnsSpec } from "utils/getOptimalWidthFromColumnsSpec";
import { WindowStore } from "mobx/stores/windowStore";
import store from "mobx/stores/messagesStore";

interface OwnProps {
  area: ClientRect;
}

export const ExecutionBlotter: React.FC<OwnProps> = (
  props: OwnProps
): ReactElement | null => {
  const { area } = props;
  const user: User = workareaStore.user;
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
  const geometry: ClientRect = new DOMRect(
    0,
    area.height - height + 1,
    Math.max(width, 1200),
    height
  );
  const id: string = "___EX_BLOTTER___";
  const content = (): ReactElement => {
    return (
      <MessageBlotter
        id={id}
        scrollable={true}
        blotterType={BlotterTypes.Executions}
      />
    );
  };
  const { regions } = workareaStore.user;
  const title = (): React.ReactElement => {
    return (
      <div className={"execution-blotter-title"}>
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
    );
  };
  return (
    <WindowElement
      id={id}
      geometry={geometry}
      type={WindowTypes.MessageBlotter}
      area={area}
      fitToContent={false}
      fixed={true}
      content={content}
      title={title}
      isDefaultWorkspace={false}
      store={new WindowStore(id, WindowTypes.MessageBlotter)}
      onClose={() => null}
      onLayoutModify={() => null}
    />
  );
};
