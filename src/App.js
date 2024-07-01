import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MapComponent from './components/Map';


function App() {
  
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MapComponent />} />
      </Routes>
    </Router>
  );
}

export default App;
