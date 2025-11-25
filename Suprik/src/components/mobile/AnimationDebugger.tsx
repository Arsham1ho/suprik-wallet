/**
 * Animation Debugger Component
 * Test and debug animations on mobile
 */

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  debugAnimations,
  supportsAnimations,
  supports3DTransforms,
  supportsGPUAcceleration,
  prefersReducedMotion,
  getOptimalAnimationConfig,
  testAnimationPerformance,
} from '../../utils/mobile/detectAnimationSupport';
import { Button } from '../ui/button';
import { Card } from '../ui/card';

export function AnimationDebugger() {
  const [isOpen, setIsOpen] = useState(false);
  const [testRunning, setTestRunning] = useState(false);
  const [perfResult, setPerfResult] = useState<{ fps: number; smooth: boolean } | null>(null);
  const [rotation, setRotation] = useState(0);
  
  const config = getOptimalAnimationConfig();

  useEffect(() => {
    if (isOpen) {
      debugAnimations();
    }
  }, [isOpen]);

  const runPerformanceTest = async () => {
    setTestRunning(true);
    const result = await testAnimationPerformance();
    setPerfResult(result);
    setTestRunning(false);
  };

  const testRotation = () => {
    setRotation(prev => prev + 360);
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 left-4 z-[9999] bg-purple-600 hover:bg-purple-700"
        size="sm"
      >
        🎨 Debug
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] overflow-auto p-4">
      <Card className="max-w-2xl mx-auto bg-slate-900 border-slate-800 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Animation Debugger</h2>
          <Button
            onClick={() => setIsOpen(false)}
            variant="ghost"
            size="sm"
            className="text-slate-400"
          >
            Close
          </Button>
        </div>

        {/* Support Check */}
        <div className="space-y-3 mb-6">
          <h3 className="text-sm font-semibold text-slate-300">Browser Support</h3>
          <div className="grid grid-cols-2 gap-2">
            <div className="p-3 bg-slate-800 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">CSS Animations</span>
                <span className={supportsAnimations() ? 'text-green-400' : 'text-red-400'}>
                  {supportsAnimations() ? '✅' : '❌'}
                </span>
              </div>
            </div>
            
            <div className="p-3 bg-slate-800 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">3D Transforms</span>
                <span className={supports3DTransforms() ? 'text-green-400' : 'text-red-400'}>
                  {supports3DTransforms() ? '✅' : '❌'}
                </span>
              </div>
            </div>
            
            <div className="p-3 bg-slate-800 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">GPU Acceleration</span>
                <span className={supportsGPUAcceleration() ? 'text-green-400' : 'text-red-400'}>
                  {supportsGPUAcceleration() ? '✅' : '❌'}
                </span>
              </div>
            </div>
            
            <div className="p-3 bg-slate-800 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">Reduced Motion</span>
                <span className={prefersReducedMotion() ? 'text-yellow-400' : 'text-green-400'}>
                  {prefersReducedMotion() ? '⚠️' : '✅'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Device Config */}
        <div className="space-y-3 mb-6">
          <h3 className="text-sm font-semibold text-slate-300">Device Configuration</h3>
          <div className="p-4 bg-slate-800 rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Mobile</span>
              <span className="text-white">{config.isMobile ? 'Yes' : 'No'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Duration</span>
              <span className="text-white">{config.duration}s</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Spring Damping</span>
              <span className="text-white">{config.springDamping}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Spring Stiffness</span>
              <span className="text-white">{config.springStiffness}</span>
            </div>
          </div>
        </div>

        {/* Performance Test */}
        <div className="space-y-3 mb-6">
          <h3 className="text-sm font-semibold text-slate-300">Performance Test</h3>
          <Button
            onClick={runPerformanceTest}
            disabled={testRunning}
            className="w-full bg-purple-600 hover:bg-purple-700"
          >
            {testRunning ? 'Testing...' : 'Run Performance Test'}
          </Button>
          
          {perfResult && (
            <div className="p-4 bg-slate-800 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">FPS</span>
                <span className={`text-lg font-bold ${
                  perfResult.smooth ? 'text-green-400' : 'text-yellow-400'
                }`}>
                  {perfResult.fps}
                </span>
              </div>
              <div className="mt-2 flex justify-between items-center">
                <span className="text-slate-400">Status</span>
                <span className={perfResult.smooth ? 'text-green-400' : 'text-yellow-400'}>
                  {perfResult.smooth ? '✅ Smooth' : '⚠️ May lag'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Animation Test */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-300">Animation Test</h3>
          
          {/* Rotation Test */}
          <div className="p-4 bg-slate-800 rounded-lg">
            <p className="text-sm text-slate-400 mb-3">Rotation Test (Logo Spin)</p>
            <div className="flex items-center justify-center gap-4">
              <motion.div
                animate={{ rotate: rotation }}
                transition={{
                  duration: 2,
                  ease: 'easeInOut',
                }}
                className="w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center text-2xl"
              >
                🪐
              </motion.div>
              <Button
                onClick={testRotation}
                className="bg-purple-600 hover:bg-purple-700"
              >
                Rotate
              </Button>
            </div>
          </div>

          {/* Fade Test */}
          <div className="p-4 bg-slate-800 rounded-lg">
            <p className="text-sm text-slate-400 mb-3">Fade Test</p>
            <motion.div
              animate={{
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="h-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg"
            />
          </div>

          {/* Scale Test */}
          <div className="p-4 bg-slate-800 rounded-lg">
            <p className="text-sm text-slate-400 mb-3">Scale Test</p>
            <div className="flex justify-center">
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className="w-16 h-16 bg-gradient-to-br from-green-600 to-emerald-600 rounded-lg"
              />
            </div>
          </div>

          {/* Slide Test */}
          <div className="p-4 bg-slate-800 rounded-lg">
            <p className="text-sm text-slate-400 mb-3">Slide Test</p>
            <div className="relative h-12 bg-slate-700 rounded-lg overflow-hidden">
              <motion.div
                animate={{
                  x: ['-100%', '100%'],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'linear',
                }}
                className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-purple-600 to-blue-600"
              />
            </div>
          </div>
        </div>

        {/* Console Log Button */}
        <div className="mt-6 pt-6 border-t border-slate-800">
          <Button
            onClick={() => debugAnimations()}
            variant="outline"
            className="w-full border-slate-700 text-slate-300"
          >
            Log to Console
          </Button>
        </div>
      </Card>
    </div>
  );
}
