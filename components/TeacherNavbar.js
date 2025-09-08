import Link from 'next/link';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import Image from 'next/image';

const handleLogout = () => {
  signOut(auth).then(() => {
    window.location.href = '/login'; // yönlendirme
  });
};

export default function TeacherNavbar() {
  return (
    <nav className="navbar navbar-expand-lg bg-primary">
      <div className="container">  
      <Link href="/teacher/dashboard"
        className="navbar-brand d-flex align-items-center">
            <Image
              src="/bridgelang.png"
              alt="BridgeLang Logo"
              width={50}   // orantıya göre bir genişlik yaz
              height={50}   // yükseklik aynı kalabilir
              className="me-2"
            />
            <span style={{ color: 'white', fontWeight: 'bold' }}>BridgeLang</span>
        </Link>

        {/* Hamburger toggler on mobile */}
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#teacherNavbar"
          aria-controls="teacherNavbar"
          aria-expanded="false"
          aria-label="Toggle navigation"
          style={{ borderColor: 'rgba(255,255,255,0.5)' }}
        >
          <span className="navbar-toggler-icon" style={{ filter: 'invert(1)' }}></span>
        </button>

      <div className="collapse navbar-collapse" id="teacherNavbar">
        <ul className="navbar-nav ms-auto mb-2 mb-lg-0 align-items-center">
          <li className='nav-item'>
            <Link href="/teacher/dashboard" className="nav-link text-light">Dashboard</Link>
          </li>
          <li className='nav-item'>
            <Link href="/teacher/calendar" className="nav-link text-light">Calendar</Link>
          </li>
          <li className='nav-item'><Link href="/teacher/lessons" className="nav-link text-light">My Lessons</Link></li>
          <li className='nav-item'><Link href="/teacher/chats" className="nav-link text-light">Chats</Link></li>
          <li className="nav-item">
                <button
                  onClick={handleLogout}
                  className="btn bg-danger"
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
