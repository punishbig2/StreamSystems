import React, { ReactElement } from 'react';
import { PodTable } from 'interfaces/podTable';
import { Table } from 'components/Table/index';
import columns from 'columns/darkPoolDepth';
import { Cell } from 'components/Table/Cell';
import { ColumnSpec } from 'components/Table/columnSpecification';
import { Order } from 'interfaces/order';
import { getCellWidth } from 'components/Table/helpers';

interface OwnProps {
  data: PodTable | null;
  onCancelOrder: (order: Order) => void;
}

export const DarkPoolTooltip: React.FC<OwnProps> = (props: OwnProps) => {
  const renderRow = (props: any): ReactElement => {
    const { columns, row } = props;
    return (
      <div className={'tr'} key={row.id}>
        {columns.map((column: ColumnSpec) => {
          const name: string = column.name;
          const width: string = getCellWidth(column.width, props.totalWidth, props.containerWidth);
          return (
            <Cell key={name} render={column.render} width={width} {...row} />
          );
        })}
      </div>
    );
  };
  if (props.data === null) return null;
  return (
    <Table
      columns={columns(props.onCancelOrder)}
      scrollable={false}
      renderRow={renderRow}
      rows={props.data}
    />
  );
};
