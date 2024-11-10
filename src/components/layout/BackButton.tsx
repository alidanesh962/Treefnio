import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export default function BackButton() {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(-1)}
      className="fixed right-4 bottom-4 flex items-center gap-2 px-4 py-2 
                bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200
                rounded-lg shadow-md hover:shadow-lg transition-all duration-200
                border border-gray-200 dark:border-gray-600 z-40"
    >
      <ArrowRight className="h-4 w-4" />
      بازگشت
    </button>
  );
}