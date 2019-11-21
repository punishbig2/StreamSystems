import createColumns from 'columns/run';
import {DialogButtons} from 'components/PullRight';
import {RunActions} from 'components/Run/enumerator';
import {useInitializer} from 'components/Run/hooks/useInitializer';
import {useOrderListener} from 'components/Run/hooks/userOrderListener';
import {reducer} from 'components/Run/reducer';
import {Row} from 'components/Run/row';
import {Table} from 'components/Table';
import {EntryTypes} from 'interfaces/mdEntry';
import {EntryStatus, TOBEntry} from 'interfaces/tobEntry';
import {TOBRow} from 'interfaces/tobRow';
import {TOBTable} from 'interfaces/tobTable';
import {User} from 'interfaces/user';
import strings from 'locales';
import React, {ReactElement, useReducer} from 'react';
import {createAction} from 'redux/actionCreator';
import {toRunId} from 'utils';
import {$$} from 'utils/stringPaster';

interface OwnProps {
  id: string;
  toggleOCO: () => void;
  symbol: string;
  strategy: string;
  oco: boolean;
  tenors: string[],
  user: User;
  onClose: () => void;
  onSubmit: (entries: TOBEntry[]) => void;
}

const Run: React.FC<OwnProps> = (props: OwnProps) => {
  const [state, dispatch] = useReducer(reducer, {orders: {}, history: [], defaultBidQty: 10, defaultOfrQty: 10});
  const {symbol, strategy, tenors, user} = props;
  const {email} = user;

  const setTable = (orders: TOBTable) => dispatch(createAction(RunActions.SetTable, orders));
  // Updates a single side of the depth
  const updateSide = (entry: TOBEntry) => {
    const id: string = $$(toRunId(entry.symbol, entry.strategy), entry.tenor);
    switch (entry.type) {
      case EntryTypes.Invalid:
        break;
      case EntryTypes.Ofr:
        dispatch(createAction(RunActions.UpdateOffer, {id, entry}));
        break;
      case EntryTypes.Bid:
        dispatch(createAction(RunActions.UpdateBid, {id, entry}));
        break;
      case EntryTypes.DarkPool:
        break;
    }
  };

  useOrderListener(tenors, symbol, strategy, updateSide);
  useInitializer(tenors, symbol, strategy, email, setTable);

  const onSubmit = () => {
    if (state.orders === null)
      return;
    const eligible: EntryStatus = EntryStatus.PriceEdited | EntryStatus.Cancelled;
    const rows: TOBRow[] = Object.values(state.orders);
    const entries: TOBEntry[] = [
      ...rows.map((value: TOBRow) => value.bid),
      ...rows.map((value: TOBRow) => value.ofr),
    ];
    const selected: TOBEntry[] = entries
      .filter((entry: TOBEntry) => (entry.status & eligible) !== 0)
    ;
    if (selected.length === 0)
      return;
    props.onSubmit(selected);
  };

  if (state.orders === {})
    return (<div>Loading...</div>);

  const renderRow = (props: any): ReactElement | null => {
    const {row} = props;
    return (
      <Row {...props} user={props.user} row={row} defaultBidQty={state.defaultBidQty}
           defaultOfrQty={state.defaultOfrQty}/>
    );
  };

  // This builds the set of columns of the run depth with it's callbacks
  const columns = createColumns({
    onBidChanged: (id: string, value: number) => dispatch(createAction(RunActions.Bid, {id, value})),
    onOfrChanged: (id: string, value: number) => dispatch(createAction(RunActions.Ofr, {id, value})),
    onMidChanged: (id: string, value: number) => dispatch(createAction(RunActions.Mid, {id, value})),
    onSpreadChanged: (id: string, value: number) => dispatch(createAction(RunActions.Spread, {id, value})),
    onOfrQtyChanged: (id: string, value: number) => dispatch(createAction(RunActions.OfferQtyChanged, {id, value})),
    onBidQtyChanged: (id: string, value: number) => dispatch(createAction(RunActions.BidQtyChanged, {id, value})),
    defaultBidQty: {
      value: state.defaultBidQty,
      onChange: (value: number) => dispatch(createAction(RunActions.UpdateDefaultBidQty, value)),
    },
    defaultOfrQty: {
      value: state.defaultOfrQty,
      onChange: (value: number) => dispatch(createAction(RunActions.UpdateDefaultOfrQty, value)),
    },
  });

  return (
    <div className={'run-window'}>
      <div className={'modal-title-bar'}>
        <div className={'half'}>
          <div className={'item'}>{props.symbol}</div>
          <div className={'item'}>{props.strategy}</div>
        </div>
        <div className={'half'}>
          <label>
            <input type={'checkbox'} checked={props.oco} onChange={props.toggleOCO}/><span>OCO</span>
          </label>
        </div>
      </div>
      <Table columns={columns} rows={state.orders} renderRow={renderRow}/>
      <DialogButtons>
        <button type={'submit'} onClick={onSubmit}>{strings.Submit}</button>
        <button onClick={props.onClose}>{strings.Close}</button>
      </DialogButtons>
    </div>
  );
};

export {Run};
