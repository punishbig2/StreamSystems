import {EntryStatus} from 'interfaces/order';
import {useEffect} from 'react';

export const useStatusUpdater = (status: EntryStatus, update: (status: EntryStatus) => void) => {
  useEffect(() => update(status), [status, update]);
};
