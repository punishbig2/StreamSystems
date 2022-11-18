import { action, computed, makeObservable, observable } from 'mobx';
import { OrderStatus } from 'types/order';
import { priceFormatter } from 'utils/priceFormatter';

export class PriceStore {
  public tooltipX = 0;
  public tooltipY = 0;
  public tooltipVisible = false;
  public flashing = false;
  public internalValue: string | null = null;
  public baseValue: number | null = null;
  public status: OrderStatus = OrderStatus.None;
  public inputError: string | null = null;

  constructor() {
    makeObservable(this, {
      tooltipX: observable,
      tooltipY: observable,
      tooltipVisible: observable,
      flashing: observable,
      internalValue: observable,
      baseValue: observable,
      status: observable,
      inputError: observable,
      numericValue: computed,
      value: computed,
      placeholder: computed,
      setBaseValue: action.bound,
      setStatus: action.bound,
      showTooltip: action.bound,
      hideTooltip: action.bound,
      setFlashing: action.bound,
      setInternalValue: action.bound,
      setInputError: action.bound,
    });
  }

  public get numericValue(): number | null {
    const { internalValue } = this;
    if (internalValue === null || internalValue.trim() === '' || internalValue.trim() === '-')
      return null;
    const value = Number(internalValue);
    if (isNaN(value)) return null;
    return value;
  }

  public get value(): string {
    const { internalValue } = this;
    if (internalValue !== null) return internalValue.toString();
    if ((this.status & OrderStatus.Cancelled) !== 0) return '';
    return priceFormatter(this.baseValue);
  }

  public get placeholder(): string {
    return priceFormatter(this.baseValue);
  }

  public setBaseValue(value: number | null): void {
    this.baseValue = value;
  }

  public setStatus(status: OrderStatus): void {
    this.status = status;
  }

  public showTooltip(): void {
    this.tooltipVisible = true;
  }

  public hideTooltip(): void {
    this.tooltipVisible = false;
  }

  public setFlashing(value: boolean): void {
    this.flashing = value;
  }

  public setInternalValue(value: string | null): void {
    this.internalValue = value;
  }

  public setInputError(errorMessage: string | null): void {
    this.inputError = errorMessage;
  }
}
