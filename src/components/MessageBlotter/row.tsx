import {ColumnSpec} from 'components/Table/columnSpecification';
import React, {ReactElement} from 'react';
import {theme} from 'theme';
import {$$} from 'utils/stringPaster';

interface Props {
  columns: ColumnSpec[];
  row: { [key: string]: any };
}

const Row = (props: any) => {
  const {columns, row} = props;
  const rowHeight: string = `${theme.tableRowSize}px`;
  // Map every column to a cell
  const columnMapper = (totalWidth: number) => (column: ColumnSpec): ReactElement => {
    const style = {width: `${100 * column.weight / totalWidth}%`, lineHeight: rowHeight, height: rowHeight};
    return (
      <div style={style} className={'td'} key={$$(column.name, row.id)}>
        {column.render(row)}
      </div>
    );
  };
  const total: number = columns.reduce((total: number, {weight}: ColumnSpec) => total + weight, 0);
  return (
    <div id={row.id} key={row.id} className={'tr'}>
      {columns.map(columnMapper(total))}
    </div>
  );
};

export {Row};
