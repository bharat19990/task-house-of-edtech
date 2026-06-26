import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';
import { loginUserSchema } from '@/types/user';
import logger from '@/lib/logger';
import { authConfig } from './auth.config';

export const {
  handlers,
  auth,
  signIn,
  signOut,
} = NextAuth({
  ...authConfig,
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          const parsed = loginUserSchema.safeParse(credentials);
          if (!parsed.success) {
            return null;
          }

          await connectToDatabase();
          const user = await User.findOne({ email: parsed.data.email }).select('+passwordHash');

          if (!user) {
            logger.warn({ email: parsed.data.email }, 'Login attempt: user not found');
            return null;
          }

          const isValid = await bcrypt.compare(parsed.data.password, user.passwordHash);
          if (!isValid) {
            logger.warn({ email: parsed.data.email }, 'Login attempt: invalid password');
            return null;
          }

          logger.info({ userId: user._id.toString() }, 'User authenticated');
          return {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
          };
        } catch (error) {
          logger.error({ error }, 'Auth error during login');
          return null;
        }
      },
    }),
  ],
});
