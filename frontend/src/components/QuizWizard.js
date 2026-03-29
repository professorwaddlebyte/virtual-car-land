import { useState } from 'react';

const QuizWizard = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [answers, setAnswers] = useState({});
  
  const questions = [
    {
      id: 1,
      text: "What's your primary use for the car?",
      options: [
        { id: 'daily', text: 'Daily commuting' },
        { id: 'family', text: 'Family use' },
        { id: 'luxury', text: 'Luxury/Performance' },
        { id: 'offroad', text: 'Off-road adventures' }
      ]
    },
    {
      id: 2,
      text: "What's your budget range?",
      options: [
        { id: 'economy', text: 'Economy (< 100,000 AED)' },
        { id: 'mid', text: 'Mid-range (100k-200k AED)' },
        { id: 'premium', text: 'Premium (200k-400k AED)' },
        { id: 'luxury', text: 'Luxury (> 400,000 AED)' }
      ]
    },
    {
      id: 3,
      text: "Preferred fuel type?",
      options: [
        { id: 'petrol', text: 'Petrol' },
        { id: 'diesel', text: 'Diesel' },
        { id: 'hybrid', text: 'Hybrid' },
        { id: 'electric', text: 'Electric' }
      ]
    }
  ];

  const handleAnswer = (questionId, answer) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const nextStep = () => {
    if (currentStep < questions.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="quiz-wizard">
      <h2>Car Match Quiz</h2>
      {currentStep <= questions.length && (
        <div key={questions[currentStep-1].id}>
          <h3>{questions[currentStep-1].text}</h3>
          {questions[currentStep-1].options.map(option => (
            <div key={option.id}>
              <label>
                <input
                  type="radio"
                  name={questions[currentStep-1].id}
                  value={option.id}
                  checked={answers[questions[currentStep-1].id] === option.id}
                  onChange={() => handleAnswer(questions[currentStep-1].id, option.id)}
                />
                {option.text}
              </label>
            </div>
          ))}
          <div>
            <button onClick={prevStep} disabled={currentStep === 1}>Previous</button>
            <button onClick={nextStep}>Next</button>
          </div>
        </div>
      )}
      {currentStep > questions.length && (
        <div>
          <h3>Quiz Completed</h3>
          <p>Thank you for completing the quiz!</p>
        </div>
      )}
    </div>
  );
};

export default QuizWizard;