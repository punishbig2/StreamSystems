import { MessageBox } from 'components/MessageBox';
import { MiddleOfficeStore, MiddleOfficeStoreContext } from 'mobx/stores/middleOfficeStore';
import React, { ReactElement } from 'react';

export const SuccessMessage: React.FC = (): ReactElement | null => {
  const store = React.useContext<MiddleOfficeStore>(MiddleOfficeStoreContext);
  const { title, text } = (() => {
    if (store.successMessage === null) {
      return {
        title: '',
        text: '',
      };
    }
    return store.successMessage;
  })();
  return (
    <MessageBox
      title={title}
      message={text}
      icon="check-circle"
      buttons={() => (
        <button className="cancel" onClick={() => store.setSuccessMessage(null)}>
          Close
        </button>
      )}
      color="good"
    />
  );
};
