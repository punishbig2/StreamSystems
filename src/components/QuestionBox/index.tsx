import strings from "locales";
import React, { ReactElement } from "react";
import { MessageBox } from "components/MessageBox";

interface Props {
  title: string;
  content: string;
  onNo: () => void;
  onYes: () => void;
}

export const QuestionBox: React.FC<Props> = (props: Props): ReactElement => {
  const renderButtons = () => {
    return (
      <div className={"pull-right"}>
        <button className={"cancel"} onClick={props.onNo}>
          {strings.No}
        </button>
        <button className={"success"} onClick={props.onYes}>
          {strings.Yes}
        </button>
      </div>
    );
  };

  return (
    <MessageBox
      icon={"question-circle"}
      color={"neutral"}
      title={props.title}
      message={props.content}
      buttons={renderButtons}
    />
  );
};
