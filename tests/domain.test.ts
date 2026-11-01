import { test } from 'node:test';
import assert from 'node:assert/strict';
import { allocatePuppies, canRespond, defaultTerms, termsSchema } from '../lib/domain';
test('puppy rules cover every possible size and allocate safely', () => {
  const terms = termsSchema.parse({ ...defaultTerms, mode: 'puppies' });
  assert.deepEqual(allocatePuppies(terms, 1), { requester: 0, recipient: 1 });
  assert.deepEqual(allocatePuppies(terms, 3), { requester: 1, recipient: 2 });
  for (let n = 1; n <= 20; n++) {
    const v = allocatePuppies(terms, n);
    assert.equal(v.requester + v.recipient, n);
  }
  assert.throws(() => allocatePuppies(terms, 21));
});
test('reject gaps, overlaps, impossible assignments and missing conditions', () => {
  for (const rules of [
    [{ min: 2, max: 20, requester: 1 }],
    [
      { min: 1, max: 3, requester: 0 },
      { min: 3, max: 20, requester: 1 },
    ],
    [{ min: 1, max: 20, requester: 2 }],
  ])
    assert.equal(termsSchema.safeParse({ ...defaultTerms, mode: 'puppies', rules }).success, false);
  assert.equal(termsSchema.safeParse({ ...defaultTerms, cancellation: '' }).success, false);
  assert.equal(termsSchema.safeParse({ ...defaultTerms, amount: -1 }).success, false);
});
test('only counterpart may accept the latest pending revision', () => {
  const p = { requester_id: 'a', recipient_id: 'b', last_by: 'a', status: 'pending' };
  assert.equal(canRespond('b', p, 2, 2), true);
  assert.equal(canRespond('a', p, 2, 2), false);
  assert.equal(canRespond('c', p, 2, 2), false);
  assert.equal(canRespond('b', p, 1, 2), false);
  assert.equal(canRespond('b', { ...p, status: 'accepted' }, 2, 2), false);
});
