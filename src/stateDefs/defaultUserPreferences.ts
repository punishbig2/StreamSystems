import {
  UserPreferences,
  CurrencyGroups,
  OCOModes,
  UserTypes,
} from "types/user";
import { findDefaultTimezone } from "utils/commonUtils";

export const defaultPreferences: UserPreferences = {
  ccyGroup: CurrencyGroups.Default,
  colorScheme: "default",
  execSound: "default",
  darkPoolExecSound: "default",
  font: "default",
  fontSize: "15px",
  mpid: "",
  oco: OCOModes.Disabled,
  timezone: findDefaultTimezone(),
  userType: UserTypes.Unset,
  execSoundList: [],
  theme: "dark",
};
