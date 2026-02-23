import React, { useState, useEffect } from 'react';
// import './QuizWizard.module.css';

const QuizWizard = () => {
  // Define the 7 questions from the spec
  const questions = [
    {
      id: 1,
      question: 'Primary Use Case',
      description: 'How do you plan to use this vehicle?',
      type: 'single',
      options: [
        { id: 'family', label: 'Family daily driver (7-seater)' },
        { id: 'luxury', label: 'Luxury statement car' },
        { id: 'commute', label: 'Fuel-efficient commute' },
        { id: 'offroad', label: 'Off-road desert driving' },
        { id: 'business', label: 'Business/Corporate' }
      ]
    },
    {
      id: 2,
      question: 'Which features matter most?',
      description: 'Select up to 3 features that are most important to you',
      type: 'multi',
      maxSelections: 3,
      options: [
        { id: 'safety', label: 'Safety (5-star rating)' },
        { id: 'technology', label: 'Technology (Apple CarPlay, cameras)' },
        { id: 'comfort', label: 'Comfort (leather seats, climate control)' },
        { id: 'performance', label: 'Performance (0-100 km/h)' },
        { id: 'fuel', label: 'Fuel economy (km/l)' },
        { id: 'resale', label: 'Resale value' }
      ]
    },
    {
      id: 3,
      question: 'Cultural Preference',
      description: 'Which style resonates with you most?',
      type: 'single',
      options: [
        { id: 'emirati', label: 'Emirati luxury' },
        { id: 'south_asian', label: 'South Asian reliability' },
        { id: 'european', label: 'European performance' },
        { id: 'hybrid', label: 'Hybrid/electric focus' },
        { id: 'offroad_focus', label: 'Robust 4x4 off-road' }
      ]
    },
    {
      id: 4,
      question: 'Budget Range',
      description: 'What is your budget range in AED?',
      type: 'single',
      options: [
        { id: '30k-50k', label: '30k-50k AED' },
        { id: '50k-80k', label: '50k-80k AED' },
        { id: '80k-120k', label: '80k-120k AED' },
        { id: '120k-200k', label: '120k-200k AED' },
        { id: '200k-plus', label: '200k+ AED' }
      ]
    },
    {
      id: 5,
      question: 'Body Type',
      description: 'Select your preferred body types',
      type: 'multi',
      maxSelections: null, // No limit
      options: [
        { id: 'sedan', label: 'Sedan' },
        { id: 'suv', label: 'SUV' },
        { id: 'coupe', label: 'Coupe' },
        { id: 'convertible', label: 'Convertible' },
        { id: 'pickup', label: 'Pickup' },
        { id: 'minivan', label: 'Minivan (7-seater)' }
      ]
    },
    {
      id: 6,
      question: 'Must-Have Features',
      description: 'Select features you absolutely need',
      type: 'multi',
      maxSelections: null, // No limit
      options: [
        { id: 'sunroof', label: 'Sunroof/Panoramic roof' },
        { id: 'leather', label: 'Leather seats' },
        { id: 'safety_advanced', label: 'Advanced safety (lane keep, blind spot)' },
        { id: 'carplay', label: 'Apple CarPlay/Android Auto' },
        { id: 'third_row', label: 'Third-row seating' },
        { id: 'tow_hitch', label: 'Tow hitch' }
      ]
    },
    {
      id: 7,
      question: 'How soon are you buying?',
      description: 'When do you plan to make your purchase?',
      type: 'single',
      options: [
        { id: 'immediate', label: 'Immediately (within 7 days)' },
        { id: 'this_month', label: 'This month' },
        { id: 'browsing', label: 'Browsing for now' }
      ]
    }
  ];

  // Initialize answers from localStorage or empty object
  const [answers, setAnswers] = useState(() => {
    const savedAnswers = localStorage.getItem('carQuizAnswers');
    return savedAnswers ? JSON.parse(savedAnswers) : {};
  });

  const [currentQuestion, setCurrentQuestion] = useState(() => {
    const savedProgress = localStorage.getItem('carQuizProgress');
    return savedProgress ? parseInt(savedProgress) : 0;
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Save progress to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('carQuizAnswers', JSON.stringify(answers));
    localStorage.setItem('carQuizProgress', currentQuestion.toString());
  }, [answers, currentQuestion]);

  const currentQ = questions[currentQuestion];

  const handleOptionSelect = (optionId) => {
    if (currentQ.type === 'single') {
      setAnswers({
        ...answers,
        [currentQ.id]: optionId
      });
    } else {
      // Multi-select
      const currentAnswers = answers[currentQ.id] || [];
      let newAnswers;
      
      if (currentAnswers.includes(optionId)) {
        // Remove if already selected
        newAnswers = currentAnswers.filter(id => id !== optionId);
      } else {
        // Add if under maxSelections limit
        if (currentQ.maxSelections && currentAnswers.length >= currentQ.maxSelections) {
          return; // Don't exceed max selections
        }
        newAnswers = [...currentAnswers, optionId];
      }
      
      setAnswers({
        ...answers,
        [currentQ.id]: newAnswers
      });
    }
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      // Last question - submit
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    const quizData = { answers, completedAt: new Date().toISOString() };
    try {
      const res = await fetch('/api/match/quiz', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(quizData)
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('quizResults', JSON.stringify(data.matches));
        localStorage.removeItem('carQuizAnswers');
        localStorage.removeItem('carQuizProgress');
        window.location.href = '/';
      } else {
        console.error(data);
        setIsSubmitting(false);
      }
    } catch (err) {
      console.error('Submit failed:', err);
      setIsSubmitting(false);
    }
  };

  // Check if current question has been answered
  const isAnswered = () => {
    if (!answers[currentQ.id]) return false;
    if (currentQ.type === 'single') return true;
    if (Array.isArray(answers[currentQ.id])) return answers[currentQ.id].length > 0;
    return false;
  };

  // Calculate progress percentage
  const progressPercentage = ((currentQuestion + 1) / questions.length) * 100;

  return (
    <div className="quiz-container">
      {/* Progress Bar */}
      <div className="progress-bar-container">
        <div className="progress-text">
          Question {currentQuestion + 1} of {questions.length}
        </div>
        <div className="progress-bar-background">
          <div 
            className="progress-bar-fill"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
      </div>

      {/* Question Card */}
      <div className="question-card">
        <div className="question-header">
          <h1 className="question-title">{currentQ.question}</h1>
          <p className="question-description">{currentQ.description}</p>
          
          {currentQ.maxSelections && (
            <div className="selection-limit">
              {currentQ.type === 'multi' && `Select up to ${currentQ.maxSelections}`}
            </div>
          )}
        </div>

        <div className="options-container">
          {currentQ.options.map((option) => {
            const isSelected = currentQ.type === 'single' 
              ? answers[currentQ.id] === option.id
              : (answers[currentQ.id] || []).includes(option.id);
            
            return (
              <div
                key={option.id}
                className={`option-card ${isSelected ? 'selected' : ''}`}
                onClick={() => handleOptionSelect(option.id)}
              >
                <div className="option-selector">
                  {currentQ.type === 'single' ? (
                    <div className={`radio-button ${isSelected ? 'checked' : ''}`}>
                      {isSelected && <div className="radio-dot"></div>}
                    </div>
                  ) : (
                    <div className={`checkbox ${isSelected ? 'checked' : ''}`}>
                      {isSelected && <div className="checkmark">✓</div>}
                    </div>
                  )}
                </div>
                <div className="option-label">{option.label}</div>
              </div>
            );
          })}
        </div>

        {/* Navigation Buttons */}
        <div className="navigation-buttons">
          <button
            className="nav-button secondary"
            onClick={handleBack}
            disabled={currentQuestion === 0}
          >
            Back
          </button>
          
          <button
            className={`nav-button primary ${isSubmitting ? 'loading' : ''}`}
            onClick={handleNext}
            disabled={!isAnswered() || isSubmitting}
          >
            {isSubmitting ? (
              <span className="loading-spinner"></span>
            ) : currentQuestion === questions.length - 1 ? (
              'Find My Matches'
            ) : (
              'Next'
            )}
          </button>
        </div>

        {/* Question Counter */}
        <div className="question-counter">
          {Array.from({ length: questions.length }).map((_, idx) => (
            <div
              key={idx}
              className={`counter-dot ${idx === currentQuestion ? 'active' : ''} ${answers[idx + 1] ? 'answered' : ''}`}
              onClick={() => setCurrentQuestion(idx)}
            />
          ))}
        </div>
      </div>

      {/* Save Status Indicator */}
      <div className="save-status">
        <span className="save-icon">💾</span>
        Progress saved automatically
      </div>
    </div>
  );
};

export default QuizWizard;