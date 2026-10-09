import { describe, it, expect } from 'vitest';
import { authorize } from '../lib/server/access';
import { resolveLinkKey, buildShareLink } from '../lib/client/link-key';
const key = 'a'.repeat(64);
const hash = 'ffe054fe7ae0cb6dc65c3af9b61d5209f439851db43d0ba5997337df154668eb';
describe('access to shared records', () => {
  it('rejectsMissingKey', async () => expect(await authorize(new Request('https://test/api'), hash)).toBe(false));
  it('rejectsWrongKey', async () => expect(await authorize(new Request('https://test/api', {headers:{Authorization:`Bearer ${'b'.repeat(64)}`}}), hash)).toBe(false));
  it('acceptsMatchingKey', async () => expect(await authorize(new Request('https://test/api', {headers:{Authorization:`Bearer ${key}`}}), hash)).toBe(true));
  it('accepts stored key for installed launch', () => expect(resolveLinkKey('',key)).toBe(key));
  it('ignores invalid fragment without overwriting access', () => expect(resolveLinkKey('#key=short',key)).toBe(key));
  it('puts shared credential only in fragment', () => { const url=new URL(buildShareLink('https://test',key)); expect(url.search).toBe(''); expect(url.hash).toBe(`#key=${key}`); });
});
