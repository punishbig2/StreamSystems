export enum EntryTypes {
  Ask = '0',
  Bid = '1',
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
  MDUserId: string;
  MDFirm: string;
  MDFirmType: FirmTypes;
};
