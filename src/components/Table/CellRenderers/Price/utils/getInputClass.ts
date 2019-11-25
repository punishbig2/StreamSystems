import {OrderStatus} from 'interfaces/order';

export const getInputClass = (status: OrderStatus, className?: string): string => {
  const classes: string[] = className ? [className] : [];
  if (status & OrderStatus.Owned)
    classes.push('owned');
  if (status & OrderStatus.Active)
    classes.push('active');
  if (status & OrderStatus.PreFilled)
    classes.push('pre-filled');
  if (status & OrderStatus.PriceEdited)
    classes.push('edited');
  if (status & OrderStatus.Cancelled)
    classes.push('cancelled');
  return classes.join(' ');
};
