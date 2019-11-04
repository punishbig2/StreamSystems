import {Message} from 'interfaces/md';
import {EntryTypes, MDEntry} from 'interfaces/mdEntry';
import {TOBEntry} from 'interfaces/tobEntry';
import {TOBRow} from 'interfaces/tobRow';
import {TOBTable} from 'interfaces/tobTable';
import {AnyAction} from 'redux';
import {SignalRActions} from 'redux/constants/signalRActions';
import {TileActions} from 'redux/constants/tileConstants';
import {TileState} from 'redux/stateDefs/tileState';
import {$$} from 'utils/stringPaster';

const genesisState: TileState = {
  connected: false,
  oco: false,
  symbol: '',
  product: '',
  rows: {},
};

const reshape = (message: Message, bids: MDEntry[], asks: MDEntry[]): TOBTable => {
  const reducer = (table: TOBTable, row: TOBRow, index: number): TOBTable => {
    table[index] = row;
    return table;
  };
  const mapper = (other: MDEntry[]) => (entry: MDEntry, index: number): TOBRow => {
    return {
      tenor: message.Tenor,
      bid: {
        tenor: message.Tenor,
        product: message.Strategy,
        symbol: message.Symbol,
        user: message.User,
        size: Number(entry.MDEntrySize),
        price: Number(entry.MDEntryPx),
        firm: entry.MDFirm,
        type: EntryTypes.Bid,
      },
      ask: {
        tenor: message.Tenor,
        product: message.Strategy,
        symbol: message.Symbol,
        user: message.User,
        size: Number(other[index].MDEntrySize),
        price: Number(other[index].MDEntryPx),
        firm: entry.MDFirm,
        type: EntryTypes.Ask,
      },
    };
  };
  if (bids.length > asks.length) {
    return bids
      .map(mapper(asks))
      .reduce(reducer, {});
  } else {
    return asks
      .map(mapper(bids))
      .reduce(reducer, {});
  }
};

const convertEntry = (message: Message) => (original: MDEntry): TOBEntry => {
  return {
    tenor: message.Tenor,
    product: message.Strategy,
    symbol: message.Symbol,
    user: message.User,
    size: Number(original.MDEntrySize),
    price: Number(original.MDEntryPx),
    firm: original.MDFirm,
    type: original.MDEntryType,
  };
};

const toTOBRow = (message: any): TOBRow => {
  const entries: MDEntry[] = message.Entries;
  const bids: MDEntry[] = entries.filter((entry: MDEntry) => entry.MDEntryType === EntryTypes.Bid);
  const asks: MDEntry[] = entries.filter((entry: MDEntry) => entry.MDEntryType === EntryTypes.Ask);
  // Sort all
  bids.sort((a: MDEntry, b: MDEntry) => Number(b.MDEntryPx) - Number(a.MDEntryPx));
  asks.sort((a: MDEntry, b: MDEntry) => Number(a.MDEntryPx) - Number(b.MDEntryPx));
  return {
    tenor: message.Tenor,
    dob: reshape(message, bids, asks),
    bid: {...convertEntry(message)(bids[0]), table: bids.map(convertEntry(message))},
    ask: {...convertEntry(message)(asks[0]), table: asks.map(convertEntry(message))},
  };
};

const miniEntry = (data: TOBEntry) => {
  if (data.type === EntryTypes.Ask) {
    return {ask: data};
  } else {
    return {bid: data};
  }
};

export const createTileReducer = (id: string, initialState: TileState = genesisState) => {
  return (state: TileState = initialState, {type, data}: AnyAction) => {
    const UpdateRow: string = $$(TileActions.UpdateRow, state.product, state.symbol);
    switch (type) {
      case $$(id, TileActions.Initialize):
        return {...state, rows: data};
      case $$(id, TileActions.SetProduct):
        return {...state, product: data};
      case $$(id, TileActions.SetSymbol):
        return {...state, symbol: data};
      case UpdateRow:
        return {...state, rows: {...state.rows, [data.Tenor]: toTOBRow(data)}};
      case SignalRActions.Connected:
        return {...state, connected: true};
      case SignalRActions.Disconnected:
        return {...state, connected: false};
      case $$(id, TileActions.ToggleOCO):
        return {...state, oco: !state.oco};
      case $$(id, TileActions.UpdateEntry):
        return {...state, rows: {...state.rows, [data.tenor]: {...state.rows[data.tenor], ...miniEntry(data)}}};
      case TileActions.CreateOrder:
        // TODO: show a progress indicator
        return {...state};
      default:
        return state;
    }
  };
};
