import { useState, useEffect } from 'react'
import axios from 'axios'

interface DashboardData {
  metrics: {
    caloriesConsumed: number
    caloriesBurned: number
    waterIntake: number
    sleepHours: number
  }
  recentActivity: {
    id: string
    type: string
    description: string
    timestamp: string
  }[]
}

export const useDashboardData = () => {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get<DashboardData>('/api/dashboard')
        setData(response.data)
      } catch (err) {
        setError('Failed to fetch dashboard data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  return { data, loading, error }
}
