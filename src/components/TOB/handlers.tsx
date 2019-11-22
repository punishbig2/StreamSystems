import {EntryTypes} from 'interfaces/mdEntry';
import {Order} from 'interfaces/order';
import {AggregatedSz} from 'components/TOB/reducer';

export interface TOBHandlers {
  onTenorSelected: (tenor: string) => void;
  onDoubleClick: (type: EntryTypes, data: any) => void;
  onRunButtonClicked: () => void;
  onRefBidsButtonClicked: () => void;
  onRefOfrsButtonClicked: () => void;
  onPriceChange: (entry: Order) => void;
  onQuantityChange: (entry: Order, newQuantity: number) => void;
  onUpdateOrder: (entry: Order) => void;
  onCancelOrder: (entry: Order) => void;
  aggregatedSz?: AggregatedSz;
}
