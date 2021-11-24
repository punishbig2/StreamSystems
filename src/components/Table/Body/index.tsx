import { RowProps } from "components/MiddleOffice/DealBlotter/row";
import VirtualizedList from "@dwqs/react-virtual-list";
import React from "react";

interface OwnProps {
  readonly scrollable: boolean;
  readonly renderRow: (
    props: RowProps,
    index?: number
  ) => React.ReactElement | null;

  readonly [key: string]: any;
}

type Props = React.PropsWithRef<OwnProps>;

export const TableBody: React.FC<Props> = React.forwardRef(
  (props: Props, ref: React.Ref<any>): React.ReactElement => {
    const { rows = [] } = props;
    if (rows.length === 0) {
      return (
        <div className={"empty-table"}>
          <h1>There's no data yet</h1>
        </div>
      );
    }

    const renderItem = (options: any): React.ReactElement | null => {
      const data = rows[options.index];
      if (!data) return null;

      const { row } = data;
      const rowProps = {
        ...data,
        selected: row.id === props.selectedRow,
      };

      return props.renderRow(rowProps);
    };

    return (
      <div ref={ref} className={"tbody"}>
        <VirtualizedList
          itemCount={rows.length}
          estimatedItemHeight={20}
          renderItem={renderItem}
        />
      </div>
    );
  }
);
