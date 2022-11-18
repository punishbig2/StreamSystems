import { RowFunctions } from 'components/PodTile/rowFunctions';
import { Cell } from 'components/Table/Cell';
import { getCellWidth } from 'components/Table/helpers';
import { TableColumn } from 'components/Table/tableColumn';
import { PodRowStore, PodRowStoreContext } from 'mobx/stores/podRowStore';
import { observer } from 'mobx-react';
import React, { useEffect, useRef } from 'react';
import { PodRowStatus } from 'types/podRow';

interface OwnProps {
  readonly id: string;
  readonly columns: TableColumn[];
  readonly weight: number;
  readonly rowNumber: number;
  readonly defaultSize: number;
  readonly minimumSize: number;
  readonly connected: boolean;
  readonly onTenorSelected: (tenor: string) => void;

  readonly [key: string]: any;
}

type Props = OwnProps & RowFunctions;

export const Row: React.FC<Props> = observer((props: Props) => {
  const store = useRef<PodRowStore>(
    new PodRowStore(props.currency, props.strategy, props.tenor)
  ).current;

  const { id, columns, row, totalWidth, containerWidth, ...rowProps } = props;
  const { internalRow } = store;
  const classes: string[] = ['tr'];

  useEffect((): void => {
    store.setInternalRow(row);
  }, [store, row]);

  if (internalRow.status !== PodRowStatus.Normal) classes.push('error');
  return (
    <PodRowStoreContext.Provider value={store}>
      <div id={props.id} className={classes.join(' ')} data-row-number={props.rowNumber}>
        {columns.map((column: TableColumn, index: number) => {
          const width: string = getCellWidth(column.width, totalWidth);
          const name: string = column.name;

          return (
            <Cell
              key={name}
              render={column.render}
              className={column.className}
              colNumber={index}
              width={width}
              {...rowProps}
              {...internalRow}
            />
          );
        })}
      </div>
    </PodRowStoreContext.Provider>
  );
});
