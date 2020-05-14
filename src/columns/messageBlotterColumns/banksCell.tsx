import React, { ReactElement } from "react";
import workareaStore from "../../mobx/stores/workareaStore";
import { Select } from "../../components/Select";
import { Message } from "../../interfaces/message";

type Props = {
  message: Message;
  value: string;
  label: string;
  onChange: (value: string) => void;
};
export const BankCell: React.FC<Props> = (
  props: Props
): ReactElement | null => {
  const { message } = props;
  const { banks } = workareaStore;
  if (message) {
    return null;
  } else {
    const list: any[] = banks.map((name: string) => {
      return {
        name: name,
        value: name,
      };
    });
    return (
      <Select
        fit={true}
        list={list}
        empty={props.label}
        value={props.value}
        onChange={props.onChange}
      />
    );
  }
};
