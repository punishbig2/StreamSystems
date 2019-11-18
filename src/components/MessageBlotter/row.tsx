import {ColumnSpec} from 'components/Table/columnSpecification';
import React, {CSSProperties, ReactElement} from 'react';
import {percentage} from 'utils';
import {$$} from 'utils/stringPaster';

interface Props {
  columns: ColumnSpec[];
  row: { [key: string]: any };
  weight: number;
}

const Row = (props: any) => {
  const {columns, row} = props;
  const columnMapper = (column: ColumnSpec): ReactElement => {
    const style: CSSProperties = {width: percentage(column.weight, props.weight)};
    return (
      <div className={'td'} key={$$(column.name, row.id)} style={style}>
        {column.render(row)}
      </div>
    );
  };
  return (
    <div className={'tr'} id={row.id} key={row.id}>
      {columns.map(columnMapper)}
    </div>
  );
};

export {Row};
