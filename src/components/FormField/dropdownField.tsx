import { MenuItem, Select } from "@material-ui/core";
import { ReadOnlyField } from "components/FormField/readOnlyField";
import { SearchItem } from "components/FormField/searchItem";
import { DropdownItem } from "forms/fieldDef";
import React, { Component } from "react";

interface Props<T> {
  readonly disabled?: boolean;
  readonly value: any;
  readonly name: keyof T;
  readonly editable?: boolean;
  readonly items: DropdownItem[];
  readonly onChange?: (name: keyof T, value: any) => void;
  readonly emptyMessage: string;
}

interface State {
  readonly searchKeyword: string;
}

export class DropdownField<T> extends Component<Props<T>, State> {
  public state: State = {
    searchKeyword: "",
  };

  private onChange = (
    event: React.ChangeEvent<{ name?: string; value: unknown }>,
    child: React.ReactNode
  ) => {
    const { props } = this;
    if (!props.editable) return;
    const { value } = event.target;
    // Call the callback
    setTimeout(() => {
      if (props.onChange !== undefined) {
        props.onChange(props.name, value);
      }
    }, 0);
    // Child is unused
    void child;
  };

  private onFilterChange = (value: string): void => {
    this.setState({
      searchKeyword: value,
    });
  };

  private filterItems = (item: DropdownItem): boolean => {
    const { searchKeyword } = this.state;
    const trimmed: string = searchKeyword.trim();
    if (trimmed === "") return true;
    const { value } = item;
    // Ignore casing, as humans generally do so!
    const normalizedValue: string = value.toLowerCase();
    const normalizedKeyword: string = trimmed.toLowerCase();
    // Check that the value, includes the keyword
    return normalizedValue.includes(normalizedKeyword);
  };

  private renderSelectValue = (value: any): string => {
    const { props } = this;
    const { items } = props;
    const item: DropdownItem | undefined = items.find(
      (item: DropdownItem): boolean => {
        return item.value === value;
      }
    );
    if (item === undefined) return props.emptyMessage;
    return item.label;
  };

  private getSearchItem = (): React.ReactElement | null => {
    const { items } = this.props;
    if (items.length < 7) return null;
    return (
      <SearchItem
        onSelectNext={() => undefined}
        onSelectPrev={() => undefined}
        onChange={this.onFilterChange}
      />
    );
  };

  public render(): React.ReactElement {
    const { props } = this;
    const { items } = props;
    if (!props.editable) {
      return (
        <ReadOnlyField
          name={props.name as string}
          disabled={props.disabled}
          value={this.renderSelectValue(props.value)}
        />
      );
    }
    return (
      <Select
        id={props.name as string}
        value={props.value}
        renderValue={this.renderSelectValue}
        displayEmpty={true}
        readOnly={!props.editable}
        disabled={props.disabled}
        onChange={this.onChange}
      >
        {this.getSearchItem()}
        {items
          .filter(this.filterItems)
          .map((item: { label: string; value: any }) => (
            <MenuItem key={item.value} value={item.value}>
              {item.label}
            </MenuItem>
          ))}
      </Select>
    );
  }
}
