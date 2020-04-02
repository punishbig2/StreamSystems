import { useEffect } from 'react';
import { createAction } from 'redux/actionCreator';
import { ActionTypes } from 'components/PodTile/Row/reducer';
import { FXOAction } from 'redux/fxo-action';
import { useAction } from 'hooks/useAction';

export const usePropsRowOverwrite = (row: { [key: string]: any }) => {
  const [action, dispatch] = useAction<FXOAction<ActionTypes>>();
  useEffect(() => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    if (row) {
      // In case of passing the row statically do this
      dispatch(createAction<ActionTypes>(ActionTypes.SetRow, row));
    }
  }, [row, dispatch]);
  return action;
};
