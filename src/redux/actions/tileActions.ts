import {API} from 'API';
import {TOBEntry} from 'interfaces/tobEntry';
import {Action} from 'redux/action';
import {createAction} from 'redux/actionCreator';
import {AsyncAction} from 'redux/asyncAction';
import {TileActions} from 'redux/constants/tileConstants';

type ActionType = Action<TileActions>;
export const createOrder = (entry: TOBEntry, quantity: number): AsyncAction<any, ActionType> => {
  return new AsyncAction<any, ActionType>(async (): Promise<ActionType> => {
    const result = await API.createOrder(entry, quantity);
    console.log(result);
    return createAction(TileActions.OrderCreated);
  }, createAction(TileActions.CreateOrder));
};
