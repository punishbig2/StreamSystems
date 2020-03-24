import React, {ReactElement} from 'react';
import {Message} from 'interfaces/message';
import {getMessageSize, getMessagePrice} from 'messageUtils';

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
    <div className={[sideClasses[trade.Side], 'item'].join(' ')}>
      <audio src={'/sounds/alert.wav'} autoPlay={true}/>
      <div className={'content'}>
        <div className={'line'}>
          {trade.Currency} {trade.Tenor} {trade.Strategy} @ {getMessagePrice(trade)}
        </div>
        <div className={'line'}>
          You {Side.toString() === '1' ? 'buy' : 'sell'} {getMessageSize(trade)} {direction} {trade.MDMkt}
        </div>
      </div>
    </div>
  );
};
