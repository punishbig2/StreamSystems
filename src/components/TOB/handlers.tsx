import {EntryTypes} from 'interfaces/mdEntry';
import {TOBEntry} from 'interfaces/tobEntry';

export interface TOBHandlers {
  onTenorSelected: (tenor: string) => void;
  onDoubleClick: (type: EntryTypes, data: any) => void;
  onRunButtonClicked: () => void;
  onRefBidsButtonClicked: () => void;
  onRefOfrsButtonClicked: () => void;
  onPriceBlur: (entry: TOBEntry) => void;
  onUpdateOrder: (entry: TOBEntry) => void;
  onCancelOrder: (entry: TOBEntry) => void;
}
