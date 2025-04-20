import { scrypt, randomBytes, timingSafeEqual } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

/**
 * Hash a password using scrypt with a random salt
 * @param password The plain text password to hash
 * @returns A string in the format hash.salt
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString('hex')}.${salt}`;
}

/**
 * Compare a plain text password against a hashed password
 * @param suppliedPassword The plain text password to check
 * @param storedPassword The hashed password to check against (in format hash.salt)
 * @returns True if the password matches, false otherwise
 */
export async function comparePasswords(suppliedPassword: string, storedPassword: string): Promise<boolean> {
  const [hashedPassword, salt] = storedPassword.split('.');
  const hashedBuf = Buffer.from(hashedPassword, 'hex');
  const suppliedBuf = (await scryptAsync(suppliedPassword, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

/**
 * Generate a secure random password
 * @param length Length of the password to generate (default: 12)
 * @returns A random password string
 */
export function generatePassword(length: number = 12): string {
  // Use characters that are readable and less likely to be confused
  const charset = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let password = '';
  
  // Generate random bytes and map them to our charset
  const randomBytesBuffer = randomBytes(length);
  for (let i = 0; i < length; i++) {
    const index = randomBytesBuffer[i] % charset.length;
    password += charset[index];
  }
  
  return password;
}