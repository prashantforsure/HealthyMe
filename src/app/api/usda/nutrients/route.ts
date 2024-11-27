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

  try {
    // First, try to fetch nutrients from our database
    const localNutrients = await prisma.uSDANutrient.findMany()

    if (localNutrients.length > 0) {
      return NextResponse.json({ nutrients: localNutrients })
    }

    const response = await axios.get(`${USDA_API_URL}/nutrients`, {
      params: { api_key: USDA_API_KEY }
    })

    const nutrients = response.data.map((nutrient: any) => ({
      number: nutrient.number,
      name: nutrient.name,
      unitName: nutrient.unitName
    }))

  
    await prisma.uSDANutrient.createMany({
      data: nutrients,
      skipDuplicates: true
    })

    return NextResponse.json({ nutrients })
  } catch (error) {
    console.error('Error fetching nutrients:', error)
    return NextResponse.json({ error: 'Failed to fetch nutrients' }, { status: 500 })
  }
}

