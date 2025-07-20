import TeacherNavbar from './TeacherNavbar';

export default function TeacherLayout({ children }) {
  return (
    <div>
      <TeacherNavbar />
      <main>{children}</main>
    </div>
  );
}
