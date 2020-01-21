import {ColumnSpec} from 'components/Table/columnSpecification';
import React, {CSSProperties, ReactElement} from 'react';
import {percentage} from 'utils';
import {$$} from 'utils/stringPaster';

export enum BlotterRowTypes {
  Normal, MyFill, MyBankFill, Busted
}

interface Props {
  columns: ColumnSpec[];
  row: { [key: string]: any };
  weight: number;
  type: BlotterRowTypes;
}

const getClassFromRowType = (baseClassName: string, rowType: BlotterRowTypes): string => {
  const classes: string[] = [baseClassName];
  switch (rowType) {
    case BlotterRowTypes.Normal:
      classes.push('normal');
      break;
    case BlotterRowTypes.MyFill:
      classes.push('my-fill');
      break;
    case BlotterRowTypes.MyBankFill:
      classes.push('my-bank-fill');
      break;
    case BlotterRowTypes.Busted:
      classes.push('busted');
      break;
  }
  return classes.join(' ');
};

const Row = (props: Props) => {
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
    <div className={getClassFromRowType('tr', props.type)} id={row.id} key={row.id}>
      {columns.map(columnMapper)}
    </div>
  );
};

export {Row};
