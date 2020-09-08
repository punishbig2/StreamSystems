import { MessageBox } from "components/MessageBox";
import moStore from "mobx/stores/moStore";
import React, { ReactElement } from "react";

export const SuccessMessage: React.FC = (): ReactElement | null => {
  const { title, text } = (() => {
    if (moStore.successMessage === null) {
      return {
        title: "",
        text: "",
      };
    }
    return moStore.successMessage;
  })();
  return (
    <MessageBox
      title={title}
      message={text}
      icon={"check-circle"}
      buttons={() => (
        <button
          className={"cancel"}
          onClick={() => moStore.setSuccessMessage(null)}
        >
          Close
        </button>
      )}
      color={"good"}
    />
  );
};
