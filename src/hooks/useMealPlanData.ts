import { useState, useEffect } from 'react'
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

  useEffect(() => {
    const fetchMealPlans = async () => {
      try {
        const response = await axios.get('/api/meal-plans', {
          params: {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
          },
        })
        setMealPlans(response.data)
      } catch (err) {
        setError('Failed to fetch meal plans')
      } finally {
        setLoading(false)
      }
    }

    fetchMealPlans()
  }, [startDate, endDate])

  return { mealPlans, loading, error }
}
