import { MenuItem, Select } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import workareaStore from "mobx/stores/workareaStore";
import React from "react";
import { STRM } from "stateDefs/workspaceState";
import { SelectEventData } from "types/selectEventData";

interface Props {
  readonly isBroker: boolean;
  readonly onPersonalityChange: (personality: string) => void;
  readonly onShowProfileModal: () => void;
  readonly onRefAll: () => void;
}

const useDropdownStyles = makeStyles({
  root: {
    height: 30,
    lineHeight: "18px",
  },
});

export const RightPanelButtons: React.FC<Props> = (
  props: Props
): React.ReactElement | null => {
  const dropdownClasses = useDropdownStyles();
  const onPersonalityChange = ({
    target,
  }: React.ChangeEvent<SelectEventData>) => {
    props.onPersonalityChange(target.value as string);
  };
  if (props.isBroker) {
    const { banks } = workareaStore;
    const renderValue = (value: unknown): React.ReactNode => {
      return value as string;
    };
    if (banks.length === 0) return null;
    return (
      <div className={"broker-buttons"}>
        <Select
          value={workareaStore.personality}
          autoWidth={true}
          classes={dropdownClasses}
          renderValue={renderValue}
          disabled={!workareaStore.connected}
          onChange={onPersonalityChange}
        >
          <MenuItem key={STRM} value={STRM}>
            None
          </MenuItem>
          {banks.map((market: string) => (
            <MenuItem key={market} value={market}>
              {market}
            </MenuItem>
          ))}
        </Select>
        <button onClick={props.onRefAll}>
          <i className={"fa fa-eraser"} /> Ref ALL
        </button>
        <button onClick={props.onShowProfileModal}>
          <i className={"fa fa-user"} /> User Prof
        </button>
      </div>
    );
  } else {
    return (
      <div className={"broker-buttons"}>
        <button onClick={props.onShowProfileModal}>
          <i className={"fa fa-user"} /> User Prof
        </button>
      </div>
    );
  }
};
