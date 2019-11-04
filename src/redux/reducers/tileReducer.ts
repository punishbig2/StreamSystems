import {AnyAction} from 'redux';
import {SignalRActions} from 'redux/constants/signalRConstants';
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

/*const reshape = (message: Message, bids: MDEntry[], offers: MDEntry[]): TOBTable => {
  const reducer = (table: TOBTable, row: TOBRow, index: number): TOBTable => {
    table[index] = row;
    return table;
  };
  const mapper = (other: MDEntry[]) => (entry: MDEntry, index: number): TOBRow => {
    return {
      id: $$(message.Tenor, message.Symbol, message.Strategy),
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
      offer: {
        tenor: message.Tenor,
        product: message.Strategy,
        symbol: message.Symbol,
        user: message.User,
        size: Number(other[index].MDEntrySize),
        price: Number(other[index].MDEntryPx),
        firm: entry.MDFirm,
        type: EntryTypes.Ask,
      },
      mid: null,
      spread: null,
    };
  };
  if (bids.length > offers.length) {
    return bids
      .map(mapper(offers))
      .reduce(reducer, {});
  } else {
    return offers
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
  const offers: MDEntry[] = entries.filter((entry: MDEntry) => entry.MDEntryType === EntryTypes.Ask);
  // Sort all
  bids.sort((a: MDEntry, b: MDEntry) => Number(b.MDEntryPx) - Number(a.MDEntryPx));
  offers.sort((a: MDEntry, b: MDEntry) => Number(a.MDEntryPx) - Number(b.MDEntryPx));
  return {
    id: $$(message.Tenor, message.Symbol, message.Strategy),
    tenor: message.Tenor,
    dob: reshape(message, bids, offers),
    bid: {...convertEntry(message)(bids[0]), table: bids.map(convertEntry(message))},
    offer: {...convertEntry(message)(offers[0]), table: offers.map(convertEntry(message))},
    mid: null,
    spread: null,
  };
};

const miniEntry = (data: TOBEntry) => {
  if (data.type === EntryTypes.Ask) {
    return {offer: data};
  } else {
    return {bid: data};
  }
};*/

export const createTileReducer = (id: string, initialState: TileState = genesisState) => {
  return (state: TileState = initialState, {type, data}: AnyAction) => {
    // const UpdateRow: string = $$(TileActions.UpdateRow, state.product, state.symbol);
    switch (type) {
      case $$(id, TileActions.Initialize):
        return {...state, rows: data};
      case $$(id, TileActions.SetProduct):
        return {...state, product: data};
      case $$(id, TileActions.SetSymbol):
        return {...state, symbol: data};
      case SignalRActions.Connected:
        return {...state, connected: true};
      case SignalRActions.Disconnected:
        return {...state, connected: false};
      case $$(id, TileActions.ToggleOCO):
        return {...state, oco: !state.oco};
      // case $$(id, TileActions.UpdateEntry):
      // FIXME: this should be handled in a row reducer
      // return {...state, rows: {...state.rows, [data.tenor]: {...state.rows[data.tenor], ...miniEntry(data)}}};
      case TileActions.CreateOrder:
        // TODO: show a progress indicator
        return {...state};
      default:
        return state;
    }
  };
};
