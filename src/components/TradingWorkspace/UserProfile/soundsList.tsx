import workareaStore from "mobx/stores/workareaStore";
import React, { useState, useEffect, ReactNode } from "react";
import { ExecSound } from "types/user";
import { Select, MenuItem } from "@material-ui/core";
import { addSound, getSoundsList, deleteSound } from "beep-sound";

interface OwnProps {
  value: string;
  name: string;
  onChange: (name: string, value: any) => void;
}

export const SoundsList: React.FC<OwnProps> = (props: OwnProps) => {
  const [sounds, setSounds] = useState<ExecSound[]>([]);
  useEffect(() => {
    getSoundsList().then(setSounds);
  }, []);

  const onExecSoundChange = (event: any) => {
    const { value } = event.target;
    if (value === "add") {
      const input: HTMLInputElement = document.createElement("input");
      input.setAttribute("type", "file");
      input.setAttribute("accept", "audio/*");
      input.click();
      input.onchange = () => {
        if (input.files) {
          const file: File = input.files[0];
          const reader: FileReader = new FileReader();
          reader.onload = () => {
            if (reader.result !== null) {
              const newFile: ExecSound = {
                data: reader.result,
                name: file.name,
              };
              addSound(newFile)
                .then(() => getSoundsList())
                .then((sounds: ExecSound[]) => {
                  // First update the list
                  setSounds(sounds);
                  setTimeout(() => {
                    // Now update the active item
                    props.onChange(props.name, file.name);
                  }, 0);
                });
            }
          };
          if (file) {
            reader.readAsDataURL(file);
          }
        }
      };
    } else {
      const { target } = event;
      props.onChange(target.name, target.value);
    }
  };

  const getExecSoundValue = (): string => {
    if (sounds.find((sound: ExecSound) => sound.name === props.value)) {
      return props.value;
    } else {
      return "default";
    }
  };

  const removeSound = (name: string) => {
    const index: number = sounds.findIndex(
      (sound: ExecSound) => sound.name === name
    );
    if (index === -1) return;
    setSounds([...sounds.slice(0, index), ...sounds.slice(index + 1)]);
    // Reset to default
    props.onChange(props.name, "default");
  };

  const displayName = (name: string) => name.replace(/\.[^.]+$/, "");
  const onDelete =
    (name: string) => (event: React.MouseEvent<HTMLDivElement>) => {
      event.stopPropagation();
      deleteSound(name).then(() => removeSound(name));
    };

  const DefaultItem: React.FC = () => (
    <div className="sound-item">
      <div className="label">Default</div>
    </div>
  );
  const AddNewItem: React.FC = () => (
    <div className="sound-item">
      <div className="label">Add New</div>
      <div className="button">
        <i className="fa fa-caret-right" />
      </div>
    </div>
  );

  const renderValue = (value: any): ReactNode => {
    switch (value) {
      case "default":
        return <DefaultItem />;
      case "add":
        return <AddNewItem />;
      default:
        return displayName(value);
    }
  };

  return (
    <Select
      id="exec-sound"
      name={props.name}
      value={getExecSoundValue()}
      renderValue={renderValue}
      disabled={!workareaStore.connected}
      onChange={onExecSoundChange}
    >
      <MenuItem value="default">
        <DefaultItem />
      </MenuItem>
      {sounds.map((item: ExecSound) => (
        <MenuItem key={item.name} value={item.name}>
          <div className="sound-item">
            <div className="label">{displayName(item.name)}</div>
            <div className="button delete">
              <i className="far fa-trash-alt" onClick={onDelete(item.name)} />
            </div>
          </div>
        </MenuItem>
      ))}
      <MenuItem key="add-item-key" value="add">
        <AddNewItem />
      </MenuItem>
    </Select>
  );
};
