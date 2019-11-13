export enum EntryTypes {
  Invalid = '',
  Offer = '1',
  Bid = '0',
  DarkPool = '2',
}

export enum FirmTypes {
  Bank = 'BANK',
  Broker = 'BROKER'
}

export interface MDEntry {
  MDEntryType: EntryTypes;
  MDEntryPx: string;
  MDEntrySize: string;
  MDEntryOriginator: string,
  MDUserId: string;
  MDFirm: string;
  MDFirmType: FirmTypes;
  MDMkt: string;
}
