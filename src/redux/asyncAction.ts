import { HTTPError } from "API";
import { Dispatch } from "redux";
import { Action } from "redux/action";
import { createAction } from "redux/actionCreator";
import { WorkareaActions } from "redux/constants/workareaConstants";

export class AsyncAction<T, A extends Action = Action<any>>
  implements Action<T> {
  private readonly handler: (dispatch?: Dispatch<A>) => Promise<A | A[]>;
  private readonly initial: A;
  public type: any;

  constructor(
    handler: (dispatch?: Dispatch<A>) => Promise<A | A[]>,
    initial: A
  ) {
    this.initial = initial;
    this.handler = handler;
  }

  public handle = async (dispatch: Dispatch<A>): Promise<void> => {
    dispatch(this.initial);
    // Execute the handler now
    try {
      const final: A | A[] = await this.handler(dispatch);
      if (final instanceof Array) {
        final.forEach(dispatch);
      } else if (final !== null) {
        dispatch(final);
      }
    } catch (error) {
      // FIXME: handle errors correctly
      if (error instanceof HTTPError) {
        // Tricks to convince typescipt that javascript is stupid anyway
        const action: A = createAction<T, A>(
          (WorkareaActions.ServerUnavailable as unknown) as T
        );
        // Dispatch the error action
        dispatch(action);
      } else if (error !== undefined) {
        console.log(`error: `, error);
        if (error.hasOwnProperty("stack")) {
          console.log(error.stack);
        }
      }
    }
  };
}
