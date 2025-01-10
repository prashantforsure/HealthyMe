import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import axios from 'axios'
import prisma from '@/lib/prisma'
import { authOptions } from '@/lib/auth/auth'
import { z } from 'zod'

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

const FoodItemSchema = z.object({
    fdcId: z.union([z.string(), z.number()]).transform(val => String(val)),
    description: z.string(),
    dataType: z.string().optional(),
    brandOwner: z.string().optional(),
    gtinUpc: z.string().optional(),
    ingredients: z.string().optional(),
    servingSize: z.number().optional(),
    servingSizeUnit: z.string().optional(),
    nutritionData:z.any().optional()
  })
  
  export async function POST(req: Request) {
    const session = await getServerSession(authOptions)
  
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  
    try {
      const body = await req.json()
      
      const validatedFood = FoodItemSchema.parse(body)
  
      const existingFood = await prisma.uSDAFoodItem.findUnique({
        where: { fdcId: validatedFood.fdcId }
      })
  
      if (existingFood) {
        return NextResponse.json({ 
          error: 'Food item with this FDC ID already exists', 
          existingFood 
        }, { status: 409 })
      }
  
      // Create the new food item
      const newFood = await prisma.uSDAFoodItem.create({
        data: {
            fdcId: String(validatedFood.fdcId),
          description: validatedFood.description,
          dataType: validatedFood.dataType,
          brandOwner: validatedFood.brandOwner,
          gtinUpc: validatedFood.gtinUpc,
          ingredients: validatedFood.ingredients,
          servingSize: validatedFood.servingSize,
          servingSizeUnit: validatedFood.servingSizeUnit,
          nutritionData: validatedFood.nutritionData || null
        }
      })
  
      return NextResponse.json(newFood, { status: 201 })
    } catch (error) {
      console.error('Error adding food to database:', error)
      
      if (error instanceof z.ZodError) {
        return NextResponse.json({ 
          error: 'Validation failed', 
          details: error.errors 
        }, { status: 400 })
      }
  
      return NextResponse.json({ 
        error: 'Failed to add food to database', 
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 })
    }
  }