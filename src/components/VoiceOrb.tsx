import { motion, AnimatePresence } from 'motion/react';

export type VoiceState = 'idle' | 'listening' | 'thinking' | 'speaking' | 'confirming' | 'executing';

interface VoiceOrbProps {
  state: VoiceState;
  gradientFrom?: string;
  gradientTo?: string;
  avatarUrl?: string;
  avatarUrls?: string[]; // Group mode: show multiple avatars in a grid
  onClick?: () => void;
}

export function VoiceOrb({ state, gradientFrom = '#8b5cf6', gradientTo = '#6366f1', avatarUrl, avatarUrls, onClick }: VoiceOrbProps) {
  const isActive = state !== 'idle';
  const isListening = state === 'listening';
  const isThinking = state === 'thinking';
  const isSpeaking = state === 'speaking';
  const isConfirming = state === 'confirming';
  const isExecuting = state === 'executing';

  const orbColor = isConfirming ? '#22c55e' : isExecuting ? '#eab308' : gradientFrom;
  const orbColorEnd = isConfirming ? '#16a34a' : isExecuting ? '#f59e0b' : gradientTo;

  return (
    <div className="relative flex items-center justify-center" style={{ width: 140, height: 140 }}>
      {/* Outer glow ring 3 */}
      <AnimatePresence>
        {isActive && (
          <motion.div
            className="absolute rounded-full"
            style={{
              width: 140,
              height: 140,
              background: `radial-gradient(circle, ${orbColor}15 0%, transparent 70%)`,
            }}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{
              scale: isListening ? [1, 1.3, 1] : isSpeaking ? [1, 1.2, 1] : 1,
              opacity: isListening ? [0.3, 0.6, 0.3] : 0.4,
            }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{
              duration: isListening ? 0.8 : isSpeaking ? 1.2 : 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        )}
      </AnimatePresence>

      {/* Outer glow ring 2 */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 120,
          height: 120,
          border: `1.5px solid ${orbColor}`,
          opacity: 0.2,
        }}
        animate={{
          scale: isListening
            ? [1, 1.25, 1]
            : isThinking
            ? [1, 1.1, 1]
            : isSpeaking
            ? [1, 1.15, 1]
            : [0.98, 1.02, 0.98],
          opacity: isListening ? [0.15, 0.4, 0.15] : isThinking ? [0.1, 0.3, 0.1] : 0.15,
        }}
        transition={{
          duration: isListening ? 0.7 : isThinking ? 1 : 2.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Outer glow ring 1 */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 105,
          height: 105,
          border: `1.5px solid ${orbColorEnd}`,
          opacity: 0.3,
        }}
        animate={{
          scale: isListening
            ? [1, 1.2, 1]
            : isThinking
            ? [1, 1.08, 1]
            : isSpeaking
            ? [1, 1.1, 1]
            : [0.99, 1.01, 0.99],
          opacity: isListening ? [0.2, 0.5, 0.2] : isThinking ? [0.15, 0.35, 0.15] : 0.2,
        }}
        transition={{
          duration: isListening ? 0.6 : isThinking ? 0.8 : 3,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 0.1,
        }}
      />

      {/* Thinking spinner ring */}
      {isThinking && (
        <motion.div
          className="absolute rounded-full"
          style={{
            width: 95,
            height: 95,
            border: '2px solid transparent',
            borderTopColor: orbColor,
            borderRightColor: `${orbColor}60`,
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
        />
      )}

      {/* Executing spinner ring */}
      {isExecuting && (
        <motion.div
          className="absolute rounded-full"
          style={{
            width: 95,
            height: 95,
            border: '2px solid transparent',
            borderTopColor: '#eab308',
            borderRightColor: '#eab30860',
            borderBottomColor: '#eab30830',
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
        />
      )}

      {/* Main orb */}
      <motion.button
        onClick={onClick}
        className="relative rounded-full flex items-center justify-center cursor-pointer z-10 overflow-hidden"
        style={{
          width: 80,
          height: 80,
          background: `radial-gradient(circle at 35% 35%, ${orbColor}ee, ${orbColorEnd}dd, ${orbColor}88)`,
          boxShadow: `0 0 30px ${orbColor}40, 0 0 60px ${orbColor}20, inset 0 -3px 10px ${orbColorEnd}40`,
        }}
        animate={{
          scale: isListening
            ? [1, 1.12, 1]
            : isThinking
            ? [0.95, 1.05, 0.95]
            : isSpeaking
            ? [1, 1.06, 1]
            : [0.97, 1.03, 0.97],
        }}
        transition={{
          duration: isListening ? 0.5 : isThinking ? 1.5 : isSpeaking ? 0.8 : 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        whileTap={{ scale: 0.9 }}
      >
        {/* Agent avatar as orb content */}
        {avatarUrls && avatarUrls.length > 0 ? (
          /* Group avatar grid — 3x2 layout for 6 agents */
          <div
            className="w-full h-full rounded-full overflow-hidden"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gridTemplateRows: 'repeat(2, 1fr)',
              opacity: isExecuting ? 0.6 : 1,
              filter: isThinking ? 'brightness(0.8)' : 'none',
            }}
          >
            {avatarUrls.slice(0, 6).map((url, i) => (
              <img
                key={i}
                src={url}
                alt=""
                className="w-full h-full object-cover"
              />
            ))}
          </div>
        ) : avatarUrl ? (
          <img
            src={avatarUrl}
            alt="AI Agent"
            className="w-full h-full rounded-full"
            style={{
              opacity: isExecuting ? 0.6 : 1,
              filter: isThinking ? 'brightness(0.8)' : 'none',
            }}
          />
        ) : (
          <div className="text-white select-none">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" x2="12" y1="19" y2="22" />
            </svg>
          </div>
        )}

        {/* State overlay indicators */}
        {avatarUrl && (
          <>
            {/* Listening: pulsing mic badge */}
            {isListening && (
              <motion.div
                className="absolute bottom-0 right-0 w-6 h-6 rounded-full flex items-center justify-center"
                style={{ background: orbColor }}
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 0.6, repeat: Infinity }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                </svg>
              </motion.div>
            )}

            {/* Speaking: audio bars overlay at bottom */}
            {isSpeaking && (
              <div className="absolute bottom-1 flex gap-[2px] items-end h-3">
                {[0, 1, 2, 3, 4].map(i => (
                  <motion.div
                    key={i}
                    className="w-[3px] bg-white rounded-full"
                    style={{ opacity: 0.9 }}
                    animate={{ height: [4, 10, 4] }}
                    transition={{
                      duration: 0.5,
                      repeat: Infinity,
                      delay: i * 0.08,
                      ease: 'easeInOut',
                    }}
                  />
                ))}
              </div>
            )}

            {/* Executing: spinner overlay */}
            {isExecuting && (
              <motion.div
                className="absolute inset-0 flex items-center justify-center"
                style={{ background: 'rgba(0,0,0,0.4)' }}
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                </motion.div>
              </motion.div>
            )}

            {/* Confirming: checkmark overlay */}
            {isConfirming && (
              <motion.div
                className="absolute bottom-0 right-0 w-6 h-6 rounded-full flex items-center justify-center"
                style={{ background: '#22c55e' }}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </motion.div>
            )}
          </>
        )}
      </motion.button>

      {/* Ripple effects for speaking */}
      <AnimatePresence>
        {isSpeaking && (
          <>
            {[0, 1, 2].map(i => (
              <motion.div
                key={`ripple-${i}`}
                className="absolute rounded-full"
                style={{ border: `1px solid ${orbColor}` }}
                initial={{ width: 80, height: 80, opacity: 0.4 }}
                animate={{ width: 140, height: 140, opacity: 0 }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.6,
                  ease: 'easeOut',
                }}
              />
            ))}
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
