import { NavigateDirection } from 'components/NumericInput/navigateDirection';
import { Cell } from 'components/Table/Cell';
import { getCellWidth } from 'components/Table/helpers';
import { TableColumn } from 'components/Table/tableColumn';
import React, { useEffect } from 'react';
import { RowState } from 'stateDefs/rowState';
import { PodRow, PodRowStatus } from 'types/podRow';
import { User } from 'types/user';

interface OwnProps {
  id: string;
  columns: TableColumn[];
  user?: User;
  fixedRow?: PodRow;
  width: number;
  navigation: (target: HTMLInputElement, direction: NavigateDirection) => void;
  rowNumber?: number;
  totalWidth: number;
  containerWidth: number;
}

const Row: React.FC<OwnProps & RowState> = (props: OwnProps & RowState): React.ReactElement => {
  const { columns, row, fixedRow, totalWidth, user } = props;
  const { status } = row;
  useEffect(() => {
    // TODO: show an error message within the run and set it by using a browser custom event
  }, [status]);
  return (
    <div
      className={'tr' + (row.status === PodRowStatus.InvertedMarketsError ? ' error' : '')}
      data-row-number={props.rowNumber}
    >
      {columns.map((column: TableColumn, index: number) => {
        const width: string = getCellWidth(column.width, totalWidth);
        const name: string = column.name;
        return (
          <Cell
            key={name}
            width={width}
            user={user}
            render={column.render}
            colNumber={index}
            {...(fixedRow || row)}
          />
        );
      })}
    </div>
  );
};

export { Row };
