
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import prisma from '@/lib/prisma'
import { authOptions } from '@/lib/auth/auth'


export async function POST(req: Request) {
  const session = await getServerSession(authOptions)

  if (!session || !session.user) {
    return NextResponse.json({ error: 'unauth' }, { status: 401 })
  }

  try {
    const {
      healthGoals,
      dietaryPreferences,
      allergies,
      medicalConditions,
      medications,
      activityLevel,
      exerciseFrequency,
      sleepHours,
    } = await req.json()

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        healthGoal: healthGoals.join(', '),
        dietaryPrefrences: dietaryPreferences.join(', '),
        allergies,
        medicalHistory: JSON.stringify({
          conditions: medicalConditions,
          medications: medications.split(',').map((med: string) => med.trim()),
        }),
        activityLevel,
        sleepPattern: sleepHours,
  
      },
    })

    return NextResponse.json({ message: 'Onboarding  successfull', user: updatedUser })
  } catch (error) {
    console.error('Error during onboarding:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}