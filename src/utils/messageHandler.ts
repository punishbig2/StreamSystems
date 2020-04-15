/*import { MDEntry, OrderTypes } from 'interfaces/mdEntry';
import { Order } from 'interfaces/order';
import { PodTable } from 'interfaces/podTable';
import { User } from 'interfaces/user';
import { W, DarkPool, isPodW } from 'interfaces/w';
import { Action } from 'redux';
import { extractDepth, mdEntryToTOBEntry } from 'utils/dataParser';
import { $$ } from 'utils/stringPaster';
import { PodTileActions } from 'redux/reducers/podTileReducer';

import equal from 'deep-equal';
import { DummyAction } from 'redux/store';

export const emitUpdateOrderEvent = (order: Order) => {
  const type: string = $$(order.uid(), PodTileActions.UpdateOrder);
  const event: Event = new CustomEvent(type, { detail: order });
  // Now emit the event so that listeners capture it
  document.dispatchEvent(event);
};

const propagateOrders = (w: W, user: User) => {
  const transform: (
    entry: MDEntry,
    fallbackType: OrderTypes,
  ) => Order = mdEntryToTOBEntry(w, user);
  const entries: MDEntry[] = w.Entries;
  entries
    .filter((entry: MDEntry) => entry.MDEntryOriginator === user.email)
    .map((entry: MDEntry) => transform(entry, OrderTypes.Invalid))
    .forEach(emitUpdateOrderEvent);
};

export const propagateDepth = (w: W, user: User) => {
  const { Tenor, Symbol, Strategy } = w;
  const depth: PodTable = extractDepth(w, user);
  // Create depth
  const data: { tenor: string; depth: PodTable } = { tenor: w.Tenor, depth };
  const type: string = $$(Symbol, Strategy, Tenor, PodTileActions.UpdateDOB);
  const event: Event = new CustomEvent(type, { detail: data });
  // Now emit the event so that listeners capture it
  document.dispatchEvent(event);
};

let lastTOBW = {};
let lastW = {};
// FIXME: we probably don't need the complexities of redux for these
//        things
export const handlers = {
  W: <A extends Action>(w: W, user: User, isDarkPool: boolean = false): A | null => {
    // const {Tenor, Symbol, Strategy} = w;
    // const type: string = $$('__ROW', Tenor, Symbol, Strategy, RowActions.Update);
    // Is this TOB?
    if (isPodW(w)) {
      // FIXME: because the backend is sending multiple copies of identical Ws I do this to
      //        "collapse" them into a single one and void unnecessary refreshes to the UI
      if (equal(lastTOBW, w)) return null;
      lastTOBW = w;
      if (isDarkPool || w.ExDestination === DarkPool) {
        return DummyAction as A; // createAction($$(type, DarkPool), toTOBRow(w)) as A;
      } else {
        return DummyAction as A; // createAction(type, toTOBRow(w)) as A;
      }
    } else {
      // FIXME: because the backend is sending multiple copies of identical Ws I do this to
      //        "collapse" them into a single one and void unnecessary refreshes to the UI
      if (equal(lastW, w)) return null;
      if (isDarkPool || w.ExDestination === DarkPool) {
        const type: string = $$(w.Tenor, w.Symbol, w.Strategy, 'update-dark-pool-depth');
        const event: Event = new CustomEvent(type, { detail: extractDepth(w, user) });
        // Now emit the event so that listeners capture it
        document.dispatchEvent(event);
        return null;
      } else if (!w.Entries) {
        const fixed: W = {
          ...w,
          Entries: [],
        };
        // Dispatch the action now
        try {
          propagateOrders(fixed, user);
          // propagateAggregatedSizes(w);
          propagateDepth(fixed, user);
          // Emit this action because there's no other W message in this case so this
          // is equivalent to the case where `W[9712] === TOB'
          return null;
        } catch (exception) {
          return null;
        }
      } else {
        propagateOrders(w, user);
        // propagateAggregatedSizes(w);
        propagateDepth(w, user);
      }
      return null;
    }
  },
};*/
export const ignore = 0;
