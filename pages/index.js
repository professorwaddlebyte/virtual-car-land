import { useState } from 'react'
import FilterPanel, { FilterProvider } from '../src/components/FilterPanel'
import QuizWizard from '../src/components/QuizWizard'
import MatchDashboard from '../src/views/MatchDashboard'

export default function Home() {
  const [activeView, setActiveView] = useState('dashboard') // 'dashboard', 'quiz', 'filters'
  const [quizAnswers, setQuizAnswers] = useState(null)
  const [filters, setFilters] = useState(null)

  const handleQuizComplete = (answers) => {
    console.log('Quiz completed with answers:', answers)
    setQuizAnswers(answers)
    setActiveView('dashboard')
    // In production, this would trigger API call to /api/v1/match/quiz
  }

  const handleFilterChange = (filterData) => {
    console.log('Filters changed:', filterData)
    setFilters(filterData)
    setActiveView('dashboard')
    // In production, this would trigger API call to /api/v1/match/filters
  }

  const handleViewChange = (view) => {
    setActiveView(view)
  }

  return (
    <FilterProvider onFilterChange={handleFilterChange}>
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        {/* Navigation */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-[#0055A4] to-[#FFD700] bg-clip-text text-transparent">
                    UAE Car Marketplace
                  </h1>
                </div>
                <div className="hidden md:block ml-10">
                  <div className="flex items-baseline space-x-4">
                    <button
                      onClick={() => handleViewChange('dashboard')}
                      className={`px-3 py-2 rounded-md text-sm font-medium ${activeView === 'dashboard' ? 'bg-[#0055A4] text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                    >
                      Dashboard
                    </button>
                    <button
                      onClick={() => handleViewChange('quiz')}
                      className={`px-3 py-2 rounded-md text-sm font-medium ${activeView === 'quiz' ? 'bg-[#0055A4] text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                    >
                      AI Quiz
                    </button>
                    <button
                      onClick={() => handleViewChange('filters')}
                      className={`px-3 py-2 rounded-md text-sm font-medium ${activeView === 'filters' ? 'bg-[#0055A4] text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                    >
                      Advanced Filters
                    </button>
                  </div>
                </div>
              </div>
              <div className="hidden md:block">
                <div className="ml-4 flex items-center md:ml-6">
                  <button className="bg-gradient-to-r from-[#0055A4] to-[#FFD700] text-white px-4 py-2 rounded-lg font-semibold hover:opacity-90 transition-opacity">
                    Get Started
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {/* View Selector */}
          <div className="md:hidden mb-6">
            <div className="flex justify-center space-x-2">
              <button
                onClick={() => handleViewChange('dashboard')}
                className={`px-4 py-2 text-sm font-medium rounded-lg ${activeView === 'dashboard' ? 'bg-[#0055A4] text-white' : 'bg-gray-200 text-gray-700'}`}
              >
                Dashboard
              </button>
              <button
                onClick={() => handleViewChange('quiz')}
                className={`px-4 py-2 text-sm font-medium rounded-lg ${activeView === 'quiz' ? 'bg-[#0055A4] text-white' : 'bg-gray-200 text-gray-700'}`}
              >
                AI Quiz
              </button>
              <button
                onClick={() => handleViewChange('filters')}
                className={`px-4 py-2 text-sm font-medium rounded-lg ${activeView === 'filters' ? 'bg-[#0055A4] text-white' : 'bg-gray-200 text-gray-700'}`}
              >
                Filters
              </button>
            </div>
          </div>

          {/* Content Area */}
          {activeView === 'dashboard' && (
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">AI-Powered Car Matching Dashboard</h2>
              <p className="text-gray-600 mb-6">
                Your personalized vehicle matches based on {quizAnswers ? 'quiz answers' : filters ? 'filter preferences' : 'popular choices'}
              </p>
              <MatchDashboard />
            </div>
          )}

          {activeView === 'quiz' && (
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">AI Matching Quiz</h2>
              <p className="text-gray-600 mb-6">
                Answer 7 questions to get personalized vehicle recommendations based on your preferences and cultural background.
              </p>
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <QuizWizard onComplete={handleQuizComplete} />
              </div>
            </div>
          )}

          {activeView === 'filters' && (
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Advanced Vehicle Filters</h2>
              <p className="text-gray-600 mb-6">
                Use our comprehensive filters to find the perfect vehicle matching your exact requirements.
              </p>
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <FilterPanel onFilterChange={handleFilterChange} />
              </div>
            </div>
          )}

          {/* Status Bar */}
          <div className="mt-8 bg-gradient-to-r from-[#0055A4]/5 to-[#FFD700]/5 rounded-xl p-4 border border-[#0055A4]/20">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                {activeView === 'dashboard' && 'Viewing AI-powered matches'}
                {activeView === 'quiz' && 'Completing AI matching quiz'}
                {activeView === 'filters' && 'Applying advanced filters'}
              </div>
              <div className="text-xs text-gray-500">
                Backend API: {quizAnswers || filters ? 'Ready' : 'Waiting for input'}
              </div>
            </div>
          </div>
        </main>

        <footer className="bg-white border-t border-gray-200 mt-12">
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <div className="text-center text-gray-600 text-sm">
              <p>© 2026 UAE Car Marketplace. All rights reserved.</p>
              <p className="mt-1">The first escrow-protected, Sharia-compliant car marketplace with AI-powered matching</p>
            </div>
          </div>
        </footer>
      </div>
    </FilterProvider>
  )
}