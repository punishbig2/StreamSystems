export enum DealStatus {
  NoStatus = 0,
  Pending,
  Priced,
  SEFSubmitted,
  SEFFailed,
  SEFComplete,
  STPSubmitted,
  STPFailed,
  TRTNComplete,
  MKTSComplete,
  UBSComplete,
  STPComplete,
}

export const toBitwise = (status: DealStatus): number => 1 << status;
