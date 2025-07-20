import StudentNavbar from './StudentNavbar';

export default function StudentLayout({ children }) {
  return (
    <div>
      <StudentNavbar />
      <main>{children}</main>
    </div>
  );
}
