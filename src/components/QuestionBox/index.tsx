import strings from 'locales';
import React, {ReactElement} from 'react';

interface QuestionProps {
  title: string;
  content: string;
  onNo: () => void;
  onYes: () => void;
}

export const Question: React.FC<QuestionProps> = (props: QuestionProps): ReactElement => {
  return (
    <div className={'question-box'}>
      <h1>{props.title}</h1>
      <p>{props.content}</p>
      <div className={'dialog-buttons'}>
        <button className={'cancel'} onClick={props.onNo}>{strings.No}</button>
        <button className={'success'} onClick={props.onYes}>{strings.Yes}</button>
      </div>
    </div>
  );
};
