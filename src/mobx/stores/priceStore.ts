import { action, computed, observable } from "mobx";
import { OrderStatus } from "types/order";
import { priceFormatter } from "utils/priceFormatter";

export class PriceStore {
  @observable tooltipX: number = 0;
  @observable tooltipY: number = 0;
  @observable tooltipVisible: boolean = false;
  @observable flashing: boolean = false;
  @observable internalValue: string | null = null;
  @observable baseValue: number | null = null;
  @observable status: OrderStatus = OrderStatus.None;
  @observable inputError: string | null = null;

  @computed
  get numericValue(): number | null {
    const { internalValue } = this;
    if (
      internalValue === null ||
      internalValue.trim() === "" ||
      internalValue.trim() === "-"
    )
      return null;
    const value: number = Number(internalValue);
    if (isNaN(value)) return null;
    return value;
  }

  @computed
  get value(): string {
    const { internalValue } = this;
    if (internalValue !== null) return internalValue.toString();
    if ((this.status & OrderStatus.Cancelled) !== 0) return "";
    return priceFormatter(this.baseValue);
  }

  @computed
  get placeholder(): string {
    return priceFormatter(this.baseValue);
  }

  @action.bound
  public setBaseValue(value: number | null) {
    this.baseValue = value;
  }

  @action.bound
  public setStatus(status: OrderStatus) {
    this.status = status;
  }

  @action.bound
  public showTooltip() {
    this.tooltipVisible = true;
  }

  @action.bound
  public hideTooltip() {
    this.tooltipVisible = false;
  }

  @action.bound
  public setFlashing(value: boolean) {
    this.flashing = value;
  }

  @action.bound
  public setInternalValue(value: string | null) {
    this.internalValue = value;
  }

  @action.bound
  public setInputError(errorMessage: string | null): void {
    this.inputError = errorMessage;
  }
}
