import {AnyAction, Dispatch} from 'redux';
import {Action} from 'redux/action';

export class AsyncAction<T> implements Action<T> {
  private readonly handler: () => Promise<AnyAction>;
  private readonly initial: AnyAction;
  public type: any;

  constructor(handler: () => Promise<AnyAction>, initial: AnyAction) {
    this.initial = initial;
    this.handler = handler;
  }

  public handle = async (dispatch: Dispatch<AnyAction>): Promise<void> => {
    dispatch(this.initial);
    // Execute the handler now
    const final: AnyAction = await this.handler();
    // Dispatch the final action
    dispatch(final);
  };
}
