import strings from 'locales';
import React, {ReactElement} from 'react';
import {MessageBox} from 'components/MessageBox';

interface Props {
  title: string;
  message: string;
  onClose: () => void;
}

export const ErrorBox: React.FC<Props> = (props: Props): ReactElement => {
  const renderButtons = () => {
    return (
      <>
        <button className={'cancel'} onClick={props.onClose}>{strings.Close}</button>
      </>
    );
  };

  return (
    <MessageBox icon={'exclamation-triangle'} color={'bad'} title={props.title} message={props.message}
                buttons={renderButtons}/>
  );
};
