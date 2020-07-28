import strings from "locales";
import React, { useState } from "react";
import {
  Select,
  MenuItem,
  Grid,
  FormControl,
  FormLabel,
  OutlinedInput,
} from "@material-ui/core";
import { PresetSizeButton } from "components/presetSizeButton";
import { DarkPoolOrder, Order } from "types/order";
import { MessageTypes } from "types/w";
import { SelectEventData } from "types/selectEventData";
import { Sides } from "types/sides";
import { priceFormatter } from "utils/priceFormatter";
import { sizeFormatter } from "utils/sizeFormatter";
import workareaStore from "mobx/stores/workareaStore";
import { User } from "types/user";
import { selectInputText } from "utils";

interface OwnProps {
  tenor: string;
  currency: string;
  strategy: string;
  price: number;
  minimumSize: number;
  onCancel: () => void;
  onSubmit: (order: DarkPoolOrder) => void;
}

export interface DarkPoolTicketData {
  price: number;
  tenor: string;
  currentOrder: Order | null;
}

const None = "";
const presetSizes: number[] = [30, 50, 100, 500];

const DarkPoolTicket: React.FC<OwnProps> = (props: OwnProps) => {
  const [price, setPrice] = useState<number>(props.price);
  const [size, setSize] = useState<number>(props.minimumSize);
  const [side, setSide] = useState<string>(None);
  const [inst, setInst] = useState<string>(None);
  const updateSize = ({
    currentTarget,
  }: React.ChangeEvent<HTMLInputElement>) => {
    const numeric: number = Number(currentTarget.value);
    if (isNaN(numeric)) return;
    setSize(numeric);
  };

  const updatePrice = ({
    currentTarget,
  }: React.ChangeEvent<HTMLInputElement>) => {
    const numeric: number = Number(currentTarget.value);
    if (isNaN(numeric)) return;
    setPrice(numeric);
  };

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const user: User = workareaStore.user;
    const order: DarkPoolOrder = {
      ExecInst: inst === None ? undefined : inst,
      MsgType: MessageTypes.D,
      Price: priceFormatter(price),
      Quantity: sizeFormatter(size),
      Side: side as Sides,
      Strategy: props.strategy,
      Symbol: props.currency,
      Tenor: props.tenor,
      TransactTime: (Date.now() / 1000).toFixed(0),
      User: user.email,
    };
    props.onSubmit(order);
  };

  const instLabels: { [key: string]: string } = { G: "AON", D: "1/2 AON" };
  const sideLabels: { [key: string]: string } = { SELL: "Sell", BUY: "Buy" };
  const canSubmit: boolean =
    !isNaN(Number(price)) && side !== "" && size >= props.minimumSize;

  const renderSide = (value: any) =>
    !value ? (
      <span className={"invalid"}>Side</span>
    ) : (
      sideLabels[value as string]
    );
  const stringSelectSetter = (fn: (value: string) => void) => (
    event: React.ChangeEvent<SelectEventData>
  ) => {
    const { value } = event.target;
    fn(value as string);
  };

  return (
    <div>
      <div className={"modal-title"}>
        <div className={"title-chain modal-title"}>
          <div className={"title"}>
            <div className={"item"}>{props.currency}</div>
            <div className={"item"}>{props.tenor}</div>
            <div className={"item"}>{props.strategy}</div>
          </div>
          <div className={"subtitle"}>{strings.DarkPool}</div>
        </div>
      </div>
      <form onSubmit={onSubmit}>
        <div className={"ticket"}>
          <Grid>
            <FormControl fullWidth margin={"normal"}>
              <FormLabel htmlFor={"side"}>Side</FormLabel>
              <Select
                id={"side"}
                value={side}
                displayEmpty={true}
                renderValue={renderSide}
                onChange={stringSelectSetter((value: string) => setSide(value))}
                variant={"outlined"}
              >
                <MenuItem value={"BUY"}>Buy</MenuItem>
                <MenuItem value={"SELL"}>Sell</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid>
            <FormControl fullWidth margin={"normal"}>
              <FormLabel htmlFor={"price"}>Vol</FormLabel>
              <OutlinedInput
                id={"price"}
                value={price}
                onChange={updatePrice}
                labelWidth={0}
                readOnly
              />
            </FormControl>
          </Grid>

          <Grid>
            <FormControl fullWidth margin={"normal"}>
              <FormLabel htmlFor={"size"}>Qty</FormLabel>
              <OutlinedInput
                value={size}
                onChange={updateSize}
                labelWidth={0}
                inputRef={selectInputText}
                autoFocus={true}
              />
              <div className={"preset-buttons four"}>
                {presetSizes.map((value: number) => (
                  <PresetSizeButton
                    key={value}
                    value={value}
                    setValue={setSize}
                  />
                ))}
              </div>
            </FormControl>
          </Grid>

          <Grid>
            <FormControl fullWidth margin={"normal"}>
              <FormLabel htmlFor={"inst"}>Instructions</FormLabel>
              <Select
                id={"inst"}
                value={inst}
                onChange={stringSelectSetter((value: string) => setInst(value))}
                displayEmpty={true}
                renderValue={(value: any) =>
                  !value ? "None" : instLabels[value as string]
                }
                variant={"outlined"}
              >
                <MenuItem value={"G"}>AON</MenuItem>
                <MenuItem value={"D"}>
                  <sup>1</sup>/<sub>2</sub>&nbsp;ON
                </MenuItem>
              </Select>
            </FormControl>
          </Grid>
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
    </div>
  );
};

export { DarkPoolTicket };
