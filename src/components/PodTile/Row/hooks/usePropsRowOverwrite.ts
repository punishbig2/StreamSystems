import { useEffect } from 'react';
import { PodRowStore } from 'mobx/stores/podRowStore';
import { PodRow } from 'interfaces/podRow';

export const usePropsRowOverwrite = (row: PodRow, store: PodRowStore) => {
  useEffect(() => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    if (row) {
      // In case of passing the row statically do this
      store.setInternalRow(row);
    }
  }, [row, store]);
};
