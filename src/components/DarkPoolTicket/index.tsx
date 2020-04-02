import strings from 'locales';
import React, { useState, useEffect } from 'react';
import { Select, MenuItem } from '@material-ui/core';
import { PresetSizeButton } from 'components/presetSizeButton';
import { DarkPoolOrder, Order } from 'interfaces/order';
import { MessageTypes } from 'interfaces/w';
import { SelectEventData } from 'interfaces/selectEventData';
import { Sides } from 'interfaces/sides';
import { priceFormatter } from 'utils/priceFormatter';
import { sizeFormatter } from 'utils/sizeFormatter';

interface OwnProps {
  tenor: string;
  symbol: string;
  strategy: string;
  price: number;
  size: number;
  user: string;
  onCancel: () => void;
  onSubmit: (order: DarkPoolOrder) => void;
}

export interface DarkPoolTicketData {
  price: number;
  tenor: string;
  currentOrder: Order | null;
}

const None = '';

const DarkPoolTicket: React.FC<OwnProps> = (props: OwnProps) => {
  const [input, setInput] = useState<HTMLInputElement | null>(null);
  const [price, setPrice] = useState<number>(props.price);
  const [size, setSize] = useState<number>(props.size);
  const [side, setSide] = useState<string>(None);
  const [inst, setInst] = useState<string>(None);
  useEffect(() => {
    if (input === null) return;
    input.select();
    input.focus();
  }, [input]);
  const updateSize = ({ currentTarget }: React.ChangeEvent<HTMLInputElement>) => {
    const numeric: number = Number(currentTarget.value);
    if (isNaN(numeric))
      return;
    setSize(numeric);
  };
  const updatePrice = ({ currentTarget }: React.ChangeEvent<HTMLInputElement>) => {
    const numeric: number = Number(currentTarget.value);
    if (isNaN(numeric))
      return;
    setPrice(numeric);
  };
  const presetSizes: number[] = [30, 50, 100, 500];

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const order: DarkPoolOrder = {
      ExecInst: inst === None ? undefined : inst,
      MsgType: MessageTypes.D,
      Price: priceFormatter(price),
      Quantity: sizeFormatter(size),
      Side: side as Sides,
      Strategy: props.strategy,
      Symbol: props.symbol,
      Tenor: props.tenor,
      TransactTime: (Date.now() / 1000).toFixed(0),
      User: props.user,
    };
    console.log(order);
    props.onSubmit(order);
  };

  const instLabels: { [key: string]: string } = { G: 'AON', D: '1/2 AON' };
  const sideLabels: { [key: string]: string } = { SELL: 'Sell', BUY: 'Buy' };

  const canSubmit: boolean =
    !isNaN(Number(price)) && !isNaN(Number(size)) && side !== '';

  const renderSide = (value: any) =>
    !value ? (
      <span className={'invalid'}>Side</span>
    ) : (
      sideLabels[value as string]
    );

  const stringSelectSetter = (fn: (value: string) => void) => (event: React.ChangeEvent<SelectEventData>) => {
    const { value } = event.target;
    fn(value as string);
  };

  return (
    <div>
      <div className={'modal-title'}>
        <div className={'title-chain modal-title'}>
          <div className={'title'}>
            <div className={'item'}>{props.symbol}</div>
            <div className={'item'}>{props.tenor}</div>
            <div className={'item'}>{props.strategy}</div>
          </div>
          <div className={'subtitle'}>
            {strings.DarkPool}
          </div>
        </div>
      </div>
      <form onSubmit={onSubmit}>
        <div className={'order-ticket'}>
          <div className={'row'}>
            <div className={'label'}>
              <span>Side</span>
            </div>
            <div className={'value'}>
              <Select
                value={side}
                displayEmpty={true}
                renderValue={renderSide}
                onChange={stringSelectSetter((value: string) => setSide(value))}
                variant={'outlined'}>
                <MenuItem value={'BUY'}>Buy</MenuItem>
                <MenuItem value={'SELL'}>Sell</MenuItem>
              </Select>
            </div>
          </div>
          <div className={'row'}>
            <div className={'label'}>
              <span>Vol</span>
            </div>
            <div className={'value'}>
              <input value={price} onChange={updatePrice} readOnly/>
            </div>
          </div>
          <div className={'row'}>
            <div className={'label'}>
              <span>Qty</span>
            </div>
            <div className={'value'}>
              <div className={'editor'}>
                <input
                  value={size}
                  onChange={updateSize}
                  autoFocus={true}
                  ref={setInput}
                />
              </div>
              <div className={'buttons'}>
                {presetSizes.map((value: number) => (
                  <PresetSizeButton key={value} value={value} setValue={setSize}/>
                ))}
              </div>
            </div>
          </div>
          <div className={'row'}>
            <div className={'label'}>
              <span>Inst</span>
            </div>
            <div className={'value'}>
              <Select
                value={inst}
                onChange={stringSelectSetter((value: string) => setInst(value))}
                displayEmpty={true}
                renderValue={(value: any) =>
                  !value ? 'None' : instLabels[value as string]
                }
                variant={'outlined'}
              >
                <MenuItem value={'G'}>AON</MenuItem>
                <MenuItem value={'D'}>
                  <sup>1</sup>/<sub>2</sub>&nbsp; AOD
                </MenuItem>
              </Select>
            </div>
          </div>
        </div>
        <div className={'modal-buttons'}>
          <button type={'button'} className={'cancel'} onClick={props.onCancel}>
            {strings.Cancel}
          </button>
          <button className={'success'} disabled={!canSubmit}>
            {strings.Submit}
          </button>
        </div>
      </form>
    </div>
  );
};

export { DarkPoolTicket };
