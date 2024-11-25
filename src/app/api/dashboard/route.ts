import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import prisma from '@/lib/prisma'
import { authOptions } from '@/lib/auth/auth'

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        progressRecords: {
          orderBy: { date: 'desc' },
          take: 1,
        },
        mealPlans: {
          include: {
            meals: {
              include: {
                recipe: true, 
              },
            },
          },
          orderBy: { startDate: 'desc' },
          take: 1,
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const latestProgress = user.progressRecords[0] || null
    const latestMealPlan = user.mealPlans[0] || null

    const caloriesConsumed = latestMealPlan?.meals?.reduce((sum, meal) => 
      sum + ((meal.recipe?.nutritionInfo as { calories: number })?.calories || 0), 0) || 0

    const recentActivity = await prisma.progressRecord.findMany({
      where: { userId: user.id },
      orderBy: { date: 'desc' },
      take: 5,
      select: {
        id: true,
        date: true,
        weight: true,
        calories: true,
      },
    })

    const dashboardData = {
      metrics: {
        caloriesConsumed,
        caloriesBurned: latestProgress?.calories ?? 0,
        waterIntake: 2000,
        sleepHours: 8,
      },
      recentActivity: recentActivity.map(activity => ({
        id: activity.id,
        type: 'progress',
        description: `Logged weight: ${activity.weight ?? 'N/A'}kg, Calories burned: ${activity.calories ?? 'N/A'}`,
        timestamp: activity.date.toISOString(),
      })),
    }

    return NextResponse.json(dashboardData)
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
