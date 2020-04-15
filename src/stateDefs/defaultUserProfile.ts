import { UserPreferences, CurrencyGroups, OCOModes, UserTypes } from 'interfaces/user';
import { findDefaultTimezone } from 'utils';

export const defaultProfile: UserPreferences = {
  ccyGroup: CurrencyGroups.Invalid,
  colorScheme: 'default',
  execSound: 'default',
  darkPoolExecSound: 'default',
  font: 'default',
  fontSize: '15px',
  mpid: '',
  oco: OCOModes.Disabled,
  timezone: findDefaultTimezone(),
  lastOCOUpdateTimestamp: null,
  userType: UserTypes.Unset,
  execSoundList: [],
};
