import { InvertedMarketsError } from 'columns/podColumns/OrderColumn/helpers/onSubmitPrice';
import { SizeTooSmallError } from 'columns/podColumns/OrderColumn/helpers/onSubmitSize';
import { createRow } from 'components/PodTile/Row/helpers/emptyRowCreator';
import { action, makeObservable, observable } from 'mobx';
import React from 'react';
import { PodRow, PodRowStatus } from 'types/podRow';

export class PodRowStore {
  public internalRow: PodRow;

  constructor(currency: string, strategy: string, tenor: string) {
    this.internalRow = createRow(currency, strategy, tenor);
    makeObservable(this, {
      internalRow: observable,
      setInternalRow: action.bound,
      setError: action.bound,
    });
  }

  public setInternalRow(row: PodRow): void {
    this.internalRow = row;
  }

  public setError(error: Error | null): void {
    if (error === InvertedMarketsError) {
      this.internalRow = {
        ...this.internalRow,
        status: PodRowStatus.InvertedMarketsError,
      };
    } else if (error === SizeTooSmallError) {
      this.internalRow = {
        ...this.internalRow,
        status: PodRowStatus.SizeTooSmall,
      };
    } else {
      this.internalRow = { ...this.internalRow, status: PodRowStatus.Normal };
    }
  }
}

export const PodRowStoreContext = React.createContext<PodRowStore>(new PodRowStore('', '', ''));
