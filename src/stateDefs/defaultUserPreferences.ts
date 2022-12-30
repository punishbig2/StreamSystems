import { CurrencyGroups, OCOModes, UserPreferences, UserTypes } from 'types/user';
import { findDefaultTimezone } from 'utils/commonUtils';

export const defaultPreferences: UserPreferences = {
  ccyGroup: CurrencyGroups.Default,
  execSound: 'default',
  darkPoolExecSound: 'default',
  fontFamily: 'Oxygen',
  fontSize: 'normal',
  mpid: '',
  oco: OCOModes.Disabled,
  timezone: findDefaultTimezone(),
  userType: UserTypes.Unset,
  execSoundList: [],
  theme: 'dark',
  windowManager: {
    allowHorizontalOverflow: true,
    reArrangeDockedWindows: true,
  },
};
