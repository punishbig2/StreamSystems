import { Cell } from 'components/Table/Cell';
import { ColumnSpec } from 'components/Table/columnSpecification';
import { RowFunctions } from 'components/PodTile/rowFunctions';
import React, { useState, useEffect } from 'react';
import { useWListener } from 'components/PodTile/Row/hooks/useWListener';
import { getCellWidth } from 'components/Table/helpers';
import { PodRowStore } from 'mobx/stores/podRowStore';
import { observer } from 'mobx-react';
import { PodRowStatus } from 'interfaces/podRow';

interface OwnProps {
  id: string;
  columns: ColumnSpec[];
  weight: number;
  rowNumber: number;
  defaultSize: number;
  minimumSize: number;
  connected: boolean;
  onTenorSelected: (tenor: string) => void;

  [key: string]: any;
}

type Props = OwnProps & RowFunctions;

export const Row: React.FC<Props> = observer((props: Props) => {
  const [store] = useState(new PodRowStore(props.currency, props.strategy, props.tenor));
  const { id, columns, row, totalWidth, containerWidth, ...rowProps } = props;
  // Three identifying props
  const { currency, strategy, tenor } = rowProps;
  const { internalRow } = store;
  const classes: string[] = ['tr'];

  useWListener(currency, strategy, tenor, store);
  useEffect(() => {
    store.setInternalRow(row);
  }, [store, row]);

  if (internalRow.status !== PodRowStatus.Normal)
    classes.push('error');
  return (
    <div className={classes.join(' ')} data-row-number={props.rowNumber}>
      {columns.map((column: ColumnSpec, index: number) => {
        const width: string = getCellWidth(column.width, totalWidth, containerWidth);
        const name: string = column.name;
        return (
          <Cell key={name}
                render={column.render}
                width={width}
                colNumber={index}
                className={column.className}
                rowStore={store}
                {...rowProps}
                {...internalRow}/>
        );
      })}
    </div>
  );
});

