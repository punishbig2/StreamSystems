import { OrderTypes } from "interfaces/mdEntry";
import { Order } from "interfaces/order";
import React, { ReactElement, useEffect, useState } from "react";
import strings from "locales";
import { PresetQtyButton } from "components/presetQtyButton";

interface Props {
  order: Order;
  onSubmit: (order: Order) => void;
  onCancel: () => void;
}

const formatValue = (value: number | null, precision: number): string =>
  value === null ? "" : value.toFixed(precision);
const OrderTicket: React.FC<Props> = (props: Props): ReactElement | null => {
  const { order } = props;
  const [quantity, setQuantity] = useState<string>(
    formatValue(order.quantity, 0)
  );
  const [price, setPrice] = useState<string>(formatValue(order.price, 3));
  const [input, setInput] = useState<HTMLInputElement | null>(null);
  useEffect(() => {
    if (input === null) return;
    input.select();
    input.focus();
  }, [input]);
  if (!order) return null;
  const updateQuantity = ({
    target: { value }
  }: React.ChangeEvent<HTMLInputElement>) => {
    const numeric = Number(value);
    if (isNaN(numeric)) return;
    setQuantity(Number(value).toFixed(0));
  };
  const updatePrice = ({
    target: { value }
  }: React.ChangeEvent<HTMLInputElement>) => {
    const numeric = Number(value);
    if (isNaN(numeric)) return;
    setPrice(value);
  };
  const onSubmit = (event: React.SyntheticEvent) => {
    event.preventDefault();
    if (quantity !== null && price !== null) {
      props.onSubmit({
        ...order,
        quantity: Number(quantity),
        price: Number(price)
      });
    }
  };
  const canSubmit: boolean = price !== null && quantity !== null;
  const presetQty: string[] = ["30", "50", "100"];
  return (
    <>
      <div className={"modal-title"}>{strings.OrderEntry}</div>
      <form onSubmit={onSubmit}>
        <div className={"order-ticket"}>
          <div className={"title-chain"}>
            <div className={"item"}>{order.symbol}</div>
            <div className={"item"}>{order.tenor}</div>
            <div className={"item"}>{order.strategy}</div>
          </div>
          <div className={"row"}>
            <div className={"label"}>
              <span>Side</span>
            </div>
            <div className={"value"}>
              <span>{order.type === OrderTypes.Bid ? "Buy" : "Sell"}</span>
            </div>
          </div>
          <div className={"row"}>
            <div className={"label"}>
              <span>Vol</span>
            </div>
            <div className={"value"}>
              <input value={price} onChange={updatePrice} />
            </div>
          </div>
          <div className={"row"}>
            <div className={"label"}>
              <span>Qty</span>
            </div>
            <div className={"value"}>
              <div className={"editor"}>
                <input
                  value={quantity}
                  onChange={updateQuantity}
                  autoFocus={true}
                  ref={setInput}
                />
              </div>
              <div className={"buttons"}>
                {presetQty.map((value: string) => (
                  <PresetQtyButton
                    key={value}
                    value={value}
                    setValue={setQuantity}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className={"modal-buttons"}>
          <button type={"button"} className={"cancel"} onClick={props.onCancel}>
            {strings.Cancel}
          </button>
          <button className={"success"} disabled={!canSubmit}>
            {strings.Submit}
          </button>
        </div>
      </form>
    </>
  );
};

export { OrderTicket };
