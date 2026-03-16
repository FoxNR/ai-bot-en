import fs from 'fs/promises';
import path from 'path';
import Link from 'next/link';

export default async function AdminLeadsList() {
  const filePath = path.join(process.cwd(), 'data', 'leads.json');
  let leads: any[] = [];
  try {
    const fileData = await fs.readFile(filePath, 'utf-8');
    leads = JSON.parse(fileData);
  } catch (err) {}

  const sortedLeads = [...leads].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div>
      <h1 style={{ marginBottom: '20px', fontSize: '24px' }}>Список лідів / пацієнтів</h1>
      
      <div style={{ background: '#fff', borderRadius: '12px', overflow: 'hidden', border: '1px solid #eaeaea', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
          <thead style={{ background: '#fafafa' }}>
            <tr>
              <th style={{ padding: '16px 20px', borderBottom: '1px solid #eaeaea', color: '#555', fontWeight: '600' }}>Дата / Час</th>
              <th style={{ padding: '16px 20px', borderBottom: '1px solid #eaeaea', color: '#555', fontWeight: '600' }}>Клієнт</th>
              <th style={{ padding: '16px 20px', borderBottom: '1px solid #eaeaea', color: '#555', fontWeight: '600' }}>Тригер</th>
              <th style={{ padding: '16px 20px', borderBottom: '1px solid #eaeaea', color: '#555', fontWeight: '600' }}>Скоринг</th>
              <th style={{ padding: '16px 20px', borderBottom: '1px solid #eaeaea', color: '#555', fontWeight: '600' }}>Статус</th>
              <th style={{ padding: '16px 20px', borderBottom: '1px solid #eaeaea', color: '#555', fontWeight: '600' }}>Джерело</th>
              <th style={{ padding: '16px 20px', borderBottom: '1px solid #eaeaea', color: '#555', fontWeight: '600' }}>Дія</th>
            </tr>
          </thead>
          <tbody>
            {sortedLeads.map((lead: any, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid #eaeaea', transition: 'background-color 0.2s' }}>
                <td style={{ padding: '16px 20px', color: '#333' }}>{new Date(lead.date).toLocaleString('uk-UA')}</td>
                <td style={{ padding: '16px 20px', fontWeight: '500' }}>{lead.name || 'Анонім'}</td>
                <td style={{ padding: '16px 20px', color: '#666' }}>{lead.trigger}</td>
                <td style={{ padding: '16px 20px' }}>
                  <span style={{ 
                    padding: '6px 10px', borderRadius: '6px', fontWeight: 'bold', fontSize: '12px',
                    background: lead.score > 80 ? '#fdf0ed' : lead.score > 40 ? '#fff8e1' : '#f5f5f5',
                    color: lead.score > 80 ? '#e74c3c' : lead.score > 40 ? '#f39c12' : '#7f8c8d'
                  }}>
                    {lead.score}
                  </span>
                </td>
                <td style={{ padding: '16px 20px' }}>
                  <span style={{ 
                    padding: '6px 10px', borderRadius: '6px', fontSize: '12px',
                    background: lead.status === 'Новий' ? '#eef2ff' : '#f0fdf0',
                    color: lead.status === 'Новий' ? '#4f46e5' : '#5BBA4B'
                  }}>{lead.status}</span>
                </td>
                <td style={{ padding: '16px 20px', color: '#666' }}>{lead.source}</td>
                <td style={{ padding: '16px 20px' }}>
                  <Link href={`/admin/leads/${lead.id}`} style={{ color: '#5BBA4B', textDecoration: 'none', fontWeight: '600' }}>
                    Картка ліда &rarr;
                  </Link>
                </td>
              </tr>
            ))}
            {sortedLeads.length === 0 && (
              <tr><td colSpan={7} style={{ padding: '40px 20px', textAlign: 'center', color: '#999' }}>Немає лідів</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
