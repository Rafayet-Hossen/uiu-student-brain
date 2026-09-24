import { motion, AnimatePresence } from "framer-motion";
import { Quote, RotateCw } from "lucide-react";

export default function QuoteCard({ quoteIndex, quotes, onNextQuote }) {
  const currentQuote = quotes[quoteIndex] || quotes[0];

  return (
    <div className="dash-card-24 dash-quote-card">
      <div className="dash-quote-top">
        <Quote size={20} className="text-primary" />
        <motion.button
          type="button"
          className="dash-quote-btn"
          whileTap={{ rotate: 180, scale: 0.9 }}
          transition={{ duration: 0.2 }}
          onClick={onNextQuote}
          title="Show next inspiring scholar quote"
          aria-label="Next quote"
        >
          <RotateCw size={13} />
          <span>New Quote</span>
        </motion.button>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={quoteIndex}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.22 }}
        >
          <p className="dash-quote-text">"{currentQuote.quote}"</p>
          <span className="dash-quote-author">— {currentQuote.author}</span>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
