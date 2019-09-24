import React, {ReactNode} from 'react';
import './App.css';
import Grid from "./components/Tiles/Grid";
import Tile from "./components/Tiles/Tile";

import './fonts/fontawesome/css/all.min.css';

const App: React.FC = () => {
  const array: ReactNode[] = new Array<ReactNode>(30);
  // Javascript is still stupid, isn't it?
  array.fill(1);
  const content = (): ReactNode => {
    return null;
  };
  return (
    <Grid>
      {array.map((one, index) => <Tile key={index} title={`Tile ${index}`} render={content}/>)}
    </Grid>
  );
};

export default App;
