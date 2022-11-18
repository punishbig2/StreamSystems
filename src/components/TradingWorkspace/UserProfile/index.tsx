import { ErrorBox } from 'components/ErrorBox';
import { MessageBox } from 'components/MessageBox';
import { UserProfileForm } from 'components/TradingWorkspace/UserProfile/form';
import strings from 'locales';
import store from 'mobx/stores/userPreferencesStore';
import { observer } from 'mobx-react';
import React, { useEffect } from 'react';
import { UserProfileModalTypes } from 'types/user';

interface OwnProps {
  onCancel: () => void;
}

type Props = OwnProps;

const UserProfileModal: React.FC<Props> = observer((props: Props) => {
  const onClose = (): void => {
    props.onCancel();
    // Reset the profile in case it has changed
    store.resetInitialProfile();
    store.setCurrentModal(UserProfileModalTypes.Form);
  };

  const onSubmit = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    store.saveUserProfile(store.preferences).then(onClose);
  };

  useEffect(() => {
    void store.loadUserProfile();
  }, []);

  const onChange = (name: string, value: any): void => {
    store.setFieldValue(name, value);
  };

  switch (store.currentModalType) {
    case UserProfileModalTypes.Form:
      return (
        <UserProfileForm
          profile={store.preferences}
          original={store.initialPreferences}
          onChange={onChange}
          onSubmit={onSubmit}
          onCancel={onClose}
        />
      );
    case UserProfileModalTypes.Saving:
      return (
        <MessageBox
          title="Saving your profile"
          message="Please wait while we're saving your profile"
          icon="spinner"
          color="good"
          buttons={() => null}
        />
      );
    case UserProfileModalTypes.Error:
      return (
        <ErrorBox
          message={'Something went wrong, we are sorry. This is quite unexpected.'}
          onClose={onClose}
          title={strings.ErrorModalTitle}
        />
      );
    default:
      return null;
  }
});

export { UserProfileModal };
