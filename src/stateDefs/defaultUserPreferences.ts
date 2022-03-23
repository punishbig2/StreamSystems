import {
  UserPreferences,
  CurrencyGroups,
  OCOModes,
  UserTypes,
} from "types/user";
import { findDefaultTimezone } from "utils/commonUtils";

export const defaultPreferences: UserPreferences = {
  ccyGroup: CurrencyGroups.Default,
  execSound: "default",
  darkPoolExecSound: "default",
  fontFamily: "Default",
  fontSize: "normal",
  mpid: "",
  oco: OCOModes.Disabled,
  timezone: findDefaultTimezone(),
  userType: UserTypes.Unset,
  execSoundList: [],
  theme: "dark",
};
