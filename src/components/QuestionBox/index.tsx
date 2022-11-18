import { MessageBox } from 'components/MessageBox';
import strings from 'locales';
import React from 'react';

interface Props {
  readonly title: string;
  readonly content: string;
  readonly onNo: () => void;
  readonly onYes: () => void;
}

export const QuestionBox: React.FC<Props> = (props: Props): React.ReactElement => {
  const renderButtons = (): React.ReactElement => {
    return (
      <div className="pull-right">
        <button className="cancel" onClick={props.onNo}>
          {strings.No}
        </button>
        <button className="success" onClick={props.onYes}>
          {strings.Yes}
        </button>
      </div>
    );
  };

  return (
    <MessageBox
      icon="question-circle"
      color="neutral"
      title={props.title}
      message={props.content}
      buttons={renderButtons}
    />
  );
};
