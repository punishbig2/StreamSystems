import {AggregatedSz} from 'components/TOB/reducer';
import {EntryTypes} from 'interfaces/mdEntry';
import {Order} from 'interfaces/order';

export interface TOBData {
  onTenorSelected: (tenor: string) => void;
  onDoubleClick: (type: EntryTypes, data: any) => void;
  onRunButtonClicked: () => void;
  onRefBidsButtonClicked: () => void;
  onRefOfrsButtonClicked: () => void;
  onOrderModified: (entry: Order) => void;
  onQuantityChange: (entry: Order, newQuantity: number) => void;
  onCancelOrder: (entry: Order, cancelRelated: boolean) => void;
  onTabbedOut: (input: HTMLInputElement) => void;
  aggregatedSz?: AggregatedSz;
  buttonsEnabled: boolean;
}
