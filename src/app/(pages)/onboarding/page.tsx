'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const steps = ['Health Goals', 'Dietary Preferences', 'Medical History', 'Activity Level']

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState({
    healthGoals: [],
    dietaryPreferences: [],
    allergies: [],
    medicalConditions: [],
    medications: [],
    activityLevel: '',
    exerciseFrequency: '',
    sleepHours: '',
  })
  const router = useRouter()

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleSubmit()
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    if (type === 'checkbox') {
      const checkbox = e.target as HTMLInputElement
      setFormData(prev => ({
        ...prev,
        [name]: checkbox.checked
          ? [...prev[name as keyof typeof formData], value]
          : prev[name as keyof typeof formData].filter((item: string) => item !== value),
      }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleSubmit = async () => {
    try {
      const response = await fetch('/api/user/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (response.ok) {
        router.push('/dashboard')
      } else {
        console.error('Onboarding failed')
      }
    } catch (error) {
      console.error('Error during onboarding:', error)
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">Complete Your Profile</h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="mb-5">
            <div className="flex justify-between items-center w-full mb-4">
              {steps.map((step, index) => (
                <div key={step} className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      index <= currentStep ? 'bg-[#03363D] text-white' : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {index + 1}
                  </div>
                  <div className="text-xs mt-2">{step}</div>
                </div>
              ))}
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-[#078080] h-2.5 rounded-full transition-all duration-500 ease-in-out"
                style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              ></div>
            </div>
          </div>

          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {currentStep === 0 && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">What are your health goals?</h3>
                {['Weight Loss', 'Muscle Gain', 'Improve Energy', 'Better Sleep', 'Stress Reduction'].map(goal => (
                  <label key={goal} className="flex items-center space-x-3 mb-3">
                    <input
                      type="checkbox"
                      name="healthGoals"
                      value={goal}
                      onChange={handleChange}
                      className="form-checkbox h-5 w-5 text-[#078080]"
                    />
                    <span className="text-gray-700">{goal}</span>
                  </label>
                ))}
              </div>
            )}

            {currentStep === 1 && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">What are your dietary preferences?</h3>
                {['Vegetarian', 'Vegan', 'Pescatarian', 'Keto', 'Paleo', 'Gluten-Free', 'Dairy-Free'].map(pref => (
                  <label key={pref} className="flex items-center space-x-3 mb-3">
                    <input
                      type="checkbox"
                      name="dietaryPreferences"
                      value={pref}
                      onChange={handleChange}
                      className="form-checkbox h-5 w-5 text-[#078080]"
                    />
                    <span className="text-gray-700">{pref}</span>
                  </label>
                ))}
                <h3 className="text-lg font-medium text-gray-900 mt-6 mb-4">Do you have any allergies?</h3>
                {['Nuts', 'Shellfish', 'Eggs', 'Soy', 'Wheat'].map(allergy => (
                  <label key={allergy} className="flex items-center space-x-3 mb-3">
                    <input
                      type="checkbox"
                      name="allergies"
                      value={allergy}
                      onChange={handleChange}
                      className="form-checkbox h-5 w-5 text-[#078080]"
                    />
                    <span className="text-gray-700">{allergy}</span>
                  </label>
                ))}
              </div>
            )}

            {currentStep === 2 && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Do you have any medical conditions?</h3>
                {['Diabetes', 'Hypertension', 'Heart Disease', 'Thyroid Issues', 'Autoimmune Disorder'].map(condition => (
                  <label key={condition} className="flex items-center space-x-3 mb-3">
                    <input
                      type="checkbox"
                      name="medicalConditions"
                      value={condition}
                      onChange={handleChange}
                      className="form-checkbox h-5 w-5 text-[#078080]"
                    />
                    <span className="text-gray-700">{condition}</span>
                  </label>
                ))}
                <h3 className="text-lg font-medium text-gray-900 mt-6 mb-4">Are you taking any medications?</h3>
                <input
                  type="text"
                  name="medications"
                  onChange={handleChange}
                  placeholder="Enter medications (comma-separated)"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#078080] focus:border-[#078080] sm:text-sm"
                />
              </div>
            )}

            {currentStep === 3 && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">What's your activity level?</h3>
                <select
                  name="activityLevel"
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#078080] focus:border-[#078080] sm:text-sm"
                >
                  <option value="">Select activity level</option>
                  <option value="sedentary">Sedentary</option>
                  <option value="lightly_active">Lightly Active</option>
                  <option value="moderately_active">Moderately Active</option>
                  <option value="very_active">Very Active</option>
                  <option value="extra_active">Extra Active</option>
                </select>
                <h3 className="text-lg font-medium text-gray-900 mt-6 mb-4">How often do you exercise?</h3>
                <select
                  name="exerciseFrequency"
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#078080] focus:border-[#078080] sm:text-sm"
                >
                  <option value="">Select exercise frequency</option>
                  <option value="never">Never</option>
                  <option value="1-2_times_week">1-2 times a week</option>
                  <option value="3-4_times_week">3-4 times a week</option>
                  <option value="5+_times_week">5+ times a week</option>
                </select>
                <h3 className="text-lg font-medium text-gray-900 mt-6 mb-4">How many hours do you sleep per night?</h3>
                <input
                  type="number"
                  name="sleepHours"
                  onChange={handleChange}
                  min="1"
                  max="24"
                  placeholder="Enter hours of sleep"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#078080] focus:border-[#078080] sm:text-sm"
                />
              </div>
            )}
          </motion.div>

          <div className="mt-6 flex justify-between">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className={`flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md ${
                currentStep === 0
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-[#03363D] border-[#03363D] hover:bg-gray-50'
              }`}
            >
              <ChevronLeft className="h-5 w-5 mr-2" />
              Previous
            </button>
            <button
              onClick={handleNext}
              className="flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-[#03363D] hover:bg-[#078080]"
            >
              {currentStep === steps.length - 1 ? 'Finish' : 'Next'}
              <ChevronRight className="h-5 w-5 ml-2" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

