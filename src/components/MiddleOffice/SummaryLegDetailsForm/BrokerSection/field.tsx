import { FormField } from "components/FormField";
import { EditableFlag } from "components/MiddleOffice/types/moStrategy";
import { FieldDef } from "forms/fieldDef";
import moStore, { MoStore } from "mobx/stores/moStore";
import React, { ReactElement, useMemo } from "react";
import { BrokerageCommission } from "types/brokerageCommission";

interface Props extends FieldDef<BrokerageCommission, BrokerageCommission> {
  readonly value: BrokerageCommission;
  readonly onChange: (value: BrokerageCommission) => Promise<void>;
}

export const Field: React.FC<Props> = (props: Props): ReactElement => {
  const { value, name } = props;
  const { entry } = moStore;
  const { strategy } = entry;
  const editableCondition: EditableFlag = React.useMemo(() => {
    if (strategy !== undefined && strategy.fields !== undefined) {
      const { f1 } = strategy.fields;
      return f1[name];
    }
    return EditableFlag.None;
  }, [strategy, props]);
  const editable: boolean | undefined = React.useMemo(():
    | boolean
    | undefined => {
    if (!moStore.isEditMode) return false;
    if (
      editableCondition === EditableFlag.NotEditable ||
      editableCondition === EditableFlag.NotApplicable
    ) {
      return false;
    } else {
      if (typeof props.editable === "function") {
        return props.editable(name, entry, moStore.isEditMode, "");
      } else {
        return props.editable;
      }
    }
  }, [props, entry, editableCondition]);
  const computedValue: any = useMemo((): any => {
    if (
      MoStore.getFieldEditableFlag("", name, entry.strategy) ===
      EditableFlag.NotApplicable
    ) {
      return "N/A";
    } else {
      return value[name];
    }
  }, [value, name, entry]);
  return (
    <FormField<BrokerageCommission>
      name={name}
      label={props.label}
      value={computedValue}
      type={props.type}
      color={props.color}
      currency={"USD"}
      precision={props.precision}
      onChange={async (
        name: keyof BrokerageCommission,
        value: any
      ): Promise<void> => {
        return props.onChange({ ...value, [name]: value });
      }}
      editable={editable}
    />
  );
};
