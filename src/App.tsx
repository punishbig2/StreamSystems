import React from 'react';
import './App.css';
import Grid from "./components/Tiles/Grid";
import Tile from "./components/Tiles/Tile";

const App: React.FC = () => {
  const array: React.ReactNode[] = new Array<React.ReactNode>(100);
  // Javascript is still stupid, isn't it?
  array.fill(1);
  return (
    <Grid>
      {array.map((one, index) => <Tile key={index}/>)}
    </Grid>
  );
};

export default App;
