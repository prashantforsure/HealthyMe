import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import axios from 'axios'
import prisma from '@/lib/prisma'
import { authOptions } from '@/lib/auth/auth'

const USDA_API_KEY = process.env.USDA_API_KEY
const USDA_API_URL = 'https://api.nal.usda.gov/fdc/v1'

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = params

  try {

    const localFood = await prisma.uSDAFoodItem.findUnique({
      where: { fdcId: id },
      include: { usdafoodnurtrients: { include: { nutrient: true } } }
    })

    if (localFood) {
      return NextResponse.json(localFood)
    }

    // If not in our database, fetch from USDA API
    const response = await axios.get(`${USDA_API_URL}/food/${id}`, {
      params: { api_key: USDA_API_KEY }
    })

    const food = response.data

    const transformedFood = {
      fdcId: food.fdcId,
      description: food.description,
      dataType: food.dataType,
      publicationDate: new Date(food.publicationDate),
      brandOwner: food.brandOwner,
      gtinUpc: food.gtinUpc,
      ingredients: food.ingredients,
      servingSize: food.servingSize,
      servingSizeUnit: food.servingSizeUnit,
      nutritionData: {},
      usdafoodnurtrients: food.foodNutrients.map((nutrient: any) => ({
        amount: nutrient.amount,
        nutrient: {
          number: nutrient.nutrient.number,
          name: nutrient.nutrient.name,
          unitName: nutrient.nutrient.unitName
        }
      }))
    }

    return NextResponse.json(transformedFood)
  } catch (error) {
    console.error('Error fetching food details:', error)
    return NextResponse.json({ error: 'Failed to fetch food details' }, { status: 500 })
  }
}

