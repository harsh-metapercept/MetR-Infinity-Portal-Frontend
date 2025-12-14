import { motion } from 'framer-motion';

export const PageLoader = () => {
  return (
    <div className="min-h-screen w-full bg-[#fbf8f8] flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col items-center gap-4"
      >
        <div className="relative w-16 h-16">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-gray-200 border-t-accent-blue rounded-full"
          />
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 w-16 h-16 border-4 border-transparent border-b-accent-purple rounded-full"
          />
        </div>
        <p className="text-lg font-semibold text-text-primary animate-pulse">Loading...</p>
      </motion.div>
    </div>
  );
};

export const InlineLoader = ({ size = 'md', text = '' }) => {
  const sizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4'
  };

  return (
    <div className="flex items-center justify-center gap-3">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        className={`${sizes[size]} border-gray-200 border-t-accent-blue rounded-full`}
      />
      {text && <span className="text-sm text-gray-600">{text}</span>}
    </div>
  );
};

export const ErrorDisplay = ({ message, onRetry }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center gap-4 p-8 text-center"
    >
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
        <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <div>
        <h3 className="text-lg font-semibold text-red-600 mb-2">Oops! Something went wrong</h3>
        <p className="text-sm text-gray-600">{message || 'An unexpected error occurred'}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-6 py-2 bg-gradient-to-r from-accent-blue to-accent-purple text-white rounded-lg font-semibold hover:shadow-lg hover:scale-105 transition-all"
        >
          Try Again
        </button>
      )}
    </motion.div>
  );
};
