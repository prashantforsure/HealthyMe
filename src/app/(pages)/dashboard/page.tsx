'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useDashboardData } from '@/hooks/useDashboardData'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { Activity, Droplet, FlameIcon as Fire, Moon, Plus, Utensils } from 'lucide-react'
import axios from 'axios'

export default function DashboardPage() {
  const { data, loading, error } = useDashboardData()
  const [showQuickAdd, setShowQuickAdd] = useState(false)

  if (error) {
    return <div className="text-red-500">Error: {error}</div>
  }

  return (
    <div className="min-h-screen bg-[#F8F9F9] p-8">
      <h1 className="text-4xl font-bold text-[#03363D] mb-8">Dashboard</h1>

      {loading ? (
        <DashboardSkeleton />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Calories Consumed"
            value={data?.metrics.caloriesConsumed || 0}
            icon={<Utensils className="h-6 w-6 text-[#F79A3E]" />}
            color="bg-[#F79A3E]"
          />
          <MetricCard
            title="Calories Burned"
            value={data?.metrics.caloriesBurned || 0}
            icon={<Fire className="h-6 w-6 text-[#EE6B9E]" />}
            color="bg-[#EE6B9E]"
          />
          <MetricCard
            title="Water Intake"
            value={data?.metrics.waterIntake || 0}
            unit="ml"
            icon={<Droplet className="h-6 w-6 text-[#078080]" />}
            color="bg-[#078080]"
          />
          <MetricCard
            title="Sleep"
            value={data?.metrics.sleepHours || 0}
            unit="hours"
            icon={<Moon className="h-6 w-6 text-[#9C3EF8]" />}
            color="bg-[#9C3EF8]"
          />
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-[#03363D]">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <ActivitySkeleton />
            ) : (
              <ul className="space-y-4">
                {data?.recentActivity.map((activity) => (
                  <ActivityItem key={activity.id} activity={activity} />
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-[#03363D]">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button
                onClick={() => setShowQuickAdd(!showQuickAdd)}
                className="w-full bg-[#03363D] hover:bg-[#078080] text-white"
              >
                <Plus className="mr-2 h-4 w-4" /> Quick Add
              </Button>
              {showQuickAdd && <QuickAddForm />}
              <Button className="w-full bg-white text-[#03363D] border border-[#03363D] hover:bg-gray-100">
                View Meal Plan
              </Button>
              <Button className="w-full bg-white text-[#03363D] border border-[#03363D] hover:bg-gray-100">
                Log Workout
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function MetricCard({ title, value, unit, icon, color }: { title: string; value: number; unit?: string; icon: React.ReactNode; color: string }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {value}
          {unit && <span className="ml-1 text-xl">{unit}</span>}
        </div>
        <Progress value={value} max={100} className={`mt-4 h-2 ${color}`} />
      </CardContent>
    </Card>
  )
}

function ActivityItem({ activity }: { activity: { type: string; description: string; timestamp: string } }) {
  return (
    <motion.li
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex items-center space-x-4 p-4 bg-white rounded-lg shadow"
    >
      <Activity className="h-6 w-6 text-[#078080]" />
      <div className="flex-1">
        <p className="text-sm font-medium text-[#03363D]">{activity.description}</p>
        <p className="text-xs text-gray-500">{new Date(activity.timestamp).toLocaleString()}</p>
      </div>
    </motion.li>
  )
}

function QuickAddForm() {
  const [formData, setFormData] = useState({
    type: '',
    description: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await axios.post('/api/activity', formData)
     
    } catch (error) {
      console.error('Failed to add activity', error)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <select
        value={formData.type}
        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
        className="w-full p-2 border border-gray-300 rounded"
      >
        <option value="">Select Type</option>
        <option value="meal">Meal</option>
        <option value="exercise">Exercise</option>
        <option value="water">Water</option>
      </select>
      <input
        type="text"
        value={formData.description}
        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        placeholder="Description"
        className="w-full p-2 border border-gray-300 rounded"
      />
      <Button type="submit" className="w-full bg-[#078080] hover:bg-[#03363D] text-white">
        Add
      </Button>
    </form>
  )
}

function DashboardSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[...Array(4)].map((_, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <Skeleton className="h-4 w-[100px]" />
            <Skeleton className="h-6 w-6 rounded-full" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-[60px] mb-4" />
            <Skeleton className="h-2 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function ActivitySkeleton() {
  return (
    <ul className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <li key={i} className="flex items-center space-x-4 p-4 bg-white rounded-lg shadow">
          <Skeleton className="h-6 w-6 rounded-full" />
          <div className="flex-1">
            <Skeleton className="h-4 w-3/4 mb-2" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </li>
      ))}
    </ul>
  )
}

