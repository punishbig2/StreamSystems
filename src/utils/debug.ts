import {OrderStatus} from 'interfaces/order';

export const decompose = (status: OrderStatus) => {
  const values: string[] = [];
  for (let i = 1; i < 1 << 13; i = i << 1) {
    switch (status & i) {
      case OrderStatus.Active:
        values.push('Active');
        break;
      case OrderStatus.Cancelled:
        values.push('Cancelled');
        break;
      case OrderStatus.PreFilled:
        values.push('PreFilled');
        break;
      case OrderStatus.PriceEdited:
        values.push('PriceEdited');
        break;
      case OrderStatus.QuantityEdited:
        values.push('QuantityEdited');
        break;
      case OrderStatus.Owned:
        values.push('Owned');
        break;
      case OrderStatus.NotOwned:
        values.push('NotOwned');
        break;
      case OrderStatus.HaveOrders:
        values.push('HaveOrders');
        break;
      case OrderStatus.HasDepth:
        values.push('HasDepth');
        break;
      case OrderStatus.BeingCreated:
        values.push('BeingCreated');
        break;
      case OrderStatus.BeingCancelled:
        values.push('BeingCancelled');
        break;
      case OrderStatus.BeingLoaded:
        values.push('BeingLoaded');
        break;
    }
  }
  return values.join(' | ');
};
