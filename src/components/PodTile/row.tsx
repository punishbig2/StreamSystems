import {Cell} from 'components/Table/Cell';
import {ColumnSpec} from 'components/Table/columnSpecification';
import {RowFunctions} from 'components/PodTile/rowFunctions';
import {TOBRowStatus} from 'interfaces/tobRow';
import React, {useEffect, useState} from 'react';
import {RowState} from 'redux/stateDefs/rowState';
import {percentage} from 'utils';
import {W} from 'interfaces/w';
import {SignalRManager} from 'redux/signalR/signalRManager';
import {toTOBRow} from 'utils/dataParser';

interface OwnProps {
  id: string;
  columns: ColumnSpec[];
  weight: number;
  onError: (status: TOBRowStatus) => void;
  displayOnly: boolean;
  rowNumber: number;

  [key: string]: any;
}

/*const cache: { [key: string]: RowFunctions } = {};
const mapDispatchToProps = (dispatch: Dispatch, {id}: OwnProps): RowFunctions => {
  if (!cache[id]) {
    cache[id] = {
      resetStatus: () => dispatch(createAction($$(id, RowActions.ResetStatus))),
    };
  }
  return cache[id];
};

const withRedux: (ignored: any) => any = connect<RowState,
  RowFunctions,
  OwnProps,
  ApplicationState>(
  dynamicStateMapper<RowState, OwnProps, ApplicationState>(),
  mapDispatchToProps,
);*/

const Row = (props: OwnProps & RowState & RowFunctions) => {
  const {id, columns, onError, displayOnly, resetStatus, ...extra} = props;
  const [row, setRow] = useState(props.row);
  const {symbol, strategy, tenor} = props;
  const {status} = row;

  useEffect(() => {
    const signalRManager: SignalRManager = SignalRManager.getInstance();
    const listener = (w: W) => {
      setRow(toTOBRow(w));
    };
    return signalRManager.addPodRowListener(symbol, strategy, tenor, listener);
  }, [symbol, strategy, tenor]);

  useEffect(() => {
    setRow(props.row);
  }, [props.row]);

  useEffect(() => {
    if (status === TOBRowStatus.Normal) {
      return;
    } else if (status === TOBRowStatus.Executed) {
      const {ofr, bid} = row;
      if (ofr.price === null && bid.price === null) return;
      const timer = setTimeout(() => {
        resetStatus();
      }, 5000);
      return () => clearTimeout(timer);
    } else {
      onError(status);
    }
  }, [onError, resetStatus, row, status]);
  const functions: RowFunctions = {
    resetStatus: props.resetStatus,
  };
  const classes: string[] = ['tr'];
  if (status === TOBRowStatus.Executed) {
    classes.push('executed');
  } else if (status !== TOBRowStatus.Normal) {
    classes.push('error');
  }
  return (
    <div className={classes.join(' ')} data-row-number={props.rowNumber}>
      {columns.map((column: ColumnSpec, index: number) => {
        const name: string = column.name;
        const width: string = percentage(column.weight, props.weight);
        return (
          <Cell key={name} render={column.render} width={width} colNumber={index} {...extra} {...row} {...functions}/>
        );
      })}
    </div>
  );
};

export {Row};
