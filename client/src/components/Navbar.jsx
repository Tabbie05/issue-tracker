import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { FiSun, FiMoon, FiPlus, FiHome, FiMenu, FiX, FiColumns } from 'react-icons/fi';
import { useState } from 'react';

export default function Navbar() {
  const { dark, toggleTheme } = useTheme();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  return (
    <nav style={{ background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)' }} className="sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex justify-between items-center h-14">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--color-primary)' }}>
              <span className="text-white font-bold text-xs tracking-wide">IT</span>
            </div>
            <span className="font-semibold text-lg hidden sm:block" style={{ color: 'var(--color-text)' }}>
              Issue Tracker
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-2">
            <Link
              to="/"
              className="btn-secondary"
              style={isActive('/') ? { background: 'var(--color-primary-light)', color: 'var(--color-primary)', borderColor: 'var(--color-primary-subtle)' } : {}}
            >
              <FiHome size={15} /> Dashboard
            </Link>
            <Link
              to="/kanban"
              className="btn-secondary"
              style={isActive('/kanban') ? { background: 'var(--color-primary-light)', color: 'var(--color-primary)', borderColor: 'var(--color-primary-subtle)' } : {}}
            >
              <FiColumns size={15} /> Kanban
            </Link>
            <Link to="/create" className="btn-primary">
              <FiPlus size={15} /> New Issue
            </Link>
            <button
              onClick={toggleTheme}
              className="btn-secondary"
              style={{ padding: '0.5rem' }}
              title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {dark ? <FiSun size={18} /> : <FiMoon size={18} />}
            </button>
          </div>

          {/* Mobile */}
          <div className="md:hidden flex items-center gap-1">
            <button onClick={toggleTheme} className="btn-secondary" style={{ padding: '0.5rem' }}>
              {dark ? <FiSun size={18} /> : <FiMoon size={18} />}
            </button>
            <button onClick={() => setMenuOpen(!menuOpen)} className="btn-secondary" style={{ padding: '0.5rem' }}>
              {menuOpen ? <FiX size={22} /> : <FiMenu size={22} />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="md:hidden pb-3 space-y-1">
            <Link to="/" onClick={() => setMenuOpen(false)} className="btn-secondary w-full justify-start">
              <FiHome size={15} /> Dashboard
            </Link>
            <Link to="/kanban" onClick={() => setMenuOpen(false)} className="btn-secondary w-full justify-start">
              <FiColumns size={15} /> Kanban
            </Link>
            <Link to="/create" onClick={() => setMenuOpen(false)} className="btn-primary w-full justify-center">
              <FiPlus size={15} /> New Issue
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
