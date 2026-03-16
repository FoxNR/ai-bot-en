"use client";

import React, { useState } from 'react';

export default function KnowledgeBaseAdmin() {
  const [activeTab, setActiveTab] = useState<'url' | 'text' | 'file'>('url');
  
  const [url, setUrl] = useState('');
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  
  const [status, setStatus] = useState({ loading: false, message: '', type: '' });

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    setStatus({ loading: true, message: 'Завантаження та парсинг URL...', type: 'info' });
    try {
      const res = await fetch('/api/kb', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'url', payload: url })
      });
      const data = await res.json();
      if (data.success) {
        setStatus({ loading: false, message: 'Дані з URL успішно додано до бази знань!', type: 'success' });
        setUrl('');
      } else throw new Error(data.error);
    } catch (err: any) {
      setStatus({ loading: false, message: 'Помилка: ' + err.message, type: 'error' });
    }
  };

  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text) return;
    setStatus({ loading: true, message: 'Збереження тексту...', type: 'info' });
    try {
      const res = await fetch('/api/kb', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'text', payload: text })
      });
      const data = await res.json();
      if (data.success) {
        setStatus({ loading: false, message: 'Текст успішно додано до бази знань!', type: 'success' });
        setText('');
      } else throw new Error(data.error);
    } catch (err: any) {
      setStatus({ loading: false, message: 'Помилка: ' + err.message, type: 'error' });
    }
  };

  const handleFileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setStatus({ loading: true, message: 'Обробка файлу...', type: 'info' });
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'file');
    
    try {
      const res = await fetch('/api/kb', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        setStatus({ loading: false, message: 'Файл успішно додано до бази знань!', type: 'success' });
        setFile(null);
      } else throw new Error(data.error);
    } catch (err: any) {
      setStatus({ loading: false, message: 'Помилка: ' + err.message, type: 'error' });
    }
  };

  return (
    <div>
      <h1 style={{ marginBottom: '20px', fontSize: '24px' }}>Адмінка для навчання бота</h1>
      <p style={{ color: '#666', marginBottom: '30px' }}>
        Тут ви можете додавати матеріали (посилання, тексти, документи), на основі яких штучний інтелект буде вести експертний діалог з пацієнтами.
      </p>

      {/* Tabs Menu */}
      <div style={{ display: 'flex', borderBottom: '2px solid #eaeaea', marginBottom: '30px' }}>
         <button 
           onClick={() => setActiveTab('url')}
           style={{ 
             padding: '12px 24px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '15px', fontWeight: 'bold',
             color: activeTab === 'url' ? '#5BBA4B' : '#777', borderBottom: activeTab === 'url' ? '3px solid #5BBA4B' : '3px solid transparent',
             marginBottom: '-2px'
           }}
         >
           URL-адреса
         </button>
         <button 
           onClick={() => setActiveTab('text')}
           style={{ 
             padding: '12px 24px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '15px', fontWeight: 'bold',
             color: activeTab === 'text' ? '#5BBA4B' : '#777', borderBottom: activeTab === 'text' ? '3px solid #5BBA4B' : '3px solid transparent',
             marginBottom: '-2px'
           }}
         >
           Текст
         </button>
         <button 
           onClick={() => setActiveTab('file')}
           style={{ 
             padding: '12px 24px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '15px', fontWeight: 'bold',
             color: activeTab === 'file' ? '#5BBA4B' : '#777', borderBottom: activeTab === 'file' ? '3px solid #5BBA4B' : '3px solid transparent',
             marginBottom: '-2px'
           }}
         >
           Файли
         </button>
      </div>

      {status.message && (
        <div style={{ 
          padding: '15px', marginBottom: '20px', borderRadius: '8px',
          background: status.type === 'error' ? '#fdf0ed' : status.type === 'success' ? '#f0fdf0' : '#eef2ff',
          color: status.type === 'error' ? '#e74c3c' : status.type === 'success' ? '#5BBA4B' : '#4f46e5',
          border: `1px solid ${status.type === 'error' ? '#fadbd8' : status.type === 'success' ? '#c3f1c3' : '#c7d2fe'}`
        }}>
          {status.message}
        </div>
      )}

      {/* URL Tab */}
      {activeTab === 'url' && (
        <div style={{ background: '#fff', padding: '30px', borderRadius: '12px', border: '1px solid #eaeaea' }}>
          <h3 style={{ marginTop: 0 }}>Навчання по посиланню</h3>
          <p style={{ color: '#666', fontSize: '14px', marginBottom: '20px' }}>Вкажіть посилання на сторінку сайту (наприклад, прайс або опис процедури). Система завантажить контент і вивчить його.</p>
          <form onSubmit={handleUrlSubmit} style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            <input 
              type="url" 
              placeholder="https://salutem.clinic/..." 
              value={url}
              onChange={e => setUrl(e.target.value)}
              required
              style={{ flex: 1, padding: '12px 16px', borderRadius: '8px', border: '1px solid #ddd', outline: 'none', fontSize: '15px' }}
            />
            <button type="submit" disabled={status.loading} style={{ padding: '12px 24px', background: '#5BBA4B', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
              {status.loading ? 'Обробка...' : 'Зберегти URL'}
            </button>
          </form>
        </div>
      )}

      {/* Text Tab */}
      {activeTab === 'text' && (
        <div style={{ background: '#fff', padding: '30px', borderRadius: '12px', border: '1px solid #eaeaea' }}>
          <h3 style={{ marginTop: 0 }}>Навчання через текст</h3>
          <p style={{ color: '#666', fontSize: '14px', marginBottom: '20px' }}>Вставте скопійований текст (наприклад, скрипти адміністраторів або часті питання).</p>
          <form onSubmit={handleTextSubmit}>
            <textarea 
              placeholder="Вставте текст тут..." 
              value={text}
              onChange={e => setText(e.target.value)}
              required
              rows={10}
              style={{ width: '100%', padding: '16px', borderRadius: '8px', border: '1px solid #ddd', outline: 'none', fontSize: '15px', resize: 'vertical', marginBottom: '15px' }}
            />
            <button type="submit" disabled={status.loading} style={{ padding: '12px 24px', background: '#5BBA4B', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
              {status.loading ? 'Збереження...' : 'Завантажити текст'}
            </button>
          </form>
        </div>
      )}

      {/* File Tab */}
      {activeTab === 'file' && (
        <div style={{ background: '#fff', padding: '30px', borderRadius: '12px', border: '1px solid #eaeaea' }}>
          <h3 style={{ marginTop: 0 }}>Навчання файлами</h3>
          <p style={{ color: '#666', fontSize: '14px', marginBottom: '20px' }}>Завантажте PDF або DOCX файли (прайси, інструкції з підготовки). Дані будуть прочитані та додані до пам'яті.</p>
          <form onSubmit={handleFileSubmit}>
            <div style={{ border: '2px dashed #ccc', padding: '40px', borderRadius: '12px', textAlign: 'center', marginBottom: '15px', background: '#fafafa' }}>
              <input 
                type="file" 
                accept=".pdf,.txt,.doc,.docx"
                onChange={e => e.target.files && setFile(e.target.files[0])}
                required
                style={{ cursor: 'pointer' }}
              />
            </div>
            <button type="submit" disabled={status.loading || !file} style={{ padding: '12px 24px', background: '#5BBA4B', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
              {status.loading ? 'Читання файлу...' : 'Завантажити файл'}
            </button>
          </form>
        </div>
      )}
      
      <div style={{ marginTop: '40px' }}>
         <h2 style={{ fontSize: '18px' }}>Завантажені дані (огляд бази знань)</h2>
         <p style={{ color: '#777', fontSize: '14px' }}>Усі дані зберігаються у файлі <code>data/kb.json</code>, тому при оновленні коду бота база знань не видалиться.</p>
         {/* Could list actual items here querying KB api or server action */}
      </div>
    </div>
  );
}
