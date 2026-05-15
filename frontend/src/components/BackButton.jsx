import { ArrowLeft } from 'lucide-react';
import { Button } from './ui';

export default function BackButton({ onClick, label = 'Orqaga' }) {
  return (
    <Button variant="ghost" size="sm" onClick={onClick}>
      <ArrowLeft className="w-4 h-4" />
      {label}
    </Button>
  );
}
