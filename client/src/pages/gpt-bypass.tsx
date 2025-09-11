import { useState, useEffect } from 'react';
import { GPTBypassInterface } from '@/components/gpt-bypass/GPTBypassInterface';

export default function GPTBypassPage() {
  const [inputFromMain, setInputFromMain] = useState<string>('');

  // Handle localStorage handoff on mount
  useEffect(() => {
    const handoffInput = localStorage.getItem('handoff:input');
    if (handoffInput) {
      setInputFromMain(handoffInput);
      localStorage.removeItem('handoff:input'); // Clear after reading
    }
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <GPTBypassInterface inputFromMain={inputFromMain} />
    </div>
  );
}