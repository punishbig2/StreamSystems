import React, { ReactElement, ReactNode } from 'react';

interface Props {
  title: string;
  message: string;
  icon: 'exclamation-triangle' | 'question-circle' | 'check-circle';
  buttons: () => ReactNode;
  color: 'good' | 'bad' | 'neutral';
}

export const MessageBox: React.FC<Props> = (props: Props): ReactElement => {
  return (
    <div className={'message-box'}>
      <div className={'box-title'}>
        <div className={'icon ' + props.color}>
          <i className={`fa fa-${props.icon}`}/>
        </div>
        <div className={'text'}>
          <h1>{props.title}</h1>
        </div>
      </div>
      <p>{props.message}</p>
      <div className={'modal-buttons'}>
        {props.buttons()}
      </div>
    </div>
  );
};
