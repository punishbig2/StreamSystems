import {MDEntry} from 'interfaces/mdEntry';
import {TOBEntry} from 'interfaces/tobEntry';
import {TOBTable} from 'interfaces/tobTable';
import {User} from 'interfaces/user';
import {W} from 'interfaces/w';
import {Action} from 'redux';
import {createAction} from 'redux/actionCreator';
import {RowActions} from 'redux/constants/rowConstants';
import {TOBActions} from 'redux/constants/tobConstants';
import {toRowId} from 'utils';
import {extractDepth, toTOBRow, transformer} from 'utils/dataParser';
import {getAuthenticatedUser} from 'utils/getCurrentUser';
import {$$} from 'utils/stringPaster';

export const emitUpdateOrderEvent = (order: TOBEntry) => {
  const type: string = $$(order.tenor, order.symbol, order.strategy, TOBActions.UpdateOrders);
  const event: Event = new CustomEvent(type, {detail: order});
  // Now emit the event so that listeners capture it
  document.dispatchEvent(event);
};

const propagateOrders = (w: W) => {
  const transform: (entry: MDEntry) => TOBEntry = transformer(w);
  const user: User = getAuthenticatedUser();
  const entries: MDEntry[] = w.Entries;
  entries
    .filter((entry: MDEntry) => entry.MDEntryOriginator === user.email)
    .map((entry: MDEntry) => transform(entry))
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

export const handlers = {
  W: <A extends Action>(w: W): A => {
    const {Tenor, Symbol, Strategy} = w;
    // Is this TOB?
    if (w['9712'] === 'TOB') {
      console.log(w);
      // Build a per-row action to update a single individual and specific row
      // in a specific table
      const type: string = $$(toRowId(Tenor, Symbol, Strategy), RowActions.Update);
      // Dispatch the action now
      return createAction(type, toTOBRow(w));
    } else {
      propagateOrders(w);
      propagateDepth(w);
      // FIXME: we probably don't need the complexities of redux for these
      //        things
      return createAction('');
    }
  },
};
