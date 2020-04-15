import { Cell } from 'components/Table/Cell';
import { ColumnSpec } from 'components/Table/columnSpecification';
import { RowFunctions } from 'components/PodTile/rowFunctions';
import React, { useState } from 'react';
import { useOrderActions } from 'components/PodTile/Row/hooks/useOrderActions';
import { useWListener } from 'components/PodTile/Row/hooks/useWListener';
import { usePropsRowOverwrite } from 'components/PodTile/Row/hooks/usePropsRowOverwrite';
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
  const { user } = rowProps;
  // Three identifying props
  const { currency, strategy, tenor, connected } = props;
  const { internalRow } = store;
  const classes: string[] = ['tr'];

  useWListener(currency, strategy, tenor, user, connected, store);
  usePropsRowOverwrite(row, store);
  useOrderActions(currency, strategy, tenor, user, connected, internalRow, store);

  if (internalRow.status !== PodRowStatus.Normal)
    classes.push('error');
  try {
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
  } catch (error) {
    console.log(error);
    return null;
  }
});

