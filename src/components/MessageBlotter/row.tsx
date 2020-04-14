import { ColumnSpec } from 'components/Table/columnSpecification';
import React, { CSSProperties, ReactElement, useEffect, useState } from 'react';
import { $$ } from 'utils/stringPaster';
import { MessageBlotterActions, BlotterTypes } from 'redux/constants/messageBlotterConstants';
import { getCellWidth } from 'components/Table/helpers';
import { DarkPool } from 'interfaces/w';

export enum BlotterRowTypes {
  Normal,
  MyFill,
  MyBankFill,
  Busted
}

interface Props {
  columns: ColumnSpec[];
  row: { [key: string]: any };
  weight: number;
  type: BlotterRowTypes;
  blotterType: BlotterTypes;
  totalWidth: number;
  containerWidth: number;
}

const getClassFromRowType = (baseClassName: string, rowType: BlotterRowTypes, executed: boolean, isDarkPool: boolean): string => {
  const classes: string[] = [baseClassName];
  if (executed)
    classes.push('flash');
  if (isDarkPool)
    classes.push('dark-pool');
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

const Row: React.FC<Props> = (props: Props): ReactElement | null => {
  const { columns, blotterType, row } = props;
  const [executed, setExecuted] = useState<boolean>(false);
  const { ExecID } = row;

  useEffect(() => {
    if (blotterType === BlotterTypes.Executions) {
      let timer: number | null = null;
      const onExecuted = () => {
        setExecuted(true);
        timer = setTimeout(() => {
          setExecuted(false);
        }, 3000);
      };
      const type: string = $$(ExecID, MessageBlotterActions.Executed);
      document.addEventListener(type, onExecuted, true);
      return () => {
        document.removeEventListener(type, onExecuted, true);
        if (timer !== null) {
          clearTimeout(timer);
        }
      };
    }
  }, [ExecID, blotterType]);

  const columnMapper = (column: ColumnSpec): ReactElement => {
    const style: CSSProperties = {
      width: getCellWidth(column.width, props.totalWidth, props.containerWidth),
    };
    return (
      <div className={'td'} key={$$(column.name, row.id)} style={style}>
        {column.render(row)}
      </div>
    );
  };
  if (!row)
    return null;
  const isDarkPool: boolean = row.ExDestination === DarkPool;
  return (
    <div className={getClassFromRowType('tr', props.type, executed, isDarkPool)} id={row.id} key={row.id}>
      {columns.map(columnMapper)}
    </div>
  );
};

export { Row };
