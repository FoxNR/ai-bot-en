import fs from 'fs/promises';
import path from 'path';
import Link from 'next/link';
import { notFound } from 'next/navigation';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function LeadCard(props: PageProps) {
  const { id } = await props.params;
  
  const filePath = path.join(process.cwd(), 'data', 'leads.json');
  let leads: any[] = [];
  try {
    const fileData = await fs.readFile(filePath, 'utf-8');
    leads = JSON.parse(fileData);
  } catch (err) {}

  const lead = leads.find(l => l.id === id);
  
  if (!lead) {
    notFound();
  }

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
         <Link href="/admin/leads" style={{ color: '#5BBA4B', textDecoration: 'none' }}>&larr; Назад до списку</Link>
      </div>
      <h1 style={{ marginBottom: '20px', fontSize: '24px' }}>Картка ліда: {lead.name}</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 2fr', gap: '20px' }}>
        
        {/* Left Column: Summary and Contacts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div style={{ background: '#fff', padding: '24px', borderRadius: '16px', border: '1px solid #eaeaea', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
            <h3 style={{ margin: '0 0 15px 0', fontSize: '16px', color: '#111' }}>Резюме ШІ</h3>
            <p style={{ margin: 0, color: '#444', lineHeight: '1.5', fontSize: '14px' }}>{lead.summary}</p>
          </div>

          <div style={{ background: '#fff', padding: '24px', borderRadius: '16px', border: '1px solid #eaeaea', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
            <h3 style={{ margin: '0 0 15px 0', fontSize: '16px', color: '#111' }}>Контакти та Інфо</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px' }}>
              <p style={{ margin: 0 }}><strong>Ім'я:</strong> {lead.name}</p>
              <p style={{ margin: 0 }}><strong>Телефон:</strong> {lead.phone}</p>
              <p style={{ margin: 0 }}><strong>Дата:</strong> {new Date(lead.date).toLocaleString('uk-UA')}</p>
              <p style={{ margin: 0 }}><strong>Скоринг:</strong> <span style={{ color: lead.score > 80 ? '#e74c3c' : '#333', fontWeight: 'bold' }}>{lead.score} / 100</span></p>
              <p style={{ margin: 0 }}><strong>Тригер:</strong> {lead.trigger}</p>
              <p style={{ margin: 0 }}><strong>Намір:</strong> {lead.intent}</p>
            </div>
          </div>

          <div style={{ background: '#fff', padding: '24px', borderRadius: '16px', border: '1px solid #eaeaea', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
            <h3 style={{ margin: '0 0 15px 0', fontSize: '16px', color: '#111' }}>Дії</h3>
            <div style={{ display: 'flex', gap: '10px', flexDirection: 'column' }}>
              <a href={`tel:${lead.phone}`} style={{ display: 'block', textAlign: 'center', padding: '12px', background: '#5BBA4B', color: '#fff', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold' }}>
                Зателефонувати
              </a>
              <button style={{ padding: '12px', background: '#f0fdf0', color: '#5BBA4B', border: '1px solid #5BBA4B', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                Надіслати в Telegram
              </button>
              <button style={{ padding: '12px', background: '#f5f5f5', color: '#333', border: '1px solid #ddd', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                Позначити як "В роботі"
              </button>
            </div>
          </div>

        </div>

        {/* Right Column: Chat Transcript */}
        <div style={{ background: '#fff', padding: '24px', borderRadius: '16px', border: '1px solid #eaeaea', boxShadow: '0 4px 12px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', maxHeight: '800px' }}>
          <h3 style={{ margin: '0 0 15px 0', fontSize: '16px', color: '#111' }}>Діалог</h3>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '15px', overflowY: 'auto', paddingRight: '10px' }}>
            {lead.chatLog && lead.chatLog.map((msg: any, idx: number) => (
              <div key={idx} style={{ 
                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                background: msg.role === 'user' ? '#eef2ff' : '#f5f5f5',
                padding: '12px 16px',
                borderRadius: '12px',
                maxWidth: '85%'
              }}>
                <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px' }}>
                  {msg.role === 'user' ? 'Пацієнт' : 'ШІ Бот'}
                </div>
                <div style={{ fontSize: '14px', lineHeight: '1.5', color: '#333', whiteSpace: 'pre-wrap' }}>
                  {msg.content}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
