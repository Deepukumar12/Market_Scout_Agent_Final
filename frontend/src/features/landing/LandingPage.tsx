import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars, Sphere, MeshDistortMaterial, Float } from '@react-three/drei';
import { motion, useScroll, useMotionValueEvent, useTransform, AnimatePresence } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';
import * as THREE from 'three';
import { Button } from '@/components/ui/button';
import { 
  IntelligenceGlobe, 
  CompetitorPins 
} from '@/components/animations/IntelligenceGlobe';
import { 
  ArrowRight, 
  Shield, 
  Zap, 
  Database, 
  BarChart3, 
  Lock, 
  Users, 
  Globe, 
  Brain,
  Activity,
  TrendingUp,
  Target,
  Clock,
  Layers,
  Sparkles,
  ChevronRight,
  Check,
  Star,
  Crown,
  Rocket,
  Infinity,
  AlertCircle,
  HelpCircle,
  MessageCircle,
  X,
  Send,
  Bot,
  User,
  Loader2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Footer } from '@/components/layout/Footer';

// Professional color palette
const colors = {
  primary: {
    50: '#e6f7ff',
    100: '#b3e5ff',
    200: '#80d4ff',
    300: '#4dc2ff',
    400: '#1ab0ff',
    500: '#0099ff',
    600: '#007acc',
    700: '#005c99',
    800: '#003d66',
    900: '#001f33',
  },
  accent: {
    50: '#f0f0ff',
    100: '#d1d1ff',
    200: '#b3b3ff',
    300: '#9494ff',
    400: '#7575ff',
    500: '#5656ff',
    600: '#4545cc',
    700: '#343499',
    800: '#222266',
    900: '#111133',
  }
};

// Chat Message Type
interface ChatMessage {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
}

// Chat Widget Component
const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'bot',
      content: '👋 Hi there! I\'m your ScoutIQ assistant. How can I help you today?',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
    }
  }, [isOpen]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simulate bot response (replace with actual API call)
    setTimeout(() => {
      const botResponses = [
        "I can help you with information about our pricing plans, features, or technical specifications. What would you like to know?",
        "Great question! Our autonomous agents can track up to 50 competitors simultaneously with real-time updates.",
        "We offer a 14-day free trial on all plans. No credit card required to get started.",
        "Our predictive analytics engine uses machine learning to forecast competitor moves up to 90 days in advance.",
        "You can deploy our agents in under 5 minutes. Would you like me to guide you through the process?",
      ];
      const randomResponse = botResponses[Math.floor(Math.random() * botResponses.length)];
      
      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: randomResponse,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Chat Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 shadow-2xl shadow-blue-500/50 flex items-center justify-center cursor-pointer group hover:shadow-blue-500/70 transition-all duration-300"
      >
        <MessageCircle className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
        
        {/* Notification dot */}
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-slate-900 animate-pulse" />
      </motion.button>

      {/* Chat Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            />

            {/* Sidebar */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 w-full max-w-md h-full bg-gradient-to-b from-slate-900 to-slate-950 border-l border-white/10 shadow-2xl z-50 flex flex-col"
            >
              {/* Header */}
              <div className="p-5 border-b border-white/10 flex items-center justify-between bg-white/5 backdrop-blur-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">ScoutIQ Assistant</h3>
                    <p className="text-xs text-emerald-400 flex items-center gap-1">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                      </span>
                      Online
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex gap-2 max-w-[80%] ${message.type === 'user' ? 'flex-row-reverse' : ''}`}>
                      {/* Avatar */}
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        message.type === 'user' 
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500' 
                          : 'bg-gradient-to-r from-blue-500 to-indigo-600'
                      }`}>
                        {message.type === 'user' ? (
                          <User className="w-4 h-4 text-white" />
                        ) : (
                          <Bot className="w-4 h-4 text-white" />
                        )}
                      </div>
                      
                      {/* Message Bubble */}
                      <div className={`rounded-2xl p-3 ${
                        message.type === 'user'
                          ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white'
                          : 'bg-white/10 text-slate-200'
                      }`}>
                        <p className="text-sm leading-relaxed">{message.content}</p>
                        <p className="text-[10px] mt-1 opacity-50">
                          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
                
                {/* Typing Indicator */}
                {isTyping && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-start"
                  >
                    <div className="flex gap-2 max-w-[80%]">
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                      <div className="bg-white/10 rounded-2xl p-4">
                        <div className="flex gap-1">
                          <motion.div
                            animate={{ y: [0, -5, 0] }}
                            transition={{ duration: 0.8, repeat: Number.POSITIVE_INFINITY, delay: 0 }}
                            className="w-2 h-2 bg-white/40 rounded-full"
                          />
                          <motion.div
                            animate={{ y: [0, -5, 0] }}
                            transition={{ duration: 0.8, repeat: Number.POSITIVE_INFINITY, delay: 0.2 }}
                            className="w-2 h-2 bg-white/40 rounded-full"
                          />
                          <motion.div
                            animate={{ y: [0, -5, 0] }}
                            transition={{ duration: 0.8, repeat: Number.POSITIVE_INFINITY, delay: 0.4 }}
                            className="w-2 h-2 bg-white/40 rounded-full"
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 border-t border-white/10 bg-white/5 backdrop-blur-xl">
                <div className="flex gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message..."
                    className="flex-1 bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim() || isTyping}
                    className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                      inputValue.trim() && !isTyping
                        ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40'
                        : 'bg-white/5 text-slate-600 cursor-not-allowed'
                    }`}
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
                
                {/* Quick actions */}
                <div className="flex gap-2 mt-3">
                  {['Pricing', 'Features', 'Demo', 'Support'].map((action) => (
                    <button
                      key={action}
                      onClick={() => {
                        setInputValue(`Tell me about ${action}`);
                        setTimeout(() => handleSendMessage(), 100);
                      }}
                      className="text-[10px] px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                    >
                      {action}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default function LandingPage() {
  const scroll = useScroll();
  const globeRef = useRef<THREE.Group>(null);
  const [activeFeature, setActiveFeature] = useState<number | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  // Parallax effect on mouse move
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20,
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Scroll-based globe rotation
  useMotionValueEvent(scroll.scrollYProgress, "change", (latest) => {
    if (globeRef.current) {
      globeRef.current.rotation.y = latest * Math.PI * 2;
    }
  });

  // Pricing data
  const plans = [
    {
      name: 'Starter',
      description: 'Essential intelligence for small teams',
      icon: Rocket,
      monthlyPrice: 499,
      annualPrice: 399,
      features: [
        { name: '10 competitors tracked', included: true },
        { name: 'Basic signal detection', included: true },
        { name: 'Weekly reports', included: true },
        { name: 'Email support', included: true },
        { name: 'API (100 calls/day)', included: true },
        { name: '30-day history', included: true },
        { name: 'Predictive analytics', included: false },
        { name: 'Custom integrations', included: false },
      ],
      highlight: false,
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      name: 'Professional',
      description: 'Advanced intelligence for growing teams',
      icon: Crown,
      monthlyPrice: 999,
      annualPrice: 799,
      features: [
        { name: '50 competitors tracked', included: true },
        { name: 'Advanced signal detection', included: true },
        { name: 'Daily reports', included: true },
        { name: 'Priority support', included: true },
        { name: 'API (1,000 calls/day)', included: true },
        { name: '1-year history', included: true },
        { name: 'Predictive analytics', included: true },
        { name: 'Custom integrations', included: true },
      ],
      highlight: true,
      gradient: 'from-indigo-500 to-purple-500',
    },
    {
      name: 'Enterprise',
      description: 'Enterprise-grade intelligence at scale',
      icon: Star,
      monthlyPrice: 2499,
      annualPrice: 1999,
      features: [
        { name: 'Unlimited competitors', included: true },
        { name: 'Real-time detection', included: true },
        { name: 'Real-time reports', included: true },
        { name: '24/7 dedicated support', included: true },
        { name: 'Unlimited API', included: true },
        { name: 'Unlimited history', included: true },
        { name: 'Advanced predictions', included: true },
        { name: 'Custom training', included: true },
      ],
      highlight: false,
      gradient: 'from-purple-500 to-pink-500',
    },
  ];

  // FAQ data
  const faqs = [
    {
      question: 'Can I upgrade or downgrade my plan anytime?',
      answer: 'Yes, you can change your plan at any time. Changes take effect immediately and we prorate the remaining balance.',
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept all major credit cards, PayPal, and bank transfers for Enterprise plans. All payments are processed securely.',
    },
    {
      question: 'Is there a setup fee?',
      answer: 'No, there are no setup fees for any of our plans. You only pay the subscription price.',
    },
    {
      question: 'Do you offer a free trial?',
      answer: 'Yes, we offer a 14-day free trial on all plans. No credit card required.',
    },
    {
      question: 'What happens to my data if I cancel?',
      answer: 'You can export all your data before cancellation. We retain data for 30 days after cancellation.',
    },
    {
      question: 'Can I get a custom enterprise plan?',
      answer: 'Absolutely! Contact our sales team for custom enterprise solutions tailored to your needs.',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white selection:bg-blue-500/30 font-sans antialiased">
      
      {/* Navigation */}
      <motion.nav 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="fixed top-0 w-full z-50 px-6 py-4"
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between backdrop-blur-xl bg-white/5 rounded-2xl border border-white/10 px-6 py-3 shadow-2xl">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:shadow-blue-500/50 transition-all duration-300">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-semibold tracking-tight">
                Scout<span className="text-blue-400">IQ</span>
              </span>
            </Link>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center gap-8">
              {['Product', 'Solutions', 'Pricing', 'Resources'].map((item) => (
                <motion.a
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  className="text-sm text-slate-300 hover:text-white transition-colors relative group"
                  whileHover={{ y: -2 }}
                >
                  {item}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-400 group-hover:w-full transition-all duration-300" />
                </motion.a>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="flex items-center gap-3">
              <Link to="/login">
                <Button variant="ghost" className="text-slate-300 hover:text-white hover:bg-white/10 px-5 py-2 rounded-xl">
                  Sign in
                </Button>
              </Link>
              <Link to="/dashboard">
                <Button className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-6 py-2 rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300">
                  Launch Console
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
        {/* Background gradients */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 -left-1/4 w-[800px] h-[800px] bg-blue-500/10 rounded-full blur-[150px]" />
          <div className="absolute bottom-1/4 -right-1/4 w-[800px] h-[800px] bg-indigo-500/10 rounded-full blur-[150px]" />
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left Column - Content */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="space-y-8"
            >
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
                </span>
                <span className="text-sm text-slate-300">Introducing Autonomous Intelligence</span>
              </motion.div>

              {/* Headline */}
              <h1 className="text-5xl lg:text-7xl font-bold tracking-tight">
                Master Competitor
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">
                  Intelligence Pipeline
                </span>
              </h1>

              <p className="text-xl text-slate-400 leading-relaxed max-w-xl">
                Deploy autonomous agents that continuously monitor, analyze, and predict competitor movements with surgical precision.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link to="/dashboard">
                  <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-8 py-6 text-lg rounded-xl shadow-xl shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300 group">
                    Start Free Trial
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Button size="lg" variant="outline" className="w-full sm:w-auto px-8 py-6 text-lg rounded-xl border-white/10 hover:bg-white/5">
                  Watch Demo
                </Button>
              </div>

              {/* Social Proof */}
              <div className="pt-8 border-t border-white/10">
                <p className="text-sm text-slate-500 mb-4">Trusted by innovative teams</p>
                <div className="flex flex-wrap gap-8 items-center opacity-50">
                  {['Vercel', 'Linear', 'Ramp', 'Gusto'].map((company) => (
                    <span key={company} className="text-lg font-medium text-slate-400">{company}</span>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Right Column - 3D Globe */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.4 }}
              className="relative h-[600px] hidden lg:block"
              style={{
                transform: `perspective(1000px) rotateY(${mousePosition.x}deg) rotateX(${mousePosition.y}deg)`,
              }}
            >
              <Canvas camera={{ position: [0, 0, 8], fov: 45 }} className="w-full h-full">
                <color attach="background" args={['#020617']} />
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} intensity={1} />
                
                <Stars radius={100} depth={50} count={3000} factor={4} fade speed={1} />
                
                <Float speed={2} rotationIntensity={1} floatIntensity={1}>
                  <group ref={globeRef}>
                    <IntelligenceGlobe />
                  </group>
                </Float>
                
                <CompetitorPins />
                
                <OrbitControls 
                  enableZoom={false}
                  enablePan={false}
                  autoRotate
                  autoRotateSpeed={0.5}
                  minPolarAngle={Math.PI / 3}
                  maxPolarAngle={Math.PI / 2}
                  enableDamping
                  dampingFactor={0.05}
                />
              </Canvas>

              {/* Stats overlay */}
              <div className="absolute bottom-6 left-6 right-6 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-4">
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: 'Active Agents', value: '47', change: '+12' },
                    { label: 'Signals Tracked', value: '2.4k', change: '+18%' },
                    { label: 'Threats Detected', value: '8', change: '-23%' },
                  ].map((stat) => (
                    <div key={stat.label} className="text-center">
                      <div className="text-xs text-slate-400 mb-1">{stat.label}</div>
                      <div className="text-xl font-bold text-white">{stat.value}</div>
                      <div className="text-xs text-emerald-400">{stat.change}</div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Scroll indicator */}
        <motion.div 
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
        >
          <div className="w-6 h-10 rounded-full border-2 border-white/20 flex justify-center">
            <div className="w-1 h-2 bg-white/40 rounded-full mt-2" />
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="py-32 relative" id="features">
        <div className="max-w-7xl mx-auto px-6">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-3xl mx-auto mb-20"
          >
            <h2 className="text-4xl lg:text-5xl font-bold mb-6">
              Built for 
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400"> Strategic Intelligence</span>
            </h2>
            <p className="text-xl text-slate-400">
              Our autonomous agents process millions of data points through a sophisticated pipeline, delivering actionable insights with zero latency.
            </p>
          </motion.div>

          {/* Feature Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Brain,
                title: 'Autonomous Agents',
                description: 'Self-learning agents that continuously adapt to competitor behavior patterns.',
                metric: '99.9% accuracy',
                gradient: 'from-blue-500 to-cyan-500',
              },
              {
                icon: Globe,
                title: 'Global Coverage',
                description: 'Monitor competitors across 195 countries with real-time data aggregation.',
                metric: '50k+ sources',
                gradient: 'from-indigo-500 to-purple-500',
              },
              {
                icon: TrendingUp,
                title: 'Predictive Analytics',
                description: 'ML models forecast competitor moves up to 90 days in advance.',
                metric: '87% precision',
                gradient: 'from-purple-500 to-pink-500',
              },
              {
                icon: Shield,
                title: 'Risk Scoring',
                description: 'Real-time threat assessment with automated alerting system.',
                metric: '50+ signals',
                gradient: 'from-orange-500 to-red-500',
              },
              {
                icon: Layers,
                title: 'Multi-source Fusion',
                description: 'Cross-validate data from patents, job boards, and financial reports.',
                metric: '20+ sources',
                gradient: 'from-green-500 to-emerald-500',
              },
              {
                icon: Activity,
                title: 'Signal Velocity',
                description: 'Track innovation speed and technology adoption rates.',
                metric: 'Real-time',
                gradient: 'from-blue-500 to-indigo-500',
              },
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                onHoverStart={() => setActiveFeature(index)}
                onHoverEnd={() => setActiveFeature(null)}
                className="group relative"
              >
                <div className="absolute -inset-px bg-gradient-to-r from-blue-500 to-indigo-500 rounded-3xl opacity-0 group-hover:opacity-30 blur-xl transition-all duration-500" />
                <div className="relative bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-8 h-full hover:border-white/20 transition-all duration-300">
                  {/* Icon */}
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-r ${feature.gradient} p-3 mb-6 shadow-lg`}>
                    <feature.icon className="w-full h-full text-white" />
                  </div>
                  
                  <h3 className="text-xl font-semibold mb-3 text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-400 group-hover:to-indigo-400 transition-all duration-300">
                    {feature.title}
                  </h3>
                  
                  <p className="text-slate-400 mb-4 leading-relaxed">
                    {feature.description}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-mono text-slate-500">{feature.metric}</span>
                    <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pipeline Section */}
      <section className="py-32 bg-white/5 backdrop-blur-sm border-y border-white/10" id="solutions">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left side - Content */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 mb-8">
                <Sparkles className="w-4 h-4 text-blue-400" />
                <span className="text-sm text-blue-400">5-Step Pipeline</span>
              </div>
              
              <h2 className="text-4xl font-bold mb-6">
                From Raw Data to
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
                  Strategic Intelligence
                </span>
              </h2>
              
              <p className="text-lg text-slate-400 mb-12 leading-relaxed">
                Our proprietary pipeline processes millions of data points through five distinct stages, ensuring every insight is verified and actionable.
              </p>

              {/* Pipeline Steps */}
              <div className="space-y-6">
                {[
                  { step: '01', title: 'Data Acquisition', desc: 'Scrape 50+ sources including patents, job boards, and financial reports', time: '2.3ms' },
                  { step: '02', title: 'Signal Processing', desc: 'Filter and normalize data through ML models', time: '4.1ms' },
                  { step: '03', title: 'Cross-validation', desc: 'Verify signals against multiple sources', time: '1.8ms' },
                  { step: '04', title: 'Pattern Recognition', desc: 'Identify emerging trends and threats', time: '3.2ms' },
                  { step: '05', title: 'Intelligence Synthesis', desc: 'Generate actionable insights', time: '2.7ms' },
                ].map((item) => (
                  <motion.div
                    key={item.step}
                    className="flex items-start gap-4 group"
                    whileHover={{ x: 10 }}
                    transition={{ type: "spring", stiffness: 400 }}
                  >
                    <div className="text-2xl font-bold text-blue-500/50 group-hover:text-blue-400 transition-colors">
                      {item.step}
                    </div>
                    <div className="flex-1 pb-4 border-b border-white/10">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-semibold text-white group-hover:text-blue-400 transition-colors">
                          {item.title}
                        </h4>
                        <span className="text-xs font-mono text-emerald-400">{item.time}</span>
                      </div>
                      <p className="text-sm text-slate-500">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Right side - Visualization */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="aspect-square bg-gradient-to-br from-blue-500/5 to-indigo-500/5 rounded-3xl border border-white/10 backdrop-blur-xl p-8">
                <div className="relative h-full">
                  {/* Network visualization would go here */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="grid grid-cols-3 gap-4 w-full">
                      {[...Array(9)].map((_, i) => (
                        <motion.div
                          key={i}
                          className="aspect-square rounded-2xl bg-white/5 border border-white/10"
                          animate={{
                            scale: [1, 1.1, 1],
                            opacity: [0.5, 1, 0.5],
                          }}
                          transition={{
                            duration: 3,
                            delay: i * 0.2,
                            repeat: Number.POSITIVE_INFINITY,
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-24 relative" id="pricing">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-[120px]" />
        </div>

        <div className="max-w-7xl mx-auto px-6 relative">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-3xl mx-auto mb-10"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 mb-6">
              <Crown className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-blue-400">Simple, Transparent Pricing</span>
            </div>
            
            <h2 className="text-4xl lg:text-5xl font-bold mb-4">
              Choose Your 
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">
                {" "}Intelligence Tier
              </span>
            </h2>
            
            <p className="text-lg text-slate-400">
              Scale your competitive intelligence capabilities with our flexible plans.
            </p>
          </motion.div>

          {/* Billing Toggle */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex items-center justify-center gap-3 mb-12"
          >
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ${
                billingCycle === 'monthly'
                  ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 flex items-center gap-2 ${
                billingCycle === 'annual'
                  ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Annual
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-full">
                Save 20%
              </span>
            </button>
          </motion.div>

          {/* Pricing Cards */}
          <div className="grid lg:grid-cols-3 gap-6 mb-16">
            {plans.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                onHoverStart={() => setSelectedPlan(plan.name)}
                onHoverEnd={() => setSelectedPlan(null)}
                className={`relative group ${plan.highlight ? 'lg:-mt-2 lg:mb-2' : ''}`}
              >
                {/* Highlight Glow */}
                {plan.highlight && (
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl opacity-20 group-hover:opacity-40 blur-md transition-all duration-500" />
                )}
                
                {/* Main Card */}
                <div className={`relative bg-white/5 backdrop-blur-xl rounded-2xl border ${
                  plan.highlight 
                    ? 'border-indigo-500/50 shadow-lg shadow-indigo-500/20' 
                    : 'border-white/10 group-hover:border-white/20'
                } p-6 h-full transition-all duration-300`}>
                  
                  {/* Popular Badge */}
                  {plan.highlight && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <div className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg shadow-purple-500/30">
                        MOST POPULAR
                      </div>
                    </div>
                  )}

                  {/* Plan Icon */}
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-r ${plan.gradient} p-2 mb-4`}>
                    <plan.icon className="w-full h-full text-white" />
                  </div>

                  {/* Plan Header */}
                  <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
                  <p className="text-slate-400 text-xs mb-4">{plan.description}</p>

                  {/* Price */}
                  <div className="mb-5">
                    <div className="flex items-end gap-1">
                      <span className="text-3xl font-bold">
                        ${billingCycle === 'monthly' ? plan.monthlyPrice : plan.annualPrice}
                      </span>
                      <span className="text-xs text-slate-400 mb-1">/mo</span>
                    </div>
                    {billingCycle === 'annual' && (
                      <p className="text-[10px] text-emerald-400 mt-1">
                        ${(plan.annualPrice * 12).toLocaleString()}/year
                      </p>
                    )}
                  </div>

                  {/* Features */}
                  <div className="space-y-2.5 mb-5">
                    {plan.features.map((feature) => (
                      <div key={feature.name} className="flex items-start gap-2">
                        <div className={`mt-0.5 ${
                          feature.included 
                            ? 'text-emerald-400' 
                            : 'text-slate-600'
                        }`}>
                          {feature.included ? (
                            <Check className="w-3.5 h-3.5" />
                          ) : (
                            <AlertCircle className="w-3.5 h-3.5" />
                          )}
                        </div>
                        <span className={`text-xs ${
                          feature.included 
                            ? 'text-slate-300' 
                            : 'text-slate-600'
                        }`}>
                          {feature.name}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* CTA Button */}
                  <Link to="/dashboard">
                    <Button 
                      className={`w-full py-3 text-sm rounded-lg font-semibold transition-all duration-300 ${
                        plan.highlight
                          ? 'bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white shadow-lg shadow-purple-500/25'
                          : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
                      }`}
                    >
                      Start Free Trial
                    </Button>
                  </Link>

                  {/* Trial Note */}
                  <p className="text-[10px] text-center text-slate-500 mt-3">
                    14-day trial • No credit card
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Enterprise Note */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-8 max-w-4xl mx-auto"
          >
            <Infinity className="w-8 h-8 text-blue-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-2">Need a Custom Enterprise Solution?</h3>
            <p className="text-sm text-slate-400 mb-5 max-w-2xl mx-auto">
              Get a tailored plan with custom SLAs, dedicated support, and enterprise-grade security features.
            </p>
            <Button size="default" variant="outline" className="border-white/10 hover:bg-white/5 px-6 py-4 text-sm rounded-lg">
              Contact Sales
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </motion.div>

          {/* FAQ Section */}
          <div className="mt-20">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-10"
            >
              <h3 className="text-2xl font-bold mb-2">Frequently Asked Questions</h3>
              <p className="text-sm text-slate-400">Everything you need to know about our pricing and plans</p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-4 max-w-4xl mx-auto">
              {faqs.map((faq, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-5 hover:border-white/20 transition-all duration-300"
                >
                  <div className="flex items-start gap-2">
                    <HelpCircle className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="text-sm font-semibold mb-1">{faq.question}</h4>
                      <p className="text-xs text-slate-400 leading-relaxed">{faq.answer}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative">
        <div className="absolute inset-0 bg-gradient-to-t from-blue-500/10 via-transparent to-transparent" />
        
        <div className="max-w-4xl mx-auto px-6 text-center relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <h2 className="text-4xl lg:text-5xl font-bold">
              Ready to Deploy Your
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
                Intelligence Network?
              </span>
            </h2>
            
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              Join 500+ strategic teams that never get surprised by competitor moves.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
              <Link to="/dashboard">
                <Button size="lg" className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-8 py-5 text-base rounded-xl shadow-xl shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300 group">
                  Start Free Trial
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="px-8 py-5 text-base rounded-xl border-white/10 hover:bg-white/5">
                Schedule Demo
              </Button>
            </div>
            
            <p className="text-xs text-slate-500">
              No credit card required • Cancel anytime • Enterprise-grade security
            </p>
          </motion.div>
        </div>
      </section>

      <Footer />

      {/* Chat Widget */}
      <ChatWidget />
    </div>
  );
}