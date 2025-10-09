
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { User } from '@/lib/helpers';

export async function GET() {
  const cookieStore = await cookies();
  const userCookie = cookieStore.get('easpataal_user');

  if (userCookie) {
    try {
      const user = JSON.parse(userCookie.value);
      return NextResponse.json(user);
    } catch (error) {
      return NextResponse.json({ error: 'Invalid user data in cookie' }, { status: 400 });
    }
  }

  return NextResponse.json(null);
}

export async function POST(request: Request) {
  const user: User = await request.json();
  const cookieStore = await cookies();

  cookieStore.set('easpataal_user', JSON.stringify(user), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7, // 1 week
    path: '/',
  });

  return NextResponse.json({ message: 'Logged in successfully' });
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete('easpataal_user');
  return NextResponse.json({ message: 'Logged out successfully' });
}
