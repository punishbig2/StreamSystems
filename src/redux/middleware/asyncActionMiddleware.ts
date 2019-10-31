import {AnyAction, Dispatch, MiddlewareAPI} from 'redux';
import {AsyncAction} from 'redux/asyncAction';

export const asyncActionMiddleware = (store: MiddlewareAPI) =>
  (next: Dispatch<AnyAction>) =>
    (action: AnyAction) => {
      // FIXME: this will not work
      if (action instanceof AsyncAction) {
        // TODO: debounce this to give a better UX
        // noinspection JSIgnoredPromiseFromCall
        action.handle(store.dispatch);
        // This is the end of the store for the action, we
        // don't want any other middleware to handle this action
        // nor the reducers because these actions just generate
        // other actions by means of `dispatch'
      } else {
        return next(action);
      }
    };
