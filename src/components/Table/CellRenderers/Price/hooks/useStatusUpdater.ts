import {EntryStatus} from 'interfaces/tobEntry';
import {useEffect} from 'react';

export const useStatusUpdater = (status: EntryStatus, update: (status: EntryStatus) => void) => {
  useEffect(() => update(status), [status, update]);
};
