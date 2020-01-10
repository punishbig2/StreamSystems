import {MDEntry, OrderTypes} from 'interfaces/mdEntry';
import {Order} from 'interfaces/order';
import {TOBTable} from 'interfaces/tobTable';
import {User} from 'interfaces/user';
import {W} from 'interfaces/w';
import {Action} from 'redux';
import {createAction} from 'redux/actionCreator';
import {extractDepth, mdEntryToTOBEntry, toTOBRow} from 'utils/dataParser';
import {getAuthenticatedUser} from 'utils/getCurrentUser';
import {$$} from 'utils/stringPaster';
import {TOBActions} from 'redux/reducers/tobReducer';
import {RowActions} from 'redux/reducers/rowReducer';

import equal from 'deep-equal';

export const emitUpdateOrderEvent = (order: Order) => {
  const type: string = $$(order.uid(), TOBActions.UpdateOrder);
  const event: Event = new CustomEvent(type, {detail: order});
  // Now emit the event so that listeners capture it
  document.dispatchEvent(event);
};

const propagateOrders = (w: W) => {
  const transform: (entry: MDEntry, fallbackType: OrderTypes) => Order = mdEntryToTOBEntry(w);
  const user: User = getAuthenticatedUser();
  const entries: MDEntry[] = w.Entries;
  entries
    .filter((entry: MDEntry) => entry.MDEntryOriginator === user.email)
    .map((entry: MDEntry) => transform(entry, OrderTypes.Invalid))
    .forEach(emitUpdateOrderEvent);
};

const propagateDepth = (w: W) => {
  const {Tenor, Symbol, Strategy} = w;
  const depth: TOBTable = extractDepth(w);
  // Create depths
  const data: { tenor: string, depth: TOBTable } = {tenor: w.Tenor, depth};
  const type: string = $$(Tenor, Symbol, Strategy, TOBActions.UpdateDOB);
  const event: Event = new CustomEvent(type, {detail: data});
  // Now emit the event so that listeners capture it
  document.dispatchEvent(event);
};

let lastTOBW = {};
let lastW = {};
// FIXME: we probably don't need the complexities of redux for these
//        things
export const handlers = {
  W: <A extends Action>(w: W): A | null => {
    const {Tenor, Symbol, Strategy} = w;
    const type: string = $$('__ROW', Tenor, Symbol, Strategy, RowActions.Update);
    // Is this TOB?
    if (w['9712'] === 'TOB') {
      // FIXME: because the backend is sending multiple copies of identical Ws I do this to
      //        "collapse" them into a single one and void unnecessary refreshes to the UI
      if (equal(lastTOBW, w))
        return null;
      lastTOBW = w;
      // Build a per-row action to update a single individual and specific row
      // in a specific table
      // Dispatch the action now
      return createAction(type, toTOBRow(w)) as A;
    } else {
      // FIXME: because the backend is sending multiple copies of identical Ws I do this to
      //        "collapse" them into a single one and void unnecessary refreshes to the UI
      if (equal(lastW, w))
        return null;
      if (!w.Entries) {
        const fixed: W = {
          ...w, Entries: [],
        };
        // Dispatch the action now
        try {
          propagateOrders(fixed);
          // propagateAggregatedSizes(w);
          propagateDepth(fixed);
          // Emit this action because there's no other W message in this case so this
          // is equivalent to the case where `W[9712] === TOB'
          return null;
        } catch (exception) {
          return null;
        }
      } else {
        propagateOrders(w);
        // propagateAggregatedSizes(w);
        propagateDepth(w);
      }
      return null;
    }
  },
};

