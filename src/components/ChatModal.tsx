"use client";

import React, { useState, useRef, useEffect } from 'react';
import styles from './ChatModal.module.css';
import { Send, Phone } from 'lucide-react';

export default function ChatModal() {
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([
    { role: 'assistant', content: 'Вас турбує гострий дискомфорт зараз, чи ви плануєте плановий огляд і консультацію гастроентеролога?' }
  ]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showCTA, setShowCTA] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '+380' });
  const [formSubmitted, setFormSubmitted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isThinking, showForm, formSubmitted]);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMessage = { role: 'user' as const, content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsThinking(true);
    setShowForm(false);
    setShowCTA(false);
    setFormSubmitted(false);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, userMessage] })
      });
      
      const data = await response.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
      
      if (data.showCTA) {
        setShowCTA(true);
      }
      if (data.metadata) {
        setFormData(prev => ({ ...prev, ...data.metadata }));
      }
    } catch (error) {
      console.error("Error communicating with AI:", error);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Вибачте, сталася помилка з\'єднання. Спробуйте ще раз.' }]);
    } finally {
      setIsThinking(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitted(true);
    setShowForm(false);
    
    try {
      await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, chatLog: messages })
      });
    } catch(err) {
      console.error(err);
    }
  };

  // Improved parser for invisible table (price list)
  const renderMessageContent = (content: string) => {
    const safeContent = content || "";
    const lines = safeContent.split('\n');
    let inTable = false;
    
    const rendered = lines.map((line, idx) => {
      if (line.includes('|')) {
        const parts = line.split('|').filter(p => p.trim() !== '');
        if (parts.length >= 2 && !line.includes('---')) {
           return (
             <div key={idx} className={styles.priceRow}>
               <div className={styles.serviceName}>{parts[0].trim()}</div>
               <div className={styles.servicePrice}>{parts[1].trim()}</div>
             </div>
           );
        }
        return null; // skip headers/separators
      }
      return <p key={idx}>{line}</p>;
    });

    return <div className={styles.textContent}>{rendered}</div>;
  };

  return (
    <div className={styles.modalContainer}>
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <div className={styles.onlineIndicator}></div>
          <div>
            <h3>Координатор Салютем</h3>
            <p>Медичний центр</p>
          </div>
        </div>
      </div>
      
      <div className={styles.messagesContainer} ref={containerRef}>
        {messages.map((msg, idx) => (
           <React.Fragment key={idx}>
            <div className={`${styles.messageWrapper} ${msg.role === 'user' ? styles.userWrapper : styles.assistantWrapper}`}>
              <div className={`${styles.messageBubble} ${msg.role === 'user' ? styles.userMessage : styles.assistantMessage}`}>
                {renderMessageContent(msg.content)}
              </div>
            </div>
            {msg.role === 'assistant' && idx === messages.length - 1 && !isThinking && showCTA && (
              <div className={`${styles.messageWrapper} ${styles.assistantWrapper} ${styles.ctaWrapper}`}>
                <div className={styles.ctaContainer}>
                   <p className={styles.ctaText}>Запишіться зараз або зателефонуйте нам:</p>
                   <div className={styles.ctaActions}>
                     <a href="tel:0800338008" className={styles.phoneLink}>
                       <Phone size={16} /> 0 800 338 008
                     </a>
                     <button className={styles.leadButton} onClick={() => { setShowForm(true); setFormSubmitted(false); scrollToBottom(); }}>
                       Залишити заявку
                     </button>
                   </div>
                </div>
              </div>
            )}
          </React.Fragment>
        ))}

        {isThinking && (
          <div className={`${styles.messageWrapper} ${styles.assistantWrapper}`}>
            <div className={`${styles.messageBubble} ${styles.assistantMessage} ${styles.thinkingBubble}`}>
              <div className={styles.dotPulse}></div>
              <div className={styles.dotPulse}></div>
              <div className={styles.dotPulse}></div>
            </div>
          </div>
        )}

        {showForm && (
          <div className={`${styles.messageWrapper} ${styles.assistantWrapper}`}>
            <div className={styles.formContainer}>
               <h4>Залишити заявку</h4>
               <form onSubmit={handleFormSubmit}>
                 <div className={styles.inputGroup}>
                   <input 
                     type="text" 
                     placeholder="Ваше ім'я" 
                     value={formData.name}
                     onChange={e => setFormData({...formData, name: e.target.value})}
                     required
                     className={styles.inputField}
                   />
                 </div>
                 <div className={styles.inputGroup}>
                   <input 
                     type="tel" 
                     placeholder="+380" 
                     value={formData.phone}
                     onChange={e => setFormData({...formData, phone: e.target.value})}
                     required
                     className={styles.inputField}
                     pattern="^\+380[0-9]{9}$"
                     title="Формат: +380XXXXXXXXX"
                   />
                 </div>
                 <button type="submit" className={styles.submitButton}>Надіслати</button>
               </form>
            </div>
          </div>
        )}

        {formSubmitted && (
          <div className={`${styles.messageWrapper} ${styles.assistantWrapper}`}>
            <div className={`${styles.messageBubble} ${styles.assistantMessage}`}>
               Дякую! Вашу заявку надіслано, адміністратор зв'яжеться з вами найближчим часом.
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className={styles.inputArea}>
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Напишіть відповідь..."
          className={styles.textInput}
        />
        <button onClick={handleSend} className={styles.sendButton} disabled={!input.trim()}>
          <Send size={20} />
        </button>
      </div>
    </div>
  );
}
