import {OrderTypes} from 'interfaces/mdEntry';
import {Order} from 'interfaces/order';
import React, {ReactElement, useEffect, useState} from 'react';
import strings from 'locales';
import {PresetSizeButton} from 'components/presetSizeButton';
import {sizeFormatter} from 'utils/sizeFormatter';

interface Props {
  order: Order;
  minimumSize: number;
  onSubmit: (order: Order) => void;
  onCancel: () => void;
}

const formatValue = (value: number | null, precision: number): string =>
  value === null ? '' : value.toFixed(precision);
const OrderTicket: React.FC<Props> = (props: Props): ReactElement | null => {
  const {order} = props;
  const [size, setSize] = useState<number | null>(order.size);
  const [price, setPrice] = useState<string>(formatValue(order.price, 3));
  const [input, setInput] = useState<HTMLInputElement | null>(null);
  useEffect(() => {
    if (input === null) return;
    input.select();
    input.focus();
  }, [input]);
  if (!order) return null;
  const updateQuantity = ({target: {value}}: React.ChangeEvent<HTMLInputElement>) => {
    const numeric = Number(value);
    if (isNaN(numeric)) {
      return;
    }
    setSize(numeric);
  };
  const updatePrice = ({target: {value}}: React.ChangeEvent<HTMLInputElement>) => {
    const numeric = Number(value);
    if (isNaN(numeric))
      return;
    setPrice(value);
  };
  const onSubmit = (event: React.SyntheticEvent) => {
    event.preventDefault();
    if (size !== null && price !== null) {
      props.onSubmit({
        ...order,
        size: Number(size),
        price: Number(price),
      });
    }
  };
  const canSubmit: boolean = (price !== null && size !== null && size >= props.minimumSize);
  const presetSizes: number[] = [30, 50, 100];
  return (
    <>
      <div className={'title-chain modal-title'}>
        <div className={'title'}>
          <div className={'item'}>{order.symbol}</div>
          <div className={'item'}>{order.tenor}</div>
          <div className={'item'}>{order.strategy}</div>
        </div>
        <div className={'subtitle'}>
          <span>{order.type === OrderTypes.Bid ? 'Buy' : 'Sell'}</span>
        </div>
      </div>
      <form onSubmit={onSubmit}>
        <div className={'order-ticket'}>
          <div className={'row'}>
            <div className={'label'}>
              <span>Vol</span>
            </div>
            <div className={'value'}>
              <input value={price} onChange={updatePrice}/>
            </div>
          </div>
          <div className={'row'}>
            <div className={'label'}>
              <span>Amt</span>
            </div>
            <div className={'value'}>
              <div className={'editor'}>
                <input value={sizeFormatter(size)} onChange={updateQuantity} autoFocus={true} ref={setInput}/>
              </div>
              <div className={'buttons'}>
                {presetSizes.map((value: number) => (
                  <PresetSizeButton key={value} value={value} setValue={setSize}/>
                ))}
              </div>
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
    </>
  );
};

export {OrderTicket};
