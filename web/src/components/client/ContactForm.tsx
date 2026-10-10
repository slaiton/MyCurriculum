'use client';

import { useState, type FormEvent } from 'react';
import { WhatsAppIcon } from '../Icons';

/** Arma el mensaje y abre WhatsApp. No envía ni guarda datos en el servidor. */
export function ContactForm({ whatsapp }: { whatsapp: string }) {
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<{ name?: string; message?: string }>({});

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    if (!name.trim()) next.name = 'Escribe tu nombre.';
    if (!message.trim()) next.message = 'Cuéntame en qué te puedo ayudar.';
    setErrors(next);
    if (Object.keys(next).length) return;
    const text = `Hola Stiven, soy ${name.trim()}.\n\n${message.trim()}`;
    window.open(`https://wa.me/${whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <form className="form" onSubmit={submit} noValidate>
      <div className="field">
        <label htmlFor="cf-name">Nombre</label>
        <input id="cf-name" name="name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? 'cf-name-error' : undefined} />
        {errors.name && <p id="cf-name-error" className="field__error">{errors.name}</p>}
      </div>
      <div className="field">
        <label htmlFor="cf-message">Mensaje</label>
        <textarea id="cf-message" name="message" rows={5} value={message} onChange={(e) => setMessage(e.target.value)} aria-invalid={Boolean(errors.message)} aria-describedby={errors.message ? 'cf-message-error' : undefined} />
        {errors.message && <p id="cf-message-error" className="field__error">{errors.message}</p>}
      </div>
      <div>
        <button type="submit" className="btn btn--whatsapp">
          <WhatsAppIcon /> Enviar por WhatsApp
        </button>
      </div>
    </form>
  );
}
