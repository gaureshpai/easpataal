
import { NextResponse } from 'next/server';
import { hash } from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    await prisma.$connect();
    const { username,name, password, role } = await request.json();

    const hashedPassword = await hash(password, 10);

    const user = await prisma.user.create({
      data: {
        username,
        name,
        password: hashedPassword,
        role,
      },
    });

    return NextResponse.json({ user });
  } catch (error) {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
