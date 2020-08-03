import React, { ReactElement } from "react";
import { WindowElement } from "components/WindowManager/WindowElement";
import { MessageBlotter } from "components/MessageBlotter";
import getStyles, { Styles } from "styles";
import { User } from "types/user";
import { getOptimalWidthFromColumnsSpec } from "getOptimalWIdthFromColumnsSpec";
import columns, { BlotterTypes } from "columns/messageBlotter";
import workareaStore, { WindowTypes } from "mobx/stores/workareaStore";

interface OwnProps {
  area: ClientRect;
}

export const ExecutionBlotter: React.FC<OwnProps> = (
  props: OwnProps
): ReactElement | null => {
  const { area } = props;
  const user: User | null = workareaStore.user;
  if (user === null)
    throw new Error(
      "cannot have a execution blotter without an authenticated user"
    );
  const type: "normal" | "broker" = user.isbroker ? "broker" : "normal";
  const width: number = getOptimalWidthFromColumnsSpec(
    columns(BlotterTypes.Executions)[type]
  );
  // Compute the ideal height
  const styles: Styles = getStyles();
  const height: number =
    styles.windowToolbarHeight +
    styles.tableHeaderHeight +
    4 * styles.tableRowHeight;
  const geometry: ClientRect = new DOMRect(
    0,
    area.height - height + 1,
    width,
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
  const title = () => <h1>Execution Blotter</h1>;
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
      onClose={() => null}
      onLayoutModify={() => null}
    />
  );
};
