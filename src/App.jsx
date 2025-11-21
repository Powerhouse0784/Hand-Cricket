import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Game from './Game';
import FrontPage from './FrontPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<FrontPage />} />
        <Route path="/game" element={<Game />} />
      </Routes>
    </Router>
  );
}

export default App;