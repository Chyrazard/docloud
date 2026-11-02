import { test } from 'node:test';
import assert from 'node:assert/strict';
import { whatsappLink } from '../lib/support';
test('WhatsApp stays disabled without a real number and never accepts external URL injection', () => {
  for (const value of [
    undefined,
    '',
    ' ',
    'javascript:alert(1)',
    'https://example.com/1234567890',
    '00573001234567',
    '123',
    '+57 3001234567?text=evil',
  ])
    assert.equal(whatsappLink(value), null);
  const link = whatsappLink('+57 (300) 123-4567')!;
  const url = new URL(link);
  assert.equal(url.origin, 'https://wa.me');
  assert.equal(url.pathname, '/573001234567');
  assert.equal(url.searchParams.get('text'), 'Hola, me gustaría recibir ayuda con DOCLOUD 🐾');
});
