import React, { ReactElement, useState } from "react";
import { Menu, MenuItem } from "@material-ui/core";

export interface MenuItemSpec {
  readonly label: string;
  readonly action: () => void;
}

interface Props {
  readonly disabled: boolean;
  readonly icon?: string;
  readonly items: MenuItemSpec[];
}

export const OptionsButton: React.FC<Props> = (props: Props): ReactElement => {
  const [button, setButton] = useState<HTMLButtonElement | null>(null);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const { items } = props;
  return (
    <>
      <button ref={setButton} disabled={props.disabled} onClick={() => setIsOpen(!isOpen)}>
        <i className={"fa fa-" + props.icon} />
      </button>
      <Menu anchorEl={button} open={isOpen} onClose={() => setIsOpen(false)}>
        {items.map((item: MenuItemSpec) => (
          <MenuItem key={item.label} onClick={item.action}>{item.label}</MenuItem>
        ))}
      </Menu>
    </>
  );
};

OptionsButton.defaultProps = {
  icon: "ellipsis-v",
};
