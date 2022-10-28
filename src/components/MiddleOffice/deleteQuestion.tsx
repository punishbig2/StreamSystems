import { QuestionBox } from "components/QuestionBox";
import React, { ReactElement } from "react";

interface Props {
  readonly onNo: () => void;
  readonly onYes: () => void;
}

export const DeleteQuestion: React.FC<Props> = (props: Props): ReactElement => {
  return (
    <QuestionBox
      title="Delete Deal"
      content={
        "Are you sure you want to remove this deal? This is irreversible"
      }
      onNo={props.onNo}
      onYes={props.onYes}
    />
  );
};
