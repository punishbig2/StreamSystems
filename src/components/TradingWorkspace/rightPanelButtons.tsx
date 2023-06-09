import { MenuItem, Select } from '@material-ui/core';
import workareaStore from 'mobx/stores/workareaStore';
import { observer } from 'mobx-react';
import React from 'react';
import { NONE } from 'stateDefs/workspaceState';
import { SelectEventData } from 'types/selectEventData';

interface Props {
  readonly isBroker: boolean;
  readonly onPersonalityChange: (personality: string) => void;
  readonly onShowProfileModal: () => void;
  readonly onRefAll: () => void;
  readonly refAllDisabled: boolean;
}

export const RightPanelButtons: React.FC<Props> = observer(
  (props: Props): React.ReactElement | null => {
    const onPersonalityChange = ({ target }: React.ChangeEvent<SelectEventData>): void => {
      props.onPersonalityChange(target.value as string);
    };
    if (props.isBroker) {
      const { banks } = workareaStore;
      const renderValue = (value: unknown): React.ReactNode => {
        return value as string;
      };

      if (banks.length === 0) {
        return null;
      }

      return (
        <div className="broker-buttons">
          <Select
            value={workareaStore.personality}
            classes={{ root: 'right-panel-select' }}
            renderValue={renderValue}
            disabled={!workareaStore.connected}
            onChange={onPersonalityChange}
          >
            <MenuItem key={NONE} value={NONE}>
              None
            </MenuItem>
            {banks.map((market: string) => (
              <MenuItem key={market} value={market}>
                {market}
              </MenuItem>
            ))}
          </Select>
          <button onClick={props.onRefAll} disabled={props.refAllDisabled}>
            <i className="fa fa-eraser" /> Ref ALL
          </button>
          <button onClick={props.onShowProfileModal}>
            <i className="fa fa-user" /> User Prof
          </button>
        </div>
      );
    } else {
      return (
        <div className="broker-buttons">
          <button onClick={props.onRefAll}>
            <i className="fa fa-eraser" /> Ref ALL
          </button>
          <button onClick={props.onShowProfileModal}>
            <i className="fa fa-user" /> User Prof
          </button>
        </div>
      );
    }
  }
);
