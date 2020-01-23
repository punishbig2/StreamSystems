import { TOBColumnData } from "components/TOB/data";
import { ColumnSpec } from "components/Table/columnSpecification";
import { DualTableHeader } from "components/dualTableHeader";
import { RowType } from "columns/tobColumns/common";
import { Tenor } from "components/Table/CellRenderers/Tenor";
import React from "react";

export const TenorColumn = (data: TOBColumnData): ColumnSpec => ({
  name: "tenor",
  header: () => <DualTableHeader label={""} />,
  render: ({ tenor }: RowType) => (
    <Tenor
      tenor={tenor}
      onTenorSelected={(tenor: string) => data.onTenorSelected(tenor)}
    />
  ),
  template: "WW",
  weight: 2
});
