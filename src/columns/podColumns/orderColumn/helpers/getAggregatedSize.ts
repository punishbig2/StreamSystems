import {AggregatedSize} from 'components/PodTile/reducer';
import {Order} from 'interfaces/order';
import {OrderTypes} from 'interfaces/mdEntry';

export const getAggregatedSize = (aggregatedSize: AggregatedSize | undefined, order: Order): number | null => {
  if (aggregatedSize) {
    const price: number | null = order.price;
    const key: string | null = price === null ? null : price.toFixed(3);
    const index: 'ofr' | 'bid' = ((type: OrderTypes): 'ofr' | 'bid' => {
      switch (type) {
        case OrderTypes.Bid:
          return 'bid';
        case OrderTypes.Ofr:
          return 'ofr';
        default:
          throw new Error('I cannot find aggregated sizes of non orders');
      }
    })(order.type);
    if (aggregatedSize[order.tenor] && key !== null)
      return aggregatedSize[order.tenor][index][key];
    return order.size;
  } else {
    return order.size;
  }
};
