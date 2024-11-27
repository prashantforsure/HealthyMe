import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import axios from 'axios'
import prisma from '@/lib/prisma'
import { authOptions } from '@/lib/auth/auth'

const USDA_API_KEY = process.env.USDA_API_KEY
const USDA_API_URL = 'https://api.nal.usda.gov/fdc/v1'

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
    // First, check if the food item exists in our database
    const localFood = await prisma.uSDAFoodItem.findUnique({
      where: { fdcId: id },
      include: { usdafoodnurtrients: { include: { nutrient: true } } }
    })

    if (localFood) {
      return NextResponse.json(transformLocalFood(localFood))
    }

    // If not in our database, fetch from USDA API
    const response = await axios.get(`${USDA_API_URL}/food/${id}`, {
      params: { api_key: USDA_API_KEY }
    })

    const food = response.data

    // Transform the data to match our schema
    const transformedFood = {
      fdcId: food.fdcId,
      description: food.description,
      dataType: food.dataType,
      publicationDate: food.publicationDate,
      brandOwner: food.brandOwner,
      gtinUpc: food.gtinUpc,
      ingredients: food.ingredients,
      servingSize: food.servingSize,
      servingSizeUnit: food.servingSizeUnit,
      nutrients: food.foodNutrients.map((nutrient: any) => ({
        id: nutrient.id,
        number: nutrient.nutrient.number,
        name: nutrient.nutrient.name,
        amount: nutrient.amount,
        unitName: nutrient.nutrient.unitName
      }))
    }

    return NextResponse.json(transformedFood)
  } catch (error: any) {
    console.error('Error fetching food details:', error.response?.data || error.message)
    return NextResponse.json({ error: 'Failed to fetch food details', details: error.response?.data || error.message }, { status: 500 })
  }
}

function transformLocalFood(localFood: any) {
  return {
    fdcId: localFood.fdcId,
    description: localFood.description,
    dataType: localFood.dataType,
    publicationDate: localFood.publicationDate.toISOString(),
    brandOwner: localFood.brandOwner,
    gtinUpc: localFood.gtinUpc,
    ingredients: localFood.ingredients,
    servingSize: localFood.servingSize,
    servingSizeUnit: localFood.servingSizeUnit,
    nutrients: localFood.usdafoodnurtrients.map((nutrient: any) => ({
      id: nutrient.id,
      number: nutrient.nutrient.number,
      name: nutrient.nutrient.name,
      amount: nutrient.amount,
      unitName: nutrient.nutrient.unitName
    }))
  }
}
