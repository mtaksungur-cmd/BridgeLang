import Link from 'next/link';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';

const handleLogout = () => {
  signOut(auth).then(() => {
    window.location.href = '/login'; // yönlendirme
  });
};

export default function TeacherNavbar() {
  return (
    <nav>
      <ul>
        <li><Link href="/teacher/dashboard">Dashboard</Link></li>
        <li><Link href="/teacher/calendar">Calendar</Link></li>
        <li><Link href="/teacher/lessons">My Lessons</Link></li>
        <li><Link href="/teacher/chats">Chats</Link></li>
        <li><button onClick={handleLogout}>Logout</button></li>
      </ul>
    </nav>
  );
}
