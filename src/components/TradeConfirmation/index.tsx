import React, { ReactElement, useEffect } from 'react';
import { Message } from 'interfaces/message';
import { getMessageSize, getMessagePrice } from 'messageUtils';
import { UserWorkspace, ExecSound } from 'interfaces/user';
import { getSound } from 'beep-sound';

interface OwnProps {
  trade: Message;
  userProfile: UserWorkspace;
  onClose: () => void;
}

const sideClasses: { [key: string]: string } = {
  2: 'sell',
  1: 'buy',
};

const playBeep = async (profile: UserWorkspace) => {
  const src: string = await (async () => {
    const { execSound } = profile;
    if (execSound === 'default') {
      return '/sounds/alert.wav';
    } else {
      const sound: ExecSound = await getSound(execSound);
      return sound.data as string;
    }
  })();
  const element: HTMLAudioElement = document.createElement('audio');
  element.src = src;
  element.play();
};

export const TradeConfirmation: React.FC<OwnProps> = (props: OwnProps): ReactElement | null => {
  const { trade } = props;
  const { Side } = trade;
  const direction: string = Side.toString() === '1' ? 'from' : 'to';
  useEffect(() => {
    playBeep(props.userProfile);
  });
  return (
    <div className={[sideClasses[trade.Side], 'item'].join(' ')}>
      <div className={'content'}>
        <div className={'line'}>
          {trade.Symbol} {trade.Tenor} {trade.Strategy} @ {getMessagePrice(trade)}
        </div>
        <div className={'line'}>
          You {Side.toString() === '1' ? 'buy' : 'sell'} {getMessageSize(trade)} {direction} {trade.MDMkt}
        </div>
      </div>
    </div>
  );
};
