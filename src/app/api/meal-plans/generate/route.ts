import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import prisma from '@/lib/prisma'

import { addDays, differenceInDays } from 'date-fns'
import { authOptions } from '@/lib/auth/auth'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { startDate, endDate } = await req.json()

  if (!startDate || !endDate) {
    return NextResponse.json({ error: 'Start date and end date are required' }, { status: 400 })
  }

  try {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const daysDifference = differenceInDays(end, start) + 1

    const recipes = await prisma.recipe.findMany()
    
    if (recipes.length === 0) {
        return NextResponse.json(
          { error: 'No recipes found in database' }, 
          { status: 400 }
        )
      }
    const mealPlan = await prisma.mealPlan.create({
      data: {
        userId: session.user.id,
        startDate: start,
        endDate: end,
        meals: {
          create: Array.from({ length: daysDifference }).flatMap((_, index) => {
            const currentDate = addDays(start, index)
            return [
              {
                date: currentDate,
                type: 'breakfast',
                recipeId: recipes[Math.floor(Math.random() * recipes.length)].id,
              },
              {
                date: currentDate,
                type: 'lunch',
                recipeId: recipes[Math.floor(Math.random() * recipes.length)].id,
              },
              {
                date: currentDate,
                type: 'dinner',
                recipeId: recipes[Math.floor(Math.random() * recipes.length)].id,
              },
            ]
          }),
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

    return NextResponse.json(mealPlan)
  } catch (error) {
    console.error('Error generating meal plan:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

