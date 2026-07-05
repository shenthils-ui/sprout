import { NavLink, Navigate, Route, Routes } from 'react-router-dom';
import { CelebrationProvider } from './components/Celebration.jsx';
import Diary from './screens/Diary.jsx';
import History from './screens/History.jsx';
import Insights from './screens/Insights.jsx';
import MemoryBook from './screens/MemoryBook.jsx';
import Recap from './screens/Recap.jsx';
import Settings from './screens/Settings.jsx';
import Stickers from './screens/Stickers.jsx';
import Today from './screens/Today.jsx';

const TABS = [
  { to: '/today', emoji: '🌱', label: 'Today' },
  { to: '/diary', emoji: '📔', label: 'Diary' },
  { to: '/history', emoji: '📅', label: 'History' },
  { to: '/stickers', emoji: '⭐', label: 'Stickers' },
  { to: '/insights', emoji: '📊', label: 'Insights' },
  { to: '/settings', emoji: '⚙️', label: 'Settings' },
];

export default function App() {
  return (
    <CelebrationProvider>
      <div className="mx-auto flex min-h-dvh max-w-lg flex-col">
        <main className="flex-1 px-4 pb-24 pt-3">
          <Routes>
            <Route path="/" element={<Navigate to="/today" replace />} />
            <Route path="/today" element={<Today />} />
            <Route path="/diary" element={<Diary />} />
            <Route path="/history" element={<History />} />
            <Route path="/stickers" element={<Stickers />} />
            <Route path="/insights" element={<Insights />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/memory-book" element={<MemoryBook />} />
            <Route path="/recap" element={<Recap />} />
            <Route path="*" element={<Navigate to="/today" replace />} />
          </Routes>
        </main>

        <nav className="no-print fixed inset-x-0 bottom-0 z-40 border-t border-(--line) bg-(--card)/95 backdrop-blur"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
          <div className="mx-auto flex max-w-lg">
            {TABS.map((t) => (
              <NavLink key={t.to} to={t.to}
                className={({ isActive }) =>
                  `flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-semibold transition-transform ${
                    isActive ? 'text-(--accent) scale-110' : 'text-(--muted)'}`}>
                <span className="text-xl leading-none">{t.emoji}</span>
                {t.label}
              </NavLink>
            ))}
          </div>
        </nav>
      </div>
    </CelebrationProvider>
  );
}
