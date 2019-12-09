import {AggregatedSz} from 'components/TOB/reducer';
import {OrderTypes} from 'interfaces/mdEntry';
import {Order} from 'interfaces/order';

export interface TOBData {
  onTenorSelected: (tenor: string) => void;
  onDoubleClick: (type: OrderTypes, data: any) => void;
  onRefBidsButtonClicked: () => void;
  onRefOfrsButtonClicked: () => void;
  onOrderModified: (entry: Order) => void;
  onQuantityChange: (entry: Order, newQuantity: number, input: HTMLInputElement) => void;
  onCancelOrder: (entry: Order, cancelRelated: boolean) => void;
  onTabbedOut: (input: HTMLInputElement, type: OrderTypes) => void;
  aggregatedSz?: AggregatedSz;
  buttonsEnabled: boolean;
}
