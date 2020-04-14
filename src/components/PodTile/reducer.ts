import { PodTable } from 'interfaces/podTable';

export interface State {
  depths: { [key: string]: PodTable };
  tenor: string | null;
}

export enum ActionTypes {
  InsertDepth,
  SetCurrentTenor,
}

export const reducer = (state: State, { type, data }: { type: ActionTypes; data: any }): State => {
  switch (type) {
    case ActionTypes.InsertDepth:
      return { ...state, depths: { ...state.depths, [data.tenor]: data.depth } };
    case ActionTypes.SetCurrentTenor:
      if (data && !state.depths[data]) return state;
      return { ...state, tenor: data };
    default:
      return state;
  }
};
