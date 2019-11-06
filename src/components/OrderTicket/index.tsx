import {Button} from '@blueprintjs/core';
import {ModalContent} from 'components/ModalContent';
import {ModalTitle} from 'components/ModalTitle';
import {Cell} from 'components/OrderTicket/cell';
import {MiniTable} from 'components/OrderTicket/miniTable';
import {Row} from 'components/OrderTicket/row';
import {TitleEntry} from 'components/OrderTicket/titleEntry';
import {DialogButtons} from 'components/PullRight';
import {EntryTypes} from 'interfaces/mdEntry';
import {TOBEntry} from 'interfaces/tobEntry';
import React, {ReactElement, useEffect, useState} from 'react';
import strings from 'locales';

interface Props {
  order: TOBEntry;
  onSubmit: (value: number) => void;
  onCancel: () => void;
}

const OrderTicket: React.FC<Props> = (props: Props): ReactElement | null => {
  const {order} = props;
  const [quantity, setQuantity] = useState<number | undefined>(order.quantity);
  const [input, setInput] = useState<HTMLInputElement | null>(null);
  useEffect(() => {
    if (input === null)
      return;
    input.select();
    input.focus();
  }, [input]);
  if (!order)
    return null;
  const updateQuantity = ({target: {value}}: { target: { value: string } }) => {
    const numeric = Number(value);
    if (isNaN(numeric))
      return;
    setQuantity(numeric);
  };
  const onSubmit = (event: React.SyntheticEvent) => {
    event.preventDefault();
    if (quantity) {
      props.onSubmit(quantity);
    }
  };
  return (
    <ModalContent>
      <ModalTitle>
        {strings.OrderEntry}
      </ModalTitle>
      <form onSubmit={onSubmit}>
        <MiniTable>
          <Row>
            <Cell width={100} align={'center'}>
              <TitleEntry>{order.symbol}</TitleEntry>
              <TitleEntry>{order.tenor}</TitleEntry>
              <TitleEntry>{order.strategy}</TitleEntry>
            </Cell>
          </Row>
          <Row>
            <Cell><span className={'title'}>Side</span></Cell>
            <Cell><span>{order.type === EntryTypes.Bid ? 'Sell' : 'Buy'}</span></Cell>
          </Row>
          <Row>
            <Cell><span className={'title'}>Qty.</span></Cell>
            <Cell><input value={quantity} onChange={updateQuantity} autoFocus={true} ref={setInput}/></Cell>
          </Row>
          <Row>
            <Cell><span className={'title'}>Vol.</span></Cell>
            <Cell><span>{order.size}</span></Cell>
          </Row>
        </MiniTable>
        <DialogButtons>
          <Button onClick={props.onCancel} text={strings.Cancel} intent={'none'}/>
          <Button type={'submit'} text={strings.Submit} intent={'primary'} disabled={!quantity || quantity <= 0}/>
        </DialogButtons>
      </form>
    </ModalContent>
  );
};

export {OrderTicket};
