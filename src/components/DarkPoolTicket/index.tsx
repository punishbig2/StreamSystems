import strings from 'locales';
import React, {useState, useEffect} from 'react';
import {Select, MenuItem} from '@material-ui/core';
import {PresetQtyButton} from 'components/presetQtyButton';
import {DarkPoolOrder, Sides} from 'interfaces/order';
import {MessageTypes} from 'interfaces/w';

interface OwnProps {
  tenor: string;
  symbol: string;
  strategy: string;
  price: string;
  quantity: string;
  user: string;
  onCancel: () => void;
  onSubmit: (order: DarkPoolOrder) => void;
}

export interface DarkPoolTicketData {
  price: number;
  tenor: string;
}

const None = '';

const DarkPoolTicket: React.FC<OwnProps> = (props: OwnProps) => {
  console.log(props.price);
  const [input, setInput] = useState<HTMLInputElement | null>(null);
  const [price, setPrice] = useState<string>(props.price || '');
  const [quantity, setQuantity] = useState<string>(props.quantity);
  const [side, setSide] = useState<string>(None);
  const [inst, setInst] = useState<string>(None);
  useEffect(() => {
    if (input === null)
      return;
    input.select();
    input.focus();
  }, [input]);
  const updateQuantity = ({currentTarget}: React.ChangeEvent<HTMLInputElement>) => setQuantity(currentTarget.value);
  const updatePrice = ({currentTarget}: React.ChangeEvent<HTMLInputElement>) => setPrice(currentTarget.value);
  const presetQty: string[] = ['30', '50', '100', '500'];
  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const order: DarkPoolOrder = {
      ExecInst: inst === None ? undefined : inst,
      MsgType: MessageTypes.D,
      Price: price,
      Quantity: quantity,
      Side: side as Sides,
      Strategy: props.strategy,
      Symbol: props.symbol,
      Tenor: props.tenor,
      TransactTime: (Date.now() / 1000).toFixed(0),
      User: props.user,
    };
    props.onSubmit(order);
  };
  const instLabels: { [key: string]: string } = {'G': 'AON', 'D': '1/2 AON'};
  const sideLabels: { [key: string]: string } = {'SELL': 'Sell', 'BUY': 'Buy'};
  const canSubmit: boolean = !isNaN(Number(price)) && !isNaN(Number(quantity)) && side !== '';
  const renderSide = (value: any) => !value ? <span className={'invalid'}>Side</span> : sideLabels[value as string];
  const stringSelectSetter = (fn: (value: string) => void) =>
    (event: any) => {
      const {value} = event.target;
      fn(value as string);
    };
  return (
    <div>
      <div className={'modal-title'}>
        {strings.OrderEntry}
      </div>
      <form onSubmit={onSubmit}>
        <div className={'order-ticket'}>
          <div className={'title-chain'}>
            <div className={'item'}>{props.symbol}</div>
            <div className={'item'}>{props.tenor}</div>
            <div className={'item'}>{props.strategy}</div>
          </div>
          <div className={'row'}>
            <div className={'label'}><span>Side</span></div>
            <div className={'internalValue'}>
              <Select
                value={side}
                displayEmpty={true}
                renderValue={renderSide}
                onChange={stringSelectSetter((value: string) => setSide(value))}>
                <MenuItem value={'BUY'}>Buy</MenuItem>
                <MenuItem value={'SELL'}>Sell</MenuItem>
              </Select>
            </div>
          </div>
          <div className={'row'}>
            <div className={'label'}><span>Vol</span></div>
            <div className={'internalValue'}><input value={price} onChange={updatePrice}/></div>
          </div>
          <div className={'row'}>
            <div className={'label'}><span>Qty</span></div>
            <div className={'internalValue'}>
              <div className={'editor'}>
                <input value={quantity} onChange={updateQuantity} autoFocus={true} ref={setInput}/>
              </div>
              <div className={'buttons'}>
                {presetQty.map((value: string) => <PresetQtyButton key={value} value={value} setValue={setQuantity}/>)}
              </div>
            </div>
          </div>
          <div className={'row'}>
            <div className={'label'}><span>Inst</span></div>
            <div className={'internalValue'}>
              <Select value={inst} onChange={stringSelectSetter((value: string) => setInst(value))} displayEmpty={true}
                      renderValue={(value: any) => !value ? 'None' : instLabels[value as string]}>
                <MenuItem value={'G'}>AON</MenuItem>
                <MenuItem value={'D'}><sup>1</sup>/<sub>2</sub>&nbsp; AOD</MenuItem>
              </Select>
            </div>
          </div>
        </div>
        <div className={'dialog-buttons'}>
          <button type={'button'} className={'cancel'} onClick={props.onCancel}>{strings.Cancel}</button>
          <button className={'success'} disabled={!canSubmit}>{strings.Submit}</button>
        </div>
      </form>
    </div>
  );
};

export {DarkPoolTicket};
