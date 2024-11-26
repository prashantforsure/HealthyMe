'use client'

import { useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks } from 'date-fns'
import { useMealPlanData, Meal, MealPlan } from '@/hooks/useMealPlanData'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ChevronLeft, ChevronRight, Plus, Edit2, Trash2 } from 'lucide-react'
import axios from 'axios'

export default function MealPlansPage() {
  const [currentWeek, setCurrentWeek] = useState(new Date())
  const startDate = useMemo(() => startOfWeek(currentWeek), [currentWeek])
  const endDate = useMemo(() => endOfWeek(currentWeek), [currentWeek])
  const { mealPlans, loading, error } = useMealPlanData(startDate, endDate)

  const [selectedMealPlan, setSelectedMealPlan] = useState<MealPlan | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)

  const handlePreviousWeek = () => setCurrentWeek(subWeeks(currentWeek, 1))
  const handleNextWeek = () => setCurrentWeek(addWeeks(currentWeek, 1))

  const handleGenerateMealPlan = async () => {
    setIsGenerating(true)
    try {
      const response = await axios.post('/api/meal-plans/generate', {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      })
      // Refresh meal plans data after generation
      // This could be optimized by updating the local state instead of refetching
      window.location.reload()
    } catch (error) {
      console.error('Failed to generate meal plan:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleEditMealPlan = (mealPlan: MealPlan) => {
    setSelectedMealPlan(mealPlan)
    setShowEditDialog(true)
  }

  const handleDeleteMealPlan = async (mealPlanId: string) => {
    if (window.confirm('Are you sure you want to delete this meal plan?')) {
      try {
        await axios.delete(`/api/meal-plans/${mealPlanId}`)
        // Refresh meal plans data after deletion
        window.location.reload()
      } catch (error) {
        console.error('Failed to delete meal plan:', error)
      }
    }
  }

  const renderMealPlan = useCallback((mealPlan: MealPlan) => {
    return (
      <Card key={mealPlan.id} className="mb-4">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold text-[#03363D]">
            {format(new Date(mealPlan.startDate), 'MMMM d')} - {format(new Date(mealPlan.endDate), 'MMMM d, yyyy')}
          </CardTitle>
          <div className="flex space-x-2">
            <Button variant="outline" size="icon" onClick={() => handleEditMealPlan(mealPlan)}>
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => handleDeleteMealPlan(mealPlan.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
            {mealPlan.meals.map((meal) => (
              <div key={meal.id} className="p-2 bg-[#F8F9F9] rounded-md">
                <p className="font-medium text-[#03363D]">{format(new Date(meal.date), 'EEEE')}</p>
                <p className="text-sm text-[#078080]">{meal.type}</p>
                <p className="text-sm">{meal.recipeName}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }, [])

  if (error) {
    return <div className="text-red-500">Error: {error}</div>
  }

  return (
    <div className="min-h-screen bg-[#F8F9F9] p-8">
      <h1 className="text-4xl font-bold text-[#03363D] mb-8">Meal Plans</h1>

      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <Button onClick={handlePreviousWeek} variant="outline" size="icon">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-lg font-medium">
            {format(startDate, 'MMMM d')} - {format(endDate, 'MMMM d, yyyy')}
          </span>
          <Button onClick={handleNextWeek} variant="outline" size="icon">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <Button onClick={handleGenerateMealPlan} disabled={isGenerating} className="bg-[#03363D] hover:bg-[#078080]">
          <Plus className="mr-2 h-4 w-4" /> Generate Meal Plan
        </Button>
      </div>

      {loading ? (
        <MealPlanSkeleton />
      ) : (
        <AnimatePresence>
          {mealPlans.map((mealPlan) => (
            <motion.div
              key={mealPlan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {renderMealPlan(mealPlan)}
            </motion.div>
          ))}
        </AnimatePresence>
      )}

      <EditMealPlanDialog
        mealPlan={selectedMealPlan}
        isOpen={showEditDialog}
        onClose={() => setShowEditDialog(false)}
      />
    </div>
  )
}

function MealPlanSkeleton() {
  return (
    <Card className="mb-4">
      <CardHeader>
        <Skeleton className="h-6 w-1/3" />
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="p-2 bg-[#F8F9F9] rounded-md">
              <Skeleton className="h-4 w-1/2 mb-2" />
              <Skeleton className="h-3 w-1/3 mb-1" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function EditMealPlanDialog({ mealPlan, isOpen, onClose }: { mealPlan: MealPlan | null; isOpen: boolean; onClose: () => void }) {
  const [editedMealPlan, setEditedMealPlan] = useState<MealPlan | null>(mealPlan)

  const handleSave = async () => {
    if (!editedMealPlan) return

    try {
      await axios.put(`/api/meal-plans/${editedMealPlan.id}`, editedMealPlan)
      onClose()
      window.location.reload()
    } catch (error) {
      console.error('Failed to update meal plan:', error)
    }
  }

  const handleMealChange = (mealId: string, field: keyof Meal, value: string) => {
    if (!editedMealPlan) return

    setEditedMealPlan({
      ...editedMealPlan,
      meals: editedMealPlan.meals.map((meal) =>
        meal.id === mealId ? { ...meal, [field]: value } : meal
      ),
    })
  }

  if (!editedMealPlan) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Meal Plan</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {editedMealPlan.meals.map((meal) => (
            <div key={meal.id} className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor={`meal-${meal.id}-type`} className="text-right">
                {format(new Date(meal.date), 'EEE')}
              </Label>
              <Select
                value={meal.type}
                onValueChange={(value) => handleMealChange(meal.id, 'type', value)}
              >
                <SelectTrigger id={`meal-${meal.id}-type`}>
                  <SelectValue placeholder="Meal type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="breakfast">Breakfast</SelectItem>
                  <SelectItem value="lunch">Lunch</SelectItem>
                  <SelectItem value="dinner">Dinner</SelectItem>
                  <SelectItem value="snack">Snack</SelectItem>
                </SelectContent>
              </Select>
              <Input
                id={`meal-${meal.id}-recipe`}
                value={meal.recipeName}
                onChange={(e) => handleMealChange(meal.id, 'recipeName', e.target.value)}
                className="col-span-2"
              />
            </div>
          ))}
        </div>
        <div className="flex justify-end">
          <Button onClick={handleSave} className="bg-[#03363D] hover:bg-[#078080]">
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

