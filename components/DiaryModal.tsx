
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SelectedWeek } from '../types';
import { generateReflectionPrompts, analyzeDiaryEntry } from '../services/geminiService';

interface DiaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedWeek: SelectedWeek | null;
  initialEntryText: string;
  onSave: (entryText: string) => void;
}

// ADHD-Friendly Design: Modal is kept simple, with clear sections.
// Animations are smooth and non-jarring to ease transitions.
const DiaryModal: React.FC<DiaryModalProps> = ({ isOpen, onClose, selectedWeek, initialEntryText, onSave }) => {
  const [entryText, setEntryText] = useState(initialEntryText);
  const [geminiResponse, setGeminiResponse] = useState('');
  const [isGeminiLoading, setIsGeminiLoading] = useState(false);
  const [geminiError, setGeminiError] = useState('');

  // Effect to reset state when the modal opens with new data or when initialEntryText changes
  useEffect(() => {
    if (isOpen) {
      setEntryText(initialEntryText);
      setGeminiResponse(''); // Clear previous AI response
      setGeminiError('');   // Clear previous AI error
    }
  }, [isOpen, initialEntryText]);


  // Close modal on Escape key press - Good for accessibility and ADHD (quick exit)
  const handleEscapeKey = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey);
      // Trap focus within the modal when open (accessibility)
      // This would ideally use a more robust focus-trap library or Radix UI's Dialog.
      // For now, autoFocus on textarea helps.
    } else {
      document.removeEventListener('keydown', handleEscapeKey);
    }
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isOpen, handleEscapeKey]);


  if (!selectedWeek) return null; // Should not render if no selected week, even if isOpen is true

  const handleGeminiAction = async () => {
    setIsGeminiLoading(true);
    setGeminiResponse('');
    setGeminiError('');

    // ADHD-Friendly: Clear, immediate feedback that something is happening (loading state).
    try {
      let responseText: string;
      if (entryText.trim() === '') {
        responseText = await generateReflectionPrompts(selectedWeek.date);
      } else {
        responseText = await analyzeDiaryEntry(entryText);
      }
      setGeminiResponse(responseText);
    } catch (error) {
      console.error('Error with Gemini Action:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred with the AI.';
      setGeminiError(errorMessage);
       // ADHD-Friendly: Display errors clearly but not harshly.
    } finally {
      setIsGeminiLoading(false);
    }
  };

  const handleSave = () => {
    onSave(entryText);
    // onClose(); // Usually, the parent component closes the modal after save logic is complete
  };

  // Framer Motion variants for modal animation
  const backdropVariants = {
    visible: { opacity: 1 },
    hidden: { opacity: 0 },
  };

  const modalVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.2, ease: "easeOut" } },
    exit: { opacity: 0, y: 30, scale: 0.95, transition: { duration: 0.15, ease: "easeIn" } },
  };
  
  const geminiButtonText = entryText.trim() === '' ? 'Get Reflection Prompts' : 'Analyze My Entry';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-[1000] p-4"
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          onClick={(e) => { if (e.target === e.currentTarget) onClose(); }} // Click outside to close
          role="dialog" // Accessibility: Identifies the element as a dialog
          aria-modal="true" // Accessibility: Indicates content outside dialog is inert
          aria-labelledby="diary-modal-title" // Accessibility: Links to title
          aria-describedby="diary-modal-description" // Accessibility: Links to a description if one exists
        >
          <motion.div
            className="bg-bg-dark rounded-lg w-full max-w-lg p-5 sm:p-6 md:p-7 shadow-2xl border border-box-border max-h-[90vh] flex flex-col overflow-y-auto"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            // ADHD-Friendly: Ample padding, clear structure, avoids feeling cramped.
          >
            {/* Modal Header */}
            <div className="text-center mb-4 sm:mb-5">
              <h3 id="diary-modal-title" className="text-lg sm:text-xl font-semibold text-primary m-0 mb-1">
                Diary Entry: Week {selectedWeek.col + 1}, Year {selectedWeek.row}
              </h3>
              <p id="diary-modal-description" className="text-sm text-text-muted">{selectedWeek.date}</p>
            </div>
            
            {/* Diary Text Area */}
            {/* ADHD-Friendly: autoFocus helps direct attention immediately. Placeholder text guides the user. */}
            <textarea 
              className="w-full min-h-[120px] sm:min-h-[140px] max-h-[250px] p-3 bg-[rgba(255,255,255,0.03)] border border-box-border rounded-md text-text-main font-poppins resize-y mb-4 sm:mb-5 text-base leading-relaxed
                         focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              value={entryText}
              onChange={(e) => setEntryText(e.target.value)}
              placeholder="What happened this week? Reflections, events, feelings..."
              autoFocus
              aria-label="Diary entry text area"
            />
            
            {/* Gemini AI Interaction Area */}
            {/* ADHD-Friendly: Visually distinct section for AI interactions. Clear loading/error states. */}
            <div className="mb-4 sm:mb-5 p-3 bg-[rgba(255,255,255,0.05)] border border-box-border rounded-md min-h-[70px] text-left">
              {isGeminiLoading && (
                <div className="flex items-center justify-center text-primary text-sm py-2">
                  <svg className="animate-spin-slow h-4 w-4 mr-2.5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Generating insights...</span>
                </div>
              )}
              {geminiError && <div className="text-accent text-sm p-2 break-words">Error: {geminiError}</div>}
              {geminiResponse && !isGeminiLoading && (
                <div 
                  className="text-sm text-text-muted whitespace-pre-wrap leading-relaxed break-words prose prose-sm prose-invert max-w-none 
                             prose-strong:text-primary prose-p:my-1 prose-ul:my-1 prose-li:my-0.5"
                  dangerouslySetInnerHTML={{ 
                    __html: geminiResponse
                      .replace(/\n/g, '<br />')
                      .replace(/(\d\.) /g, '<br/><strong>$1</strong> ') // Make numbered list items bold
                      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold text like **text**
                      .replace(/\*(.*?)\*/g, '<em>$1</em>') // Italicize text like *text*
                  }} 
                />
              )}
              {!isGeminiLoading && !geminiResponse && !geminiError && (
                <p className="text-xs text-text-muted/70 text-center py-2">
                  {entryText.trim() === '' ? "Click 'Get Reflection Prompts' for ideas." : "Click 'Analyze My Entry' for an AI summary."}
                </p>
              )}
            </div>

            {/* Modal Footer with Action Buttons */}
            {/* ADHD-Friendly: Buttons are clearly labeled and visually distinct. Primary action (Save) is prominent. */}
            <div className="mt-auto flex flex-col-reverse sm:flex-row sm:justify-between items-center gap-3 pt-1">
              <button
                onClick={handleGeminiAction}
                className={`w-full sm:w-auto bg-gemini-button-bg hover:bg-gemini-button-hover-bg text-white py-2.5 px-4 rounded-md text-sm font-medium transition-colors duration-200 ease-in-out
                            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-bg-dark focus:ring-gemini-button-bg
                            disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md`}
                disabled={isGeminiLoading}
                aria-live="polite" // Announce changes in button state/text if dynamic
                aria-label={geminiButtonText}
              >
                <span className="text-lg">✨</span>
                {geminiButtonText}
              </button>
              <div className="flex gap-3 w-full sm:w-auto">
                <button 
                  onClick={onClose} 
                  className="w-full sm:w-auto bg-[rgba(255,255,255,0.08)] hover:bg-[rgba(255,255,255,0.15)] text-text-muted hover:text-text-main py-2.5 px-5 rounded-md text-sm font-medium transition-colors duration-200 ease-in-out
                             focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-bg-dark focus:ring-gray-500 shadow"
                  aria-label="Cancel and close diary modal"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSave} 
                  className="w-full sm:w-auto bg-primary hover:bg-primary-dark text-bg-dark py-2.5 px-5 rounded-md text-sm font-semibold transition-colors duration-200 ease-in-out
                             focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-bg-dark focus:ring-primary shadow-md"
                  aria-label="Save diary entry"
                >
                  Save Entry
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DiaryModal;