import { RowProps } from "components/MiddleOffice/DealBlotter/row";
import { OverlayScrollbarsComponent } from "overlayscrollbars-react";
import React from "react";

interface Props {
  readonly scrollable: boolean;
  readonly renderRow: (
    props: RowProps,
    index?: number
  ) => React.ReactElement | null;
  readonly [key: string]: any;
}

export const TableBody: React.FC<Props> = (
  props: Props
): React.ReactElement => {
  const { rows = [] } = props;
  if (rows.length === 0) {
    return (
      <div className={"empty-table"}>
        <h1>There's no data yet</h1>
      </div>
    );
  }
  if (props.scrollable) {
    return (
      <OverlayScrollbarsComponent className={"tbody"}>
        {rows.map((data: any): any => {
          const { row } = data;
          const rowProps = {
            ...data,
            selected: row.id === props.selectedRow,
          };
          return props.renderRow(rowProps);
        })}
      </OverlayScrollbarsComponent>
    );
  } else {
    return (
      <div className={"tbody"}>
        {rows.map((data: any): any => {
          const { row } = data;
          const rowProps = {
            ...data,
            selected: row.id === props.selectedRow,
          };
          return props.renderRow(rowProps);
        })}
      </div>
    );
  }
};
