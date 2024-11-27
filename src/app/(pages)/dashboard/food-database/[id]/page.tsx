'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { motion } from 'framer-motion'
import { ChevronLeft, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface Nutrient {
  id: string
  number: string
  name: string
  amount: number
  unitName: string
}

interface FoodDetails {
  fdcId: string
  description: string
  dataType: string
  publicationDate: string
  brandOwner?: string
  gtinUpc?: string
  ingredients?: string
  servingSize?: number
  servingSizeUnit?: string
  nutrients: Nutrient[]
}

export  default async function FoodDetailsPage({
    params,
  }: {
    params: Promise<{ id: string }>
  }) {
  const [food, setFood] = useState<FoodDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const id = (await params).id
  useEffect(() => {
    const fetchFoodDetails = async () => {
      try {
        const response = await axios.get(`/api/usda/foods/${id}`)
        setFood(response.data)
        setError(null)
      } catch (err) {
        setError('Failed to fetch food details')
        setFood(null)
      } finally {
        setLoading(false)
      }
    }

    fetchFoodDetails()
  }, [id])

  const handleGoBack = () => {
    router.push('/dashboard/food-database')
  }

  if (loading) return <FoodDetailsSkeleton />

  if (error) {
    return (
      <div className="min-h-screen bg-[#F8F9F9] p-8">
        <Button onClick={handleGoBack} className="mb-8">
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back to Food Database
        </Button>
        <Card className="w-full max-w-3xl mx-auto">
          <CardContent className="flex items-center justify-center p-8">
            <AlertCircle className="w-8 h-8 text-red-500 mr-4" />
            <p className="text-lg text-red-500">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!food) return null

  return (
    <div className="min-h-screen bg-[#F8F9F9] p-8">
      <Button onClick={handleGoBack} className="mb-8">
        <ChevronLeft className="w-4 h-4 mr-2" />
        Back to Food Database
      </Button>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="w-full max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl text-[#03363D]">{food.description}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-2 text-[#078080]">General Information</h3>
                <p><strong>FDC ID:</strong> {food.fdcId}</p>
                <p><strong>Data Type:</strong> {food.dataType}</p>
                <p><strong>Publication Date:</strong> {new Date(food.publicationDate).toLocaleDateString()}</p>
                {food.brandOwner && <p><strong>Brand:</strong> {food.brandOwner}</p>}
                {food.gtinUpc && <p><strong>GTIN/UPC:</strong> {food.gtinUpc}</p>}
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2 text-[#078080]">Serving Information</h3>
                {food.servingSize && food.servingSizeUnit && (
                  <p><strong>Serving Size:</strong> {food.servingSize} {food.servingSizeUnit}</p>
                )}
                {food.ingredients && (
                  <>
                    <p className="font-semibold mt-4">Ingredients:</p>
                    <p className="text-sm">{food.ingredients}</p>
                  </>
                )}
              </div>
            </div>
            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-4 text-[#078080]">Nutrient Information</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nutrient</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Unit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {food.nutrients.map((nutrient) => (
                    <TableRow key={nutrient.id}>
                      <TableCell>{nutrient.name}</TableCell>
                      <TableCell>{nutrient.amount.toFixed(2)}</TableCell>
                      <TableCell>{nutrient.unitName}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

function FoodDetailsSkeleton() {
  return (
    <div className="min-h-screen bg-[#F8F9F9] p-8">
      <Skeleton className="h-10 w-40 mb-8" />
      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader>
          <Skeleton className="h-8 w-3/4" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Skeleton className="h-6 w-1/2 mb-4" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-full mb-2" />
            </div>
            <div>
              <Skeleton className="h-6 w-1/2 mb-4" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-full mb-2" />
            </div>
          </div>
          <div className="mt-8">
            <Skeleton className="h-6 w-1/3 mb-4" />
            <Skeleton className="h-40 w-full" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}