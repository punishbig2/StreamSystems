import React, {ReactElement} from 'react';
import {Message} from 'interfaces/message';

interface OwnProps {
  trade: Message;
  onClose: () => void;
}

const sideClasses: { [key: string]: string } = {
  2: 'sell',
  1: 'buy',
};

export const TradeConfirmation: React.FC<OwnProps> = (props: OwnProps): ReactElement | null => {
  const {trade} = props;
  const {Side} = trade;
  const direction: string = Side.toString() === '1' ? 'from' : 'to';
  return (
    <div className={'message-detail ' + sideClasses[trade.Side]}>
      <audio src={'/sounds/alert.wav'} autoPlay={true}/>
      <div className={'title'}>
        Trade Confirmation
      </div>
      <div className={'content'}>
        <div className={'line'}>
          {trade.Currency} {trade.Tenor} {trade.Strategy} @ {trade.Price}
        </div>
        <div className={'line'}>
          You {Side.toString() === '1' ? 'buy' : 'sell'} {trade.OrderQty} {direction} {trade.MDMkt}
        </div>
      </div>
      <div className={'modal-buttons'}>
        <button className={'cancel'} onClick={props.onClose}>
          Close
        </button>
      </div>
    </div>
  );
};
