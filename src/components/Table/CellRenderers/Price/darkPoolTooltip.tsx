import React, {ReactElement} from 'react';
import {TOBTable} from 'interfaces/tobTable';
import {Table} from 'components/Table/index';
import columns from 'columns/darkPoolDepth';
import {percentage} from 'utils';
import {Cell} from 'components/Table/Cell';
import {ColumnSpec} from 'components/Table/columnSpecification';

interface OwnProps {
  data: TOBTable | null;
}

export const DarkPoolTooltip: React.FC<OwnProps> = (props: OwnProps) => {
  const renderRow = (props: any): ReactElement => {
    const {columns, row} = props;
    console.log(row);
    return (
      <div className={'tr'} key={row.id}>
        {columns.map((column: ColumnSpec) => {
          const name: string = column.name;
          const width: string = percentage(column.weight, props.weight);
          return (
            <Cell key={name} render={column.render} width={width} {...row}/>
          );
        })}
      </div>
    );
  };
  if (props.data === null)
    return null;
  return (
    <Table hideHeaders={true} columns={columns} scrollable={false} renderRow={renderRow} rows={props.data}/>
  );
};
