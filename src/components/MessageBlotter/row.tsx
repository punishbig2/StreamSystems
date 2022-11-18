import { BlotterTypes } from 'columns/messageBlotter';
import { getCellWidth } from 'components/Table/helpers';
import { TableColumn } from 'components/Table/tableColumn';
import React, { CSSProperties, ReactElement, useEffect, useState } from 'react';
import { DarkPool } from 'types/w';
import { $$ } from 'utils/stringPaster';

export enum BlotterRowTypes {
  Normal,
  MyFill,
  MyBankFill,
  Busted,
}

interface Props {
  readonly columns: TableColumn[];
  readonly row: { [key: string]: any } | null;
  readonly weight: number;
  readonly type: BlotterRowTypes;
  readonly selected?: boolean;
  readonly blotterType: BlotterTypes;
  readonly totalWidth: number;
  readonly containerWidth: number;
  readonly onClick?: (deal: any) => void;
}

const getClassFromRowType = (
  baseClassName: string,
  rowType: BlotterRowTypes,
  executed: boolean,
  isDarkPool: boolean
): string => {
  const classes: string[] = [baseClassName];
  if (executed) classes.push('flash');
  if (isDarkPool) classes.push('dark-pool');
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
  return classes.filter((item: string): boolean => item.trim() !== '').join(' ');
};

const Row: React.FC<Props> = (props: Props): ReactElement | null => {
  const { columns, blotterType, row } = props;
  const [executed, setExecuted] = useState<boolean>(false);
  const ExecID: string | null = row !== null ? row.ExecID : null;

  useEffect(() => {
    if (ExecID === null || blotterType !== BlotterTypes.Executions) return;
    let timer = setTimeout((): void => {}, 0);
    const onExecuted = (): void => {
      setExecuted(true);
      timer = setTimeout(() => {
        setExecuted(false);
      }, 10000);
    };
    const type: string = $$(ExecID, 'executed');

    document.addEventListener(type, onExecuted, true);
    return () => {
      document.removeEventListener(type, onExecuted, true);
      if (timer !== null) {
        clearTimeout(timer);
      }
      setExecuted(false);
    };
  }, [ExecID, blotterType]);

  const columnMapper =
    (rowID: string) =>
    (column: TableColumn): ReactElement => {
      const style: CSSProperties = {
        width: getCellWidth(column.width, props.totalWidth),
      };

      const id: string = $$(column.name, rowID);
      return (
        <div className="td" id={id} key={id} style={style}>
          {column.render({ message: row, deal: row })}
        </div>
      );
    };

  if (!row) {
    return (
      <div
        className={getClassFromRowType('tr', props.type, executed, false)}
        id="__INSERT_ROW__"
        key="__INSERT_ROW__"
      >
        {columns.map(columnMapper('__INSERT_ROW__'))}
      </div>
    );
  }
  const isSelected: boolean = props.selected !== undefined && props.selected;
  const isDarkPool: boolean = row.ExDestination === DarkPool;
  const onClick = (): void => {
    if (!props.onClick) return;
    props.onClick(row);
  };
  return (
    <div
      onClick={onClick}
      className={[
        getClassFromRowType('tr', props.type, executed, isDarkPool),
        props.onClick ? 'clickable' : '',
        isSelected ? 'selected' : '',
      ].join(' ')}
      id={row.id}
      key={row.id}
    >
      {columns.map(columnMapper(row.id))}
    </div>
  );
};

export { Row };
