import {EntryStatus} from 'interfaces/order';

export const getInputClass = (status: EntryStatus, className?: string): string => {
  const classes: string[] = className ? [className] : [];
  if (status & EntryStatus.Owned)
    classes.push('owned');
  if (status & EntryStatus.Active)
    classes.push('active');
  if (status & EntryStatus.PreFilled)
    classes.push('pre-filled');
  if (status & EntryStatus.PriceEdited)
    classes.push('edited');
  if (status & EntryStatus.Cancelled)
    classes.push('cancelled');
  return classes.join(' ');
};
