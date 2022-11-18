import { MessageBox } from 'components/MessageBox';
import strings from 'locales';
import React, { ReactElement } from 'react';

interface Props {
  readonly title: string;
  readonly message: string;
  readonly onClose: () => void;
}

export const ErrorBox: React.FC<Props> = (props: Props): ReactElement => {
  const renderButtons = (): ReactElement => {
    return (
      <>
        <button className="cancel" onClick={props.onClose}>
          {strings.Close}
        </button>
      </>
    );
  };

  return (
    <MessageBox
      icon="exclamation-triangle"
      color="bad"
      title={props.title}
      message={props.message}
      buttons={renderButtons}
    />
  );
};
