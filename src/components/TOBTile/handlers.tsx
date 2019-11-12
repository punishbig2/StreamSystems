import {EntryTypes} from 'interfaces/mdEntry';
import {TOBEntry} from 'interfaces/tobEntry';
import {TOBTable} from 'interfaces/tobTable';

export interface TOBHandlers {
  onTenorSelected: (tenor: string, table: TOBTable) => void;
  onDoubleClick: (type: EntryTypes, data: any) => void;
  onRunButtonClicked: () => void;
  onRefBidsButtonClicked: () => void;
  onRefOffersButtonClicked: () => void;
  onCreateOrder: (entry: TOBEntry, value: number, type: EntryTypes) => void;
  onCancelOrder: (entry: TOBEntry) => void;
}
