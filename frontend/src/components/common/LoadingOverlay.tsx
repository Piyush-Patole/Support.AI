import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
  subMessage?: string;
  progress?: number;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  visible,
  message = 'Processing...',
  subMessage,
  progress,
}) => {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="loading-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="loading-spinner" />
          <div className="loading-text">{message}</div>
          {subMessage && <div className="loading-subtext">{subMessage}</div>}
          {progress !== undefined && (
            <div style={{ width: 240 }}>
              <div className="progress-bar">
                <motion.div
                  className="progress-bar-fill"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <div style={{
                textAlign: 'center',
                marginTop: 8,
                fontSize: 'var(--font-size-footnote)',
                color: 'rgba(255,255,255,0.7)',
                fontWeight: 600
              }}>
                {Math.round(progress)}%
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
