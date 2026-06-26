import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import jwt from 'jsonwebtoken';
import logger from '@/lib/logger';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const secret = process.env.JWT_SECRET ?? process.env.NEXTAUTH_SECRET ?? 'fallback-secret';

    const token = jwt.sign(
      {
        id: session.user.id,
        name: session.user.name,
      },
      secret,
      { expiresIn: '1h' }
    );

    return NextResponse.json({ token });
  } catch (error) {
    logger.error({ error }, 'Failed to generate WS token');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
