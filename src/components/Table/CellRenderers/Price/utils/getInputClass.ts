import {OrderStatus} from 'interfaces/order';

export const getInputClass = (status: OrderStatus, className?: string): string => {
  const classes: string[] = className !== undefined ? [className] : [];
  if ((status & OrderStatus.PriceEdited) === 0) {
    if ((status & OrderStatus.Owned) !== 0)
      classes.push('owned');
    if ((status & OrderStatus.Active) !== 0)
      classes.push('active');
    if ((status & OrderStatus.PreFilled) !== 0)
      classes.push('pre-filled');
    if ((status & OrderStatus.Cancelled) !== 0)
      classes.push('cancelled');
    if ((status & OrderStatus.SameBank) !== 0)
      classes.push('same-bank');
    if (className === 'size' && (status & OrderStatus.QuantityEdited) !== 0)
      classes.push('edited');
  }
  return classes.join(' ');
};
