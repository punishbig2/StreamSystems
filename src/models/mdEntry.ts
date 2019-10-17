export enum Types {
  Ask = 'OFFER',
  Bid = 'BID'
}

export enum FirmTypes {
  Bank = 'BANK',
  Broker = 'BROKER'
}

export interface MDEntry {
  MDEntryType: Types;
  MDEntryPx: number;
  MDEntrySize: number;
  MDUserId: string;
  MDFirm: string;
  MDFirmType: FirmTypes;
};