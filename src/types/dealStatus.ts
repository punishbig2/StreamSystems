export enum DealStatus {
  NoStatus = 0,
  Pending /*  1 */,
  Priced /*  2 */,
  SEFSubmitted /*  3 */,
  SEFFailed /*  4 */,
  SEFComplete /*  5 */,
  STPSubmitted /*  6 */,
  STPFailed /*  7 */,
  TRTNComplete /*  8 */,
  MKTSComplete /*  9 */,
  UBSComplete /* 10 */,
  MSCOComplete /* 11 */,
  STPComplete /* 12 */,
}

export const toBitwise = (status: DealStatus): number => 1 << status;
