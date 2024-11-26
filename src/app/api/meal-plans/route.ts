import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import prisma from '@/lib/prisma'
import { authOptions } from '@/lib/auth/auth'

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')

  if (!startDate || !endDate) {
    return NextResponse.json({ error: 'Start date and end date are required' }, { status: 400 })
  }

  try {
    const mealPlans = await prisma.mealPlan.findMany({
      where: {
        userId: session.user.id,
        startDate: {
          gte: new Date(startDate),
        },
        endDate: {
          lte: new Date(endDate),
        },
      },
      include: {
        meals: {
          include: {
            recipe: true,
          },
        },
      },
    })

    const formattedMealPlans = mealPlans.map(mealPlan => ({
      id: mealPlan.id,
      startDate: mealPlan.startDate.toISOString(),
      endDate: mealPlan.endDate.toISOString(),
      meals: mealPlan.meals.map(meal => ({
        id: meal.id,
        recipeId: meal.recipeId,
        recipeName: meal.recipe.name,
        type: meal.type,
        date: meal.date.toISOString(),
      })),
    }))

    return NextResponse.json(formattedMealPlans)
  } catch (error) {
    console.error('Error fetching meal plans:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

