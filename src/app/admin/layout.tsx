import Link from 'next/link';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f5f7f9' }}>
      <aside style={{ width: '250px', background: '#fff', borderRight: '1px solid #ddd', padding: '20px' }}>
        <h2 style={{ color: '#5BBA4B', marginBottom: '30px' }}>Salutem CRM</h2>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <Link href="/admin" style={{ textDecoration: 'none', color: '#333', fontWeight: 'bold' }}>Дашборд</Link>
          <Link href="/admin/leads" style={{ textDecoration: 'none', color: '#333', fontWeight: 'bold' }}>Усі ліди</Link>
          <Link href="/admin/kb" style={{ textDecoration: 'none', color: '#333', fontWeight: 'bold' }}>База знань (Навчання ШІ)</Link>
        </nav>
      </aside>
      <main style={{ flex: 1, padding: '30px', overflowY: 'auto' }}>
        {children}
      </main>
    </div>
  );
}
