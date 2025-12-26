import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Dictionary from './pages/Dictionary';
import Techniques from './pages/Techniques';
import Quiz from './pages/Quiz';
import Kata from './pages/Kata';
import KataDetail from './pages/KataDetail';
import History from './pages/History';
import Fijlkam from './pages/Fijlkam';
import Program from './pages/Program';
import BulletinBoard from './pages/BulletinBoard';
import FlashCard from './pages/FlashCard';
import GokyoGame from './pages/GokyoGame';
import GokyoTris from './pages/GokyoTris';
import Gallery from './pages/Gallery';
import KaeshiRenraku from './pages/KaeshiRenraku';
import Gestione from './pages/Gestione';
import Community from './pages/Community';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dizionario" element={<Dictionary />} />
        <Route path="/tecniche" element={<Techniques />} />
        <Route path="/quiz" element={<Quiz />} />

        {/* Batch 1 */}
        <Route path="/kata" element={<Kata />} />
        <Route path="/kata/:slug" element={<KataDetail />} />
        <Route path="/storia" element={<History />} />
        <Route path="/fijlkam" element={<Fijlkam />} />
        <Route path="/arbitraggio" element={<Navigate to="/fijlkam" replace />} />

        {/* Batch 2 */}
        <Route path="/programma" element={<Navigate to="/fijlkam" replace />} />
        <Route path="/bacheca" element={<BulletinBoard />} />

        {/* Batch 3 */}
        <Route path="/gokyo-game" element={<GokyoGame />} />
        <Route path="/gokyo-tris" element={<GokyoTris />} />
        <Route path="/flash" element={<FlashCard />} />
        <Route path="/gallery" element={<Gallery />} />
        <Route path="/kaeshi-renraku" element={<KaeshiRenraku />} />
        <Route path="/gestione" element={<Gestione />} />
        <Route path="/community" element={<Community />} />

      </Routes>
    </Router>
  );
}

export default App;