import { HashRouter, Route, Routes } from 'react-router-dom';
import { CreateRoomPage } from './pages/CreateRoomPage';
import { IntroPage } from './pages/IntroPage';
import { JoinRoomPage } from './pages/JoinRoomPage';
import { OasisMainPage } from './pages/OasisMainPage';
import { ProfileSetupPage } from './pages/ProfileSetupPage';
import { WeeklyHistoryPage } from './pages/WeeklyHistoryPage';

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<IntroPage />} />
        <Route path="/profile" element={<ProfileSetupPage />} />
        <Route path="/room/new" element={<CreateRoomPage />} />
        <Route path="/room/join" element={<JoinRoomPage />} />
        <Route path="/oasis/:roomId" element={<OasisMainPage />} />
        <Route path="/oasis/:roomId/history" element={<WeeklyHistoryPage />} />
      </Routes>
    </HashRouter>
  );
}
