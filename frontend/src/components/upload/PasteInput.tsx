import React, { useState } from 'react';
import { ClipboardPaste } from 'lucide-react';

interface PasteInputProps {
  onSubmit: (text: string) => void;
  placeholder?: string;
  label?: string;
  buttonLabel?: string;
}

export const PasteInput: React.FC<PasteInputProps> = ({
  onSubmit,
  placeholder = 'Paste your content here...',
  label = 'Paste Content',
  buttonLabel = 'Parse Content',
}) => {
  const [text, setText] = useState('');

  const handleSubmit = () => {
    if (text.trim()) {
      onSubmit(text.trim());
      setText('');
    }
  };

  return (
    <div className="input-group" style={{ gap: 'var(--space-md)' }}>
      <label className="input-label">{label}</label>
      <textarea
        className="input"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        style={{ minHeight: 160 }}
      />
      <button
        className="btn btn-primary"
        onClick={handleSubmit}
        disabled={!text.trim()}
        style={{ alignSelf: 'flex-start' }}
      >
        <ClipboardPaste size={16} />
        {buttonLabel}
      </button>
    </div>
  );
};
