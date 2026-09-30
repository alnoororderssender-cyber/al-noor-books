// Usage: npm run hash-password -- "your password"
import bcrypt from 'bcryptjs';

const password = process.argv[2];
if (!password || password.length < 10) {
  console.error('Usage: npm run hash-password -- "<password of at least 10 characters>"');
  process.exit(1);
}
const hash = bcrypt.hashSync(password, 12);
console.log('\nPaste this into server/.env (keep the single quotes):\n');
console.log(`ADMIN_PASSWORD_HASH='${hash}'\n`);
