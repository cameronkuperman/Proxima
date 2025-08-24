'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { PatternCard } from '@/lib/mock-health-data';
import { ChevronRight, Info, TrendingUp, AlertCircle, Brain, Activity, Clock, Cloud, Zap } from 'lucide-react';

interface PatternDiscoveryCardsProps {
  data: PatternCard[];
}

export default function PatternDiscoveryCards({ data }: PatternDiscoveryCardsProps) {
  const [flippedCards, setFlippedCards] = useState<Set<string>>(new Set());
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  
  const toggleCard = (id: string) => {
    const newFlipped = new Set(flippedCards);
    if (newFlipped.has(id)) {
      newFlipped.delete(id);
    } else {
      newFlipped.add(id);
    }
    setFlippedCards(newFlipped);
  };
  
  const getPriorityColor = (priority: string) => {
    if (priority === 'high') return 'border-red-500/30 bg-red-500/5';
    if (priority === 'medium') return 'border-yellow-500/30 bg-yellow-500/5';
    return 'border-green-500/30 bg-green-500/5';
  };
  
  const getPriorityBadge = (priority: string) => {
    if (priority === 'high') return 'bg-red-500/20 text-red-400';
    if (priority === 'medium') return 'bg-yellow-500/20 text-yellow-400';
    return 'bg-green-500/20 text-green-400';
  };
  
  const getPatternIcon = (type: string) => {
    switch(type) {
      case 'correlation': return <Brain className="w-5 h-5 text-purple-400" />;
      case 'behavioral': return <Activity className="w-5 h-5 text-blue-400" />;
      case 'success': return <TrendingUp className="w-5 h-5 text-green-400" />;
      case 'environmental': return <Cloud className="w-5 h-5 text-gray-400" />;
      case 'prediction': return <Clock className="w-5 h-5 text-yellow-400" />;
      default: return <Zap className="w-5 h-5 text-purple-400" />;
    }
  };
  
  // Arrange cards in a bento grid pattern
  const getCardSize = (index: number) => {
    // First two cards are large, rest are normal
    if (index < 2) return 'col-span-2 row-span-2';
    return 'col-span-1 row-span-1';
  };

  return (
    <div className="backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">Pattern Discovery</h3>
        <span className="text-xs text-gray-400">{data.length} patterns found</span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-[200px]">
        {data.map((card, index) => (
          <motion.div
            key={card.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className={`${getCardSize(index)} relative preserve-3d cursor-pointer`}
            onClick={() => toggleCard(card.id)}
            style={{ transformStyle: 'preserve-3d' }}
          >
            <AnimatePresence mode="wait">
              {!flippedCards.has(card.id) ? (
                // Front of card
                <motion.div
                  key="front"
                  initial={{ rotateY: 0 }}
                  exit={{ rotateY: -180 }}
                  transition={{ duration: 0.6, type: "spring" }}
                  className={`absolute inset-0 p-4 rounded-lg border ${getPriorityColor(card.priority)} 
                    hover:bg-white/[0.02] transition-colors flex flex-col`}
                  style={{ backfaceVisibility: 'hidden' }}
                >
                  {/* Priority badge and icon */}
                  <div className="flex items-start justify-between mb-3">
                    {getPatternIcon(card.type)}
                    <span className={`text-xs px-2 py-1 rounded-full ${getPriorityBadge(card.priority)}`}>
                      {card.priority} priority
                    </span>
                  </div>
                  
                  {/* Headline */}
                  <h4 className="text-sm font-semibold text-white mb-3 line-clamp-2">
                    {card.front.headline}
                  </h4>
                  
                  {/* Additional context */}
                  <p className="text-xs text-gray-400 mb-3">
                    Pattern detected over {Math.ceil(card.front.dataPoints / 7)} weeks of analysis
                  </p>
                  
                  {/* Stats */}
                  <div className="mt-auto space-y-3">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">Statistical Confidence</span>
                        <span className="text-white font-medium">{card.front.confidence}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${card.front.confidence}%` }}
                          transition={{ delay: 0.5 + index * 0.1, duration: 0.5 }}
                          className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-gray-500">Data Points</span>
                        <p className="text-white font-medium">{card.front.dataPoints}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Type</span>
                        <p className="text-white font-medium capitalize">{card.type}</p>
                      </div>
                    </div>
                    
                    {card.front.actionable && (
                      <div className="pt-2 border-t border-white/[0.05]">
                        <span className="text-xs text-green-400 flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" />
                          Intervention Available
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {/* Flip indicator */}
                  <div className="absolute bottom-2 right-2 text-gray-500">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </motion.div>
              ) : (
                // Back of card
                <motion.div
                  key="back"
                  initial={{ rotateY: 180 }}
                  animate={{ rotateY: 0 }}
                  exit={{ rotateY: 180 }}
                  transition={{ duration: 0.6, type: "spring" }}
                  className={`absolute inset-0 p-4 rounded-lg border ${getPriorityColor(card.priority)} 
                    bg-black/50 backdrop-blur-sm flex flex-col`}
                  style={{ backfaceVisibility: 'hidden', transform: 'rotateY(0deg)' }}
                >
                  {/* Back header */}
                  <div className="flex items-start justify-between mb-3">
                    <Info className="w-5 h-5 text-purple-400" />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedCard(expandedCard === card.id ? null : card.id);
                      }}
                      className="text-xs text-gray-400 hover:text-white"
                    >
                      {expandedCard === card.id ? 'Less' : 'More'}
                    </button>
                  </div>
                  
                  {/* Full insight */}
                  <div className="flex-1 overflow-y-auto">
                    <p className={`text-xs text-gray-300 mb-3 ${
                      expandedCard === card.id ? '' : 'line-clamp-3'
                    }`}>
                      {card.back.fullInsight}
                    </p>
                    
                    {/* Visualization placeholder */}
                    {card.back.visualization === 'correlation' && (
                      <div className="h-16 bg-white/[0.03] rounded-lg p-2 mb-3">
                        <div className="flex items-end justify-around h-full gap-1">
                          {[40, 60, 45, 70, 85, 75, 90].map((height, i) => (
                            <div
                              key={i}
                              className="w-full bg-gradient-to-t from-purple-500/50 to-pink-500/50 rounded-t"
                              style={{ height: `${height}%` }}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {expandedCard === card.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="space-y-2"
                      >
                        {/* Explanation */}
                        <div className="p-2 bg-white/[0.03] rounded-lg">
                          <p className="text-xs text-gray-400">
                            <span className="text-purple-400 font-medium">Why this matters:</span> {card.back.explanation}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </div>
                  
                  {/* Actions */}
                  <div className="mt-3 space-y-2">
                    {card.back.actions.map((action, i) => (
                      <button
                        key={i}
                        onClick={(e) => e.stopPropagation()}
                        className={`w-full px-3 py-1.5 text-xs rounded-lg transition-all ${
                          action.type === 'primary'
                            ? 'bg-purple-500/20 text-purple-400 hover:bg-purple-500/30'
                            : 'bg-white/[0.05] text-gray-400 hover:bg-white/[0.08]'
                        }`}
                      >
                        {action.text}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
      
      {/* Tips */}
      <div className="mt-4 p-3 bg-white/[0.02] rounded-lg border border-white/[0.05]">
        <p className="text-xs text-gray-400 flex items-center gap-2">
          <AlertCircle className="w-3 h-3" />
          Click any card to explore the pattern in detail. High priority patterns should be addressed first.
        </p>
      </div>
    </div>
  );
}