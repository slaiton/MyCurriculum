'use client';

import { useState } from 'react';
import { CopyIcon } from '../Icons';

export function CopyButton({ text, label = 'Copiar' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <button type="button" className="copy-btn" onClick={copy}>
      <CopyIcon size={15} />
      <span aria-live="polite">{copied ? 'Copiado' : label}</span>
    </button>
  );
}
