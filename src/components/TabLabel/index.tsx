import React, {ChangeEvent, KeyboardEvent, useState} from 'react';
import styled from 'styled-components';

const Layout = styled.div`
  display: flex;
  align-items: center;
  height: 100%;
  button {
    border: none;
    background: none;
    margin: 0 0 0 8px;
    transition: all 0.25s;
    width: 22px;
    height: 22px;
    border-radius: 11px;
    &:hover {
      background-color: crimson;
      color: white;
    }
  }
  input {
    font-size: ${({theme}) => theme.mediumFontSize}px;
    font-weight: ${({theme}) => theme.mediumFontWeight};
    padding: 0 8px;
    display: block;
    flex: 1;
    height: 100%;
    border: none;
    &:read-only {
      outline: none;
      cursor: default;
    }
  }
`;

interface Props {
  label: string,
  onRenamed: (name: string) => void;
  onClosed: (event: React.MouseEvent) => void;
}

export const TabLabel: React.FC<Props> = (props: Props) => {
  const [editable, setEditable] = useState(false);
  const [value, setValue] = useState(props.label);
  const cancel = () => {
    setValue(props.label);
    setEditable(false);
  };
  const onChange = ({target: {value}}: ChangeEvent<HTMLInputElement>) => {
    setValue(value);
  };
  const onBlur = () => cancel();
  const onKeyDown = ({key}: KeyboardEvent<HTMLInputElement>) => {
    switch (key) {
      case 'Escape':
        cancel();
        break;
      case 'Enter':
        props.onRenamed(value);
        setEditable(false);
        break;
    }
  };
  const onDoubleClick = () => setEditable(true);
  return (
    <Layout>
      <input value={value}
             readOnly={!editable}
             onChange={onChange}
             onBlur={onBlur}
             onDoubleClick={onDoubleClick}
             onKeyDown={onKeyDown}/>
      <button onClick={props.onClosed}><i className={'fa fa-times'}/></button>
    </Layout>
  );
};
