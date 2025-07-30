import Link from 'next/link';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';

const handleLogout = () => {
  signOut(auth).then(() => {
    window.location.href = '/login'; // yönlendirme
  });
};

export default function StudentNavbar() {
  return (
    <nav>
      <ul>
        <li><Link href="/student/dashboard">Dashboard</Link></li>
        <li><Link href="/student/teachers">Teachers</Link></li>
        <li><Link href="/student/lessons">My Lessons</Link></li>
        <li><Link href="/student/chats">Chats</Link></li>
        <li><Link href="/student/credits">Buy Credits</Link></li> {/* << EKLENDİ */}
        <li><button onClick={handleLogout}>Logout</button></li>
      </ul>
    </nav>
  );
}
