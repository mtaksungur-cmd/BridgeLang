import Link from 'next/link';
import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';

export default function StudentNavbar() {
  const handleLogout = async () => {
    await signOut(auth);
    window.location.href = '/login';
  };

  return (
    <nav className="navbar navbar-expand-lg bg-primary">
      <div className="container">
        {/* Brand + Logo */}
        <Link href="/student/dashboard"
        className="navbar-brand d-flex align-items-center">
            <img 
              src="/bridgelang.png" 
              alt="BridgeLang Logo" 
              height="30" 
              className="me-2" 
            />
            <span style={{ color: 'white', fontWeight: 'bold' }}>BridgeLang</span>
        </Link>

        {/* Hamburger toggler on mobile */}
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#studentNavbar"
          aria-controls="studentNavbar"
          aria-expanded="false"
          aria-label="Toggle navigation"
          style={{ borderColor: 'rgba(255,255,255,0.5)' }}
        >
          <span className="navbar-toggler-icon" style={{ filter: 'invert(1)' }}></span>
        </button>

        {/* Nav links */}
        <div className="collapse navbar-collapse" id="studentNavbar">
          <ul className="navbar-nav ms-auto mb-2 mb-lg-0 align-items-center">
            <li className="nav-item">
              <Link href="/student/dashboard" className="nav-link text-light">
                Dashboard
              </Link>
            </li>
            <li className="nav-item">
              <Link href="/student/teachers" className="nav-link text-light">
                Teachers
              </Link>
            </li>
            <li className="nav-item">
              <Link href="/student/lessons" className="nav-link text-light">
                My Lessons
              </Link>
            </li>
            <li className="nav-item">
              <Link href="/student/chats" className="nav-link text-light">
                Chats
              </Link>
            </li>
            <li className="nav-item">
              <Link href="/student/credits" className="btn m-2 bg-warning"
              style={{
                  color: '#222222',
                  fontWeight: '500',
                }}>
                Buy Credits
              </Link>
            </li>
            <li className="nav-item">
              <button
                onClick={handleLogout}
                className="btn m-2 bg-danger"
                style={{
                  color: '#ffffff',
                  fontWeight: '500',
                }}
              >
                Logout
              </button>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}
