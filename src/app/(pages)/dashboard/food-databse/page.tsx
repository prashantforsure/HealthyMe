'use client'

import { useState, useEffect, useCallback } from 'react'
import { useInView } from 'react-intersection-observer'
import { motion } from 'framer-motion'
import { Search, Plus, Info } from 'lucide-react'
import axios from 'axios'
import { debounce } from 'lodash'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface Food {
  fdcId: string
  description: string
  dataType: string
  brandOwner?: string
}

interface Nutrient {
  id: string
  number: string
  name: string
  unitName: string
  amount: number
}

interface FoodDetails extends Food {
  ingredients?: string
  servingSize?: number
  servingSizeUnit?: string
  nutrients: Nutrient[]
}

export default function FoodDatabasePage() {
  const [foods, setFoods] = useState<Food[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [selectedFood, setSelectedFood] = useState<FoodDetails | null>(null)

  const { ref, inView } = useInView({
    threshold: 0,
  })

  const fetchFoods = useCallback(async (searchTerm: string, page: number) => {
    try {
      const response = await axios.get('/api/usda/foods', {
        params: { search: searchTerm, page, limit: 20 },
      })
      const newFoods = response.data.foods
      setFoods((prevFoods) => (page === 1 ? newFoods : [...prevFoods, ...newFoods]))
      setHasMore(newFoods.length === 20)
      setError(null)
    } catch (err) {
      setError('Failed to fetch foods')
    } finally {
      setLoading(false)
    }
  }, [])

  const debouncedFetchFoods = useCallback(
    debounce((searchTerm: string) => {
      setPage(1)
      fetchFoods(searchTerm, 1)
    }, 300),
    []
  )

  useEffect(() => {
    debouncedFetchFoods(searchTerm)
  }, [searchTerm, debouncedFetchFoods])

  useEffect(() => {
    if (inView && hasMore) {
      setPage((prevPage) => prevPage + 1)
      fetchFoods(searchTerm, page + 1)
    }
  }, [inView, hasMore, searchTerm, page, fetchFoods])

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }

  const fetchFoodDetails = async (fdcId: string) => {
    try {
      const response = await axios.get(`/api/usda/foods/${fdcId}`)
      setSelectedFood(response.data)
    } catch (err) {
      console.error('Failed to fetch food details:', err)
    }
  }

  const addFoodToDatabase = async (food: Food) => {
    try {
      await axios.post('/api/usda/foods', food)
      // You might want to update the UI to reflect that the food has been added
      console.log('Food added to database')
    } catch (err) {
      console.error('Failed to add food to database:', err)
    }
  }

  return (
    <div className="min-h-screen bg-[#F8F9F9] p-8">
      <h1 className="text-4xl font-bold text-[#03363D] mb-8">Food Database</h1>
      <div className="mb-8">
        <div className="relative">
          <Input
            type="text"
            placeholder="Search foods..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="pl-10 pr-4 py-2 w-full border rounded-md focus:outline-none focus:ring-2 focus:ring-[#078080]"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        </div>
      </div>
      {error && <div className="text-red-500 mb-4">{error}</div>}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {foods.map((food, index) => (
          <motion.div
            key={food.fdcId}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <FoodCard
              food={food}
              onViewDetails={() => fetchFoodDetails(food.fdcId)}
              onAddToDatabase={() => addFoodToDatabase(food)}
            />
          </motion.div>
        ))}
        {loading &&
          Array.from({ length: 6 }).map((_, index) => (
            <FoodCardSkeleton key={index} />
          ))}
      </div>
      {!loading && foods.length === 0 && (
        <div className="text-center text-gray-500 mt-8">No foods found</div>
      )}
      <div ref={ref} className="h-10" />
      {selectedFood && (
        <FoodDetailsDialog food={selectedFood} onClose={() => setSelectedFood(null)} />
      )}
    </div>
  )
}

function FoodCard({ food, onViewDetails, onAddToDatabase }: { food: Food; onViewDetails: () => void; onAddToDatabase: () => void }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl text-[#03363D]">{food.description}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600 mb-2">Type: {food.dataType}</p>
        {food.brandOwner && (
          <p className="text-sm text-gray-600">Brand: {food.brandOwner}</p>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onViewDetails}>
          <Info className="w-4 h-4 mr-2" />
          View Details
        </Button>
        <Button onClick={onAddToDatabase}>
          <Plus className="w-4 h-4 mr-2" />
          Add to Database
        </Button>
      </CardFooter>
    </Card>
  )
}

function FoodCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-3/4" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-4 w-1/2 mb-2" />
        <Skeleton className="h-4 w-2/3" />
      </CardContent>
      <CardFooter className="flex justify-between">
        <Skeleton className="h-10 w-28" />
        <Skeleton className="h-10 w-28" />
      </CardFooter>
    </Card>
  )
}

function FoodDetailsDialog({ food, onClose }: { food: FoodDetails; onClose: () => void }) {
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{food.description}</DialogTitle>
          <DialogDescription>
            {food.dataType} {food.brandOwner && `by ${food.brandOwner}`}
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4">
          <h3 className="text-lg font-semibold mb-2">Details</h3>
          <p><strong>FDC ID:</strong> {food.fdcId}</p>
          {food.ingredients && <p><strong>Ingredients:</strong> {food.ingredients}</p>}
          {food.servingSize && (
            <p><strong>Serving Size:</strong> {food.servingSize} {food.servingSizeUnit}</p>
          )}
        </div>
        <div className="mt-4">
          <h3 className="text-lg font-semibold mb-2">Nutrients</h3>
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
      </DialogContent>
    </Dialog>
  )
}

