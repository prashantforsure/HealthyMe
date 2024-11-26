import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import prisma from '@/lib/prisma'
import { authOptions } from '@/lib/auth/auth'
import { Prisma } from '@prisma/client'

export async function PUT(req: Request, {
    params,
  }: {
    params: Promise<{ id: string }>
  }) {

  const session = await getServerSession(authOptions)

  const id = (await params).id

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

 
  const updatedMealPlan = await req.json()

  try {
    const mealPlan = await prisma.mealPlan.update({
      where: { id },
      data: {
        meals: {
          updateMany: updatedMealPlan.meals.map((meal: any) => ({
            where: { id: meal.id },
            data: {
              type: meal.type,
              recipeId: meal.recipeId,
            },
          })),
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
    console.error('Error updating meal plan:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function DELETE(req: Request,  {
    params,
  }: {
    params: Promise<{ id: string }>
  }) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const id = (await params).id

  try {
    await prisma.mealPlan.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Meal plan deleted successfully' })
  } catch (error) {
    console.error('Error deleting meal plan:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

interface TransformedNutrient {
    name: string;
    amount: number;
    unit: string;
  }
  
  interface TransformedMeal {
    id: string;
    type: string;
    recipeName: string;
    recipeId: string;
    date: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    nutrients: TransformedNutrient[];
  }
  
  interface TransformedMealPlan {
    id: string;
    startDate: string;
    endDate: string;
    meals: TransformedMeal[];
  }
  
  export async function GET(req: Request, {
    params,
  }: {
    params: Promise<{ id: string }>
  }) {
    const session = await getServerSession(authOptions)
  
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  
    const id = (await params).id
  
    try {
      const mealPlan = await prisma.mealPlan.findUnique({
        where: { id },
        include: {
          meals: {
            include: {
              recipe: true,
            },
          },
        },
      })
  
      if (!mealPlan) {
        return NextResponse.json({ error: 'Meal plan not found' }, { status: 404 })
      }
  
     
      const transformedMealPlan: TransformedMealPlan = {
        id: mealPlan.id,
        startDate: mealPlan.startDate.toISOString(),
        endDate: mealPlan.endDate.toISOString(),
        meals: mealPlan.meals.map((meal): TransformedMeal => {
          const nutritionInfo = meal.recipe.nutritionInfo as Prisma.JsonObject;
          return {
            id: meal.id,
            type: meal.type,
            recipeName: meal.recipe.name,
            recipeId: meal.recipe.id,
            date: meal.date.toISOString(),
            calories: nutritionInfo.calories as number,
            protein: nutritionInfo.protein as number,
            carbs: nutritionInfo.carbs as number,
            fat: nutritionInfo.fat as number,
            nutrients: Object.entries(nutritionInfo)
              .filter(([key]) => !['calories', 'protein', 'carbs', 'fat'].includes(key))
              .map(([name, value]) => ({
                name,
                amount: value as number,
                unit: 'g', 
              })),
          };
        }),
      }
  
      return NextResponse.json(transformedMealPlan)
    } catch (error) {
      console.error('Error fetching meal plan:', error)
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
  }
  