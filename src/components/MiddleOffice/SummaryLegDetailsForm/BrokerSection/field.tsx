import { FormField } from 'components/FormField';
import { FieldDef } from 'forms/fieldDef';
import { MiddleOfficeStore, MiddleOfficeStoreContext } from 'mobx/stores/middleOfficeStore';
import React, { ReactElement, useMemo } from 'react';
import { BrokerageCommission } from 'types/brokerageCommission';
import { EditableFlag } from 'types/product';

interface Props extends FieldDef<BrokerageCommission, BrokerageCommission> {
  readonly value: BrokerageCommission;
  readonly disabled: boolean;
  readonly onChange: (value: BrokerageCommission) => Promise<void>;
}

export const Field: React.FC<Props> = (props: Props): ReactElement => {
  const store = React.useContext<MiddleOfficeStore>(MiddleOfficeStoreContext);
  const { value, name } = props;
  const { entry } = store;
  const { editable: editableProp } = props;
  const editable: boolean | undefined = ((): boolean | undefined => {
    if (typeof editableProp === 'function') {
      return editableProp(name, entry, store.isEditMode, '');
    } else {
      return editableProp;
    }
  })();
  const computedValue: any = useMemo((): any => {
    if (
      MiddleOfficeStore.getFieldEditableFlag('', name, entry.strategy) ===
      EditableFlag.NotApplicable
    ) {
      return 'N/A';
    } else {
      return value[name];
    }
  }, [value, name, entry]);
  return (
    <FormField<BrokerageCommission, MiddleOfficeStore>
      name={name}
      disabled={props.disabled}
      label={props.label}
      value={computedValue}
      type={props.type}
      color={props.color}
      currency="USD"
      precision={props.precision}
      onChange={async (name: keyof BrokerageCommission, value: any): Promise<void> => {
        return props.onChange({ ...value, [name]: value });
      }}
      editable={editable}
      store={store}
    />
  );
};
