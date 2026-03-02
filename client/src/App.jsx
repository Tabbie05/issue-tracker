import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Navbar';
import ToastContainer from './components/Toast';
import Dashboard from './pages/Dashboard';
import CreateIssue from './pages/CreateIssue';
import IssueDetail from './pages/IssueDetail';
import KanbanBoard from './pages/KanbanBoard';
import './App.css';

function App() {
  return (
    <ThemeProvider>
      <Router>
        <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
          <Navbar />
          <ToastContainer />
          <main>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/kanban" element={<KanbanBoard />} />
              <Route path="/create" element={<CreateIssue />} />
              <Route path="/issues/:id" element={<IssueDetail />} />
            </Routes>
          </main>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;
