import { englishWordlist } from './wordlist';

console.log('=== Wordlist Test ===');
console.log('Type:', typeof englishWordlist);
console.log('Is Array:', Array.isArray(englishWordlist));
console.log('Length:', englishWordlist.length);
console.log('First word:', englishWordlist[0]);
console.log('Last word:', englishWordlist[englishWordlist.length - 1]);
console.log('Expected:', 2048);
console.log('Match:', englishWordlist.length === 2048 ? '✅' : '❌');

if (englishWordlist.length !== 2048) {
  console.error(`❌ ERROR: Wordlist has ${englishWordlist.length} words, but BIP39 requires exactly 2048!`);
  console.log('Missing words:', 2048 - englishWordlist.length);
}

export { englishWordlist };
