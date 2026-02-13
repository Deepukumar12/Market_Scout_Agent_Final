
import React from 'react';
import { motion } from 'framer-motion';
import { Users, BarChart3, MessageCircle, Heart, Info, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

const SentimentAnalysisPage = () => {
    
  return (
    <div className="relative max-w-7xl mx-auto space-y-10 pb-12">
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-96 bg-pink-500/10 blur-[100px] rounded-full animate-pulse-slow" />

      {/* Hero Header */}
      <div className="text-center space-y-4">
        <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center justify-center p-3 rounded-full bg-pink-500/10 border border-pink-500/20 mb-4"
        >
            <Heart className="w-6 h-6 text-pink-500 fill-current animate-pulse" />
        </motion.div>
        <motion.h1 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-5xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400"
        >
            Real-Time Brand Sentiment
        </motion.h1>
         <motion.p 
            className="text-gray-400 max-w-2xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
        >
            Live analysis of social chatter, reviews, and market perception across all major channels.
        </motion.p>
      </div>

      {/* Animated Wave Divider */}
      <div className="w-full h-12 overflow-hidden relative">
         <motion.svg 
            viewBox="0 0 1440 320" 
            className="absolute -top-20 w-full h-[300px] opacity-20"
            animate={{ x: [-100, 0] }}
            transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
         >
            <path fill="#ec4899" fillOpacity="1" d="M0,224L48,213.3C96,203,192,181,288,181.3C384,181,480,203,576,224C672,245,768,267,864,261.3C960,256,1056,224,1152,197.3C1248,171,1344,149,1392,138.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
         </motion.svg>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Competitor Benchmark Table */}
        <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-black/40 border border-white/10 rounded-2xl p-6 backdrop-blur-sm"
        >
            <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-indigo-400" /> Sentiment Benchmark
            </h3>
            
            <div className="space-y-4">
                {[
                    { name: 'Your Brand', score: 87, trend: '+12%', color: 'bg-emerald-500' },
                    { name: 'Competitor A', score: 64, trend: '-3%', color: 'bg-yellow-500' },
                    { name: 'Competitor B', score: 42, trend: '-8%', color: 'bg-red-500' },
                    { name: 'Competitor C', score: 71, trend: '+2%', color: 'bg-blue-500' }
                ].map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors group">
                        <div className="flex items-center gap-3">
                            <div className={`w-2 h-8 rounded-full ${item.color}`} />
                            <span className="font-medium text-gray-200">{item.name}</span>
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="text-right">
                                <div className="text-2xl font-bold">{item.score}</div>
                                <div className="text-[10px] text-gray-500 uppercase tracking-wider">Score</div>
                            </div>
                            <span className={`text-sm font-mono px-2 py-1 rounded bg-white/5 ${item.trend.startsWith('+') ? 'text-emerald-400' : 'text-red-400'}`}>
                                {item.trend}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </motion.div>

        {/* Social Media Heatmap */}
        <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-black/40 border border-white/10 rounded-2xl p-6 backdrop-blur-sm relative overflow-hidden"
        >
             <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-pink-400" /> Channel Heatmap
            </h3>
            
            <div className="absolute top-10 right-10 opacity-10">
                <Users size={120} />
            </div>

            <div className="flex flex-wrap gap-4 justify-center py-8">
                {[
                    { label: 'Twitter', val: 75, col: 'bg-sky-500' },
                    { label: 'Reddit', val: 45, col: 'bg-orange-500' },
                    { label: 'LinkedIn', val: 90, col: 'bg-blue-700' },
                    { label: 'News', val: 60, col: 'bg-purple-500' },
                    { label: 'Discord', val: 82, col: 'bg-indigo-500' },
                ].map((bubble, i) => (
                    <motion.div
                        key={i}
                        whileHover={{ scale: 1.1 }}
                        className={`rounded-full flex items-center justify-center text-xs font-bold text-white shadow-lg cursor-pointer backdrop-blur-md border border-white/20`}
                        style={{
                            width: bubble.val * 1.5,
                            height: bubble.val * 1.5,
                            backgroundColor: 'rgba(255,255,255,0.05)',
                            boxShadow: `0 0 20px ${bubble.val > 70 ? 'rgba(74, 222, 128, 0.2)' : 'rgba(244, 63, 94, 0.2)'}`,
                            borderColor: bubble.val > 70 ? 'rgba(74, 222, 128, 0.5)' : 'rgba(244, 63, 94, 0.5)'
                        }}
                    >
                        {bubble.label}
                    </motion.div>
                ))}
            </div>
            <div className="text-center text-xs text-gray-400 mt-4">
                Bubble size indicates volume • Border color indicates sentiment
            </div>
        </motion.div>
      </div>

      {/* AI Recommendations */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-gradient-to-r from-purple-900/20 to-pink-900/20 border border-white/10 rounded-2xl p-8"
      >
        <h3 className="text-lg font-semibold mb-4 text-purple-300">💡 AI Messaging Recommendations</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
                { tag: "Reliability & Uptime", score: 98 },
                { tag: "Enterprise Security", score: 94 },
                { tag: "24/7 Global Support", score: 89 }
            ].map((rec, i) => (
                <div key={i} className="bg-black/60 border border-white/10 rounded-xl p-4 flex items-center justify-between hover:border-purple-500/50 transition-colors">
                    <span className="text-gray-200 font-medium">"{rec.tag}"</span>
                    <span className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded font-mono border border-purple-500/30">
                        {rec.score}% Match
                    </span>
                </div>
            ))}
        </div>
      </motion.div>

      {/* Footer CTA */}
      <div className="flex justify-center pt-8">
        <Button 
            variant="ghost" 
            className="group relative px-8 py-4 h-auto rounded-full border border-pink-500/30 text-pink-300 hover:text-white hover:bg-pink-600/20 overflow-hidden"
        >
            <span className="relative z-10 flex items-center gap-2 text-lg">
                <Heart className="w-5 h-5 fill-current group-hover:animate-ping" />
                Trigger Live Sentiment Scan
            </span>
            <div className="absolute inset-0 bg-pink-500/10 scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500" />
        </Button>
      </div>

    </div>
  );
};

export default SentimentAnalysisPage;
