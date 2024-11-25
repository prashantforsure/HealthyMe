import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import prisma from '@/lib/prisma'
import { authOptions } from '@/lib/auth/auth'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)

  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { type, description } = await req.json()

    const newActivity = await prisma.progressRecord.create({
      data: {
        userId: session.user.id,
        date: new Date(),
        notes: `${type}: ${description}`,
     
      },
    })

    return NextResponse.json({ message: 'Activity added successfully', activity: newActivity })
  } catch (error) {
    console.error('Error adding activity:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}