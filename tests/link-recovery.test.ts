import { afterEach, describe, expect, it, vi } from 'vitest';
import { readLinkKey, rememberLinkKey, parseSharedLink } from '../lib/client/link-key';
const key='a'.repeat(64);
afterEach(()=>{vi.unstubAllGlobals();rememberLinkKey(null);});
describe('shared link recovery',()=>{
 it('keeps access when storage is blocked and a page anchor replaces the fragment',()=>{
  const location={hash:`#key=${key}`};
  vi.stubGlobal('window',{location});
  vi.stubGlobal('localStorage',{getItem(){throw Error('blocked');},setItem(){throw Error('blocked');},removeItem(){}});
  expect(readLinkKey()).toBe(key);
  location.hash='#main-content';
  expect(readLinkKey()).toBe(key);
 });
 it('restores a complete link only for this medical folder',()=>{
  expect(parseSharedLink(`https://clinic.test/#key=${key}`,'https://clinic.test')).toBe(key);
  expect(parseSharedLink(`https://other.test/#key=${key}`,'https://clinic.test')).toBe(null);
  expect(parseSharedLink('https://clinic.test/','https://clinic.test')).toBe(null);
 });
});
