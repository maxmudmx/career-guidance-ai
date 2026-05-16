import { Button } from './ui';

export default function BackButton({ onClick, label = 'Orqaga' }) {
  return (
    <Button variant="ghost" size="sm" onClick={onClick}>
      {label}
    </Button>
  );
}
