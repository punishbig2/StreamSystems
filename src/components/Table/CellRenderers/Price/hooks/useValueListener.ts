import {EntryStatus} from 'interfaces/order';
import {useEffect} from 'react';
import {priceFormatter} from 'utils/priceFormatter';

export const useValueListener = (value: number | null, setValue: (value: string, status: EntryStatus) => void) => {
  useEffect(() => {
    setValue(priceFormatter(value), EntryStatus.None & ~EntryStatus.PriceEdited);
  }, [value, setValue]);
};
