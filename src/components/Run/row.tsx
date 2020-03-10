import {Cell} from 'components/Table/Cell';
import {ColumnSpec} from 'components/Table/columnSpecification';
import {NavigateDirection} from 'components/NumericInput/navigateDirection';
import {PodRow, PodRowStatus} from 'interfaces/podRow';
import {User} from 'interfaces/user';
import React, {useEffect} from 'react';
import {RowState} from 'redux/stateDefs/rowState';
import {percentage} from 'utils';

interface OwnProps {
  id: string;
  columns: ColumnSpec[];
  user?: User;
  fixedRow?: PodRow;
  weight: number;
  navigation: (target: HTMLInputElement, direction: NavigateDirection) => void;
  rowNumber?: number;
}

const Row = (props: OwnProps & RowState) => {
  const {columns, row, fixedRow, user} = props;
  const {status} = row;
  useEffect(() => {
    // TODO: show an error message within the run and set it by using a browser custom event
  }, [status]);
  return (
    <div className={'tr' + (row.status === PodRowStatus.InvertedMarketsError ? ' error' : '')}
         data-row-number={props.rowNumber}>
      {columns.map((column: ColumnSpec, index: number) => {
        const width: string = percentage(column.weight, props.weight);
        const name: string = column.name;
        return (
          <Cell key={name}
                width={width}
                user={user}
                render={column.render}
                colNumber={index}
                {...(fixedRow || row)}/>
        );
      })}
    </div>
  );
};

export {Row};
