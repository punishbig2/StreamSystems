import {Action, AnyAction, Dispatch} from 'redux';

export class AsyncAction<T, A extends Action = AnyAction> implements Action<T> {
  private readonly handler: (dispatch: Dispatch<A>) => Promise<A>;
  private readonly initial: A;
  public type: any;

  constructor(handler: (dispatch?: Dispatch<A>) => Promise<A>, initial: A) {
    this.initial = initial;
    this.handler = handler;
  }

  public handle = async (dispatch: Dispatch<A>): Promise<void> => {
    dispatch(this.initial);
    // Execute the handler now
    try {
      const final: A = await this.handler(dispatch);
      // Dispatch the final action
      dispatch(final);
    } catch (error) {
      // FIXME: handle errors correctly
      console.log(error);
    }
  };
}
