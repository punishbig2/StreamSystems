import {EntryTypes} from 'interfaces/mdEntry';
import {TOBEntry} from 'interfaces/tobEntry';

export interface TOBHandlers {
  onTenorSelected: (tenor: string) => void;
  onDoubleClick: (type: EntryTypes, data: any) => void;
  onRunButtonClicked: () => void;
  onRefBidsButtonClicked: () => void;
  onRefOfrsButtonClicked: () => void;
  onPriceChange: (entry: TOBEntry) => void;
  onQuantityChange: (entry: TOBEntry, newQuantity: number) => void;
  onUpdateOrder: (entry: TOBEntry) => void;
  onCancelOrder: (entry: TOBEntry) => void;
}
