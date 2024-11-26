'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import axios from 'axios'
import { format } from 'date-fns'
import { motion } from 'framer-motion'
import { Calendar, Clock, ChevronLeft, Info } from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface Nutrient {
  name: string
  amount: number
  unit: string
}

interface Meal {
  id: string
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  recipeName: string
  recipeId: string
  date: string
  calories: number
  protein: number
  carbs: number
  fat: number
  nutrients: Nutrient[]
}

interface MealPlan {
  id: string
  startDate: string
  endDate: string
  meals: Meal[]
}

export default function MealPlanDetailPage() {
  const { id } = useParams()
  const [mealPlan, setMealPlan] = useState<MealPlan | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchMealPlan = async () => {
      try {
        const response = await axios.get(`/api/meal-plans/${id}`)
        setMealPlan(response.data)
        setError(null)
      } catch (err) {
        setError('Failed to fetch meal plan')
        setMealPlan(null)
      } finally {
        setLoading(false)
      }
    }

    fetchMealPlan()
  }, [id])

  if (loading) return <MealPlanSkeleton />
  if (error) return <div className="text-red-500">{error}</div>
  if (!mealPlan) return <div>No meal plan found</div>

  const groupedMeals = mealPlan.meals.reduce((acc, meal) => {
    const date = format(new Date(meal.date), 'yyyy-MM-dd')
    if (!acc[date]) acc[date] = []
    acc[date].push(meal)
    return acc
  }, {} as Record<string, Meal[]>)

  return (
    <div className="min-h-screen bg-[#F8F9F9] p-8">
      <Link href="/dashboard/meal-plans" className="flex items-center text-[#03363D] mb-6 hover:underline">
        <ChevronLeft className="w-5 h-5 mr-2" />
        Back to Meal Plans
      </Link>
      <h1 className="text-4xl font-bold text-[#03363D] mb-8">Meal Plan Details</h1>
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-2xl text-[#03363D] flex items-center">
            <Calendar className="w-6 h-6 mr-2 text-[#078080]" />
            {format(new Date(mealPlan.startDate), 'MMMM d, yyyy')} - {format(new Date(mealPlan.endDate), 'MMMM d, yyyy')}
          </CardTitle>
        </CardHeader>
      </Card>
      {Object.entries(groupedMeals).map(([date, meals]) => (
        <motion.div
          key={date}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-xl text-[#03363D]">{format(new Date(date), 'EEEE, MMMM d, yyyy')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {meals.map((meal) => (
                  <Card key={meal.id} className="bg-white">
                    <CardHeader>
                      <CardTitle className="text-lg text-[#078080] flex items-center justify-between">
                        <span className="capitalize">{meal.type}</span>
                        <Clock className="w-5 h-5" />
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <h3 className="text-xl font-semibold mb-4">{meal.recipeName}</h3>
                      <div className="space-y-4">
                        <NutrientBar label="Calories" value={meal.calories} max={800} unit="kcal" />
                        <NutrientBar label="Protein" value={meal.protein} max={50} unit="g" />
                        <NutrientBar label="Carbs" value={meal.carbs} max={100} unit="g" />
                        <NutrientBar label="Fat" value={meal.fat} max={40} unit="g" />
                      </div>
                      <div className="mt-6">
                        <h4 className="text-sm font-semibold mb-2">Detailed Nutrients</h4>
                        <div className="grid grid-cols-2 gap-2">
                          {meal.nutrients.map((nutrient) => (
                            <div key={nutrient.name} className="text-sm">
                              <span className="font-medium">{nutrient.name}:</span>{' '}
                              {nutrient.amount.toFixed(1)} {nutrient.unit}
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}

function NutrientBar({ label, value, max, unit }: { label: string; value: number; max: number; unit: string }) {
  const percentage = (value / max) * 100

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span>{label}</span>
        <span>
          {value.toFixed(1)} / {max} {unit}
        </span>
      </div>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="relative pt-1">
              <Progress value={percentage} className="h-2" />
              {percentage > 100 && (
                <div className="absolute right-0 top-0 -mt-1">
                  <Info className="w-4 h-4 text-[#F79A3E]" />
                </div>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{percentage > 100 ? 'Exceeds recommended amount' : `${percentage.toFixed(1)}% of daily recommended`}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  )
}

function MealPlanSkeleton() {
  return (
    <div className="min-h-screen bg-[#F8F9F9] p-8">
      <Skeleton className="w-40 h-6 mb-6" />
      <Skeleton className="w-64 h-10 mb-8" />
      <Card className="mb-8">
        <CardHeader>
          <Skeleton className="w-full h-8" />
        </CardHeader>
      </Card>
      {[...Array(7)].map((_, i) => (
        <Card key={i} className="mb-8">
          <CardHeader>
            <Skeleton className="w-full h-6" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, j) => (
                <Card key={j} className="bg-white">
                  <CardHeader>
                    <Skeleton className="w-full h-6" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="w-full h-6 mb-4" />
                    <div className="space-y-4">
                      {[...Array(4)].map((_, k) => (
                        <Skeleton key={k} className="w-full h-4" />
                      ))}
                    </div>
                    <Skeleton className="w-full h-20 mt-6" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
