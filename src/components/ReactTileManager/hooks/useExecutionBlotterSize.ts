import messageBlotterColumns, { BlotterTypes } from "columns/messageBlotter";
import { TableColumn } from "components/Table/tableColumn";
import workareaStore from "mobx/stores/workareaStore";
import React, { useMemo } from "react";
import { Role } from "types/role";
import { User } from "types/user";
import { getOptimalWidthFromColumnsSpec } from "utils/getOptimalWidthFromColumnsSpec";
import { idealBlotterHeight } from "utils/idealBlotterHeight";
import { Size } from "utils/windowUtils";

export const useExecutionBlotterSize = (): Size => {
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
    (): ReadonlyArray<TableColumn> =>
      messageBlotterColumns(BlotterTypes.Executions)[type],
    [type]
  );
  return React.useMemo(
    () => ({
      width: getOptimalWidthFromColumnsSpec(columns),
      // Compute the ideal height
      height: idealBlotterHeight(),
    }),
    [columns]
  );
};
