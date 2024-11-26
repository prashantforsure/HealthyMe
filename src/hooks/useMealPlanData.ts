import { useState, useEffect, useMemo } from 'react'
import axios from 'axios'

export interface Meal {
  id: string
  recipeId: string
  recipeName: string
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  date: string
}

export interface MealPlan {
  id: string
  startDate: string
  endDate: string
  meals: Meal[]
}

export const useMealPlanData = (startDate: Date, endDate: Date) => {
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const memoizedDates = useMemo(() => ({
    start: startDate.toISOString(),
    end: endDate.toISOString()
  }), [startDate, endDate])

  useEffect(() => {
    const fetchMealPlans = async () => {
      setLoading(true)
      try {
        const response = await axios.get('/api/meal-plans', {
          params: {
            startDate: memoizedDates.start,
            endDate: memoizedDates.end,
          },
        })
        setMealPlans(response.data)
        setError(null)
      } catch (err) {
        setError('Failed to fetch meal plans')
        setMealPlans([])
      } finally {
        setLoading(false)
      }
    }

    fetchMealPlans()
  }, [memoizedDates])

  return { mealPlans, loading, error }
}