import { ColumnSpec } from "components/Table/columnSpecification";
import { PodRowProps } from "columns/podColumns/common";
import { Tenor } from "components/Table/CellRenderers/Tenor";
import React from "react";
import { PodRowStatus } from "interfaces/podRow";

export const TenorColumn = (): ColumnSpec => ({
  name: "tenor",
  header: () => <div>&nbsp;</div>,
  render: ({ tenor, onTenorSelected, status }: PodRowProps) => {
    if (status !== PodRowStatus.Normal) {
      return (
        <div className={"error-cell"}>
          <i className={"fa fa-exclamation-triangle"} />
        </div>
      );
    }
    return <Tenor tenor={tenor} onTenorSelected={onTenorSelected} />;
  },
  template: "WW",
  width: 2,
});
