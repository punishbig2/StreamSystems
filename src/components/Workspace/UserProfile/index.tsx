import React, { useEffect, ReactElement } from "react";
import { UserProfileModalTypes } from "types/user";
import { UserProfileForm } from "components/Workspace/UserProfile/form";
import { ErrorBox } from "components/ErrorBox";
import { MessageBox } from "components/MessageBox";
import store from "mobx/stores/userPreferencesStore";
import { observer } from "mobx-react";
import strings from "locales";

interface OwnProps {
  onCancel: () => void;
}

type Props = OwnProps;

const UserProfileModal: React.FC<Props> = observer((props: Props) => {
  const onClose = () => {
    props.onCancel();
    // Reset the profile in case it has changed
    store.resetInitialProfile();
    store.setCurrentModal(UserProfileModalTypes.Form);
  };

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    store.saveUserProfile(store.preferences);
  };

  useEffect(() => {
    store.loadUserProfile();
  }, []);

  const onChange = (name: string, value: any) => {
    store.setFieldValue(name, value);
  };

  const closeButton = (): ReactElement => (
    <button className={"cancel"} onClick={onClose}>
      Close
    </button>
  );

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
          title={"Saving your profile"}
          message={"Please wait while we're saving your profile"}
          icon={"spinner"}
          color={"good"}
          buttons={() => null}
        />
      );
    case UserProfileModalTypes.Success:
      return (
        <MessageBox
          title={"Looks Good"}
          message={"Looks like your settings were saved successfully, great!"}
          icon={"check-circle"}
          color={"good"}
          buttons={closeButton}
        />
      );
    case UserProfileModalTypes.Error:
      return (
        <ErrorBox
          message={
            "Something went wrong, we are sorry. This is quite unexpected."
          }
          onClose={onClose}
          title={strings.ErrorModalTitle}
        />
      );
    default:
      return null;
  }
});

export { UserProfileModal };
