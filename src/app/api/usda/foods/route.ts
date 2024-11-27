import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import axios from 'axios'
import prisma from '@/lib/prisma'
import { authOptions } from '@/lib/auth/auth'

const USDA_API_KEY = process.env.USDA_API_KEY
const USDA_API_URL = 'https://api.nal.usda.gov/fdc/v1'

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search') || ''
  const page = parseInt(searchParams.get('page') || '1', 10)
  const limit = parseInt(searchParams.get('limit') || '20', 10)

  try {
    const response = await axios.get(`${USDA_API_URL}/foods/search`, {
      params: {
        api_key: USDA_API_KEY,
        query: search,
        pageSize: limit,
        pageNumber: page,
        dataType: ['Survey (FNDDS)', 'Foundation', 'SR Legacy'].map(type => encodeURIComponent(type)).join(',')
      },
      paramsSerializer: params => {
        return Object.entries(params)
          .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
          .join('&');
      }
    });

    const foods = response.data.foods.map((food: any) => ({
      fdcId: food.fdcId,
      description: food.description,
      dataType: food.dataType,
      brandOwner: food.brandOwner
    }))

    return NextResponse.json({
      foods,
      totalCount: response.data.totalHits,
      currentPage: page,
      totalPages: Math.ceil(response.data.totalHits / limit)
    })
  } catch (error: any) {
    console.error('Error fetching foods from USDA:', error.response?.data || error.message)
    return NextResponse.json({ error: 'Failed to fetch foods', details: error.response?.data || error.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const food = await req.json()

  try {
    const newFood = await prisma.uSDAFoodItem.create({
      data: {
        fdcId: food.fdcId,
        description: food.description,
        dataType: food.dataType,
        publicationDate: new Date(),
        brandOwner: food.brandOwner,
        gtinUpc: food.gtinUpc,
        ingredients: food.ingredients,
        servingSize: food.servingSize,
        servingSizeUnit: food.servingSizeUnit,
        nutritionData: food.nutritionData || {}
      }
    })

    return NextResponse.json(newFood)
  } catch (error: any) {
    console.error('Error adding food to database:', error)
    return NextResponse.json({ error: 'Failed to add food to database', details: error.message }, { status: 500 })
  }
}

