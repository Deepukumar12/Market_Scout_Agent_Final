import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Link, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/Button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/Form"
import { Input } from "@/components/ui/Input"
import { 
  forgotPasswordSchema, 
  ForgotPasswordSchema, 
  resetPasswordSchema, 
  ResetPasswordSchema 
} from "@/components/dashboard/schemas"
import { forgotPassword, resetPassword } from "@/services/api"
import { motion, AnimatePresence } from "framer-motion"
import { Zap, Mail, Key, Lock, Shield, ArrowLeft, CheckCircle2 } from "lucide-react"

export default function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [stage, setStage] = useState<"request" | "reset" | "success">("request")
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const requestForm = useForm<ForgotPasswordSchema>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  })

  const resetForm = useForm<ResetPasswordSchema>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: "",
      token: "",
      newPassword: "",
      confirmPassword: "",
    },
  })

  async function onRequestSubmit(values: ForgotPasswordSchema) {
    setLoading(true)
    setError(null)
    try {
      await forgotPassword(values.email)
      setEmail(values.email)
      resetForm.setValue("email", values.email)
      setStage("reset")
    } catch (err: any) {
      console.error("Forgot password request failed:", err)
      setError(err.response?.data?.detail || "Request failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  async function onResetSubmit(values: ResetPasswordSchema) {
    setLoading(true)
    setError(null)
    try {
      await resetPassword({
        email: values.email,
        token: values.token,
        new_password: values.newPassword,
      })
      setStage("success")
    } catch (err: any) {
      console.error("Reset password failed:", err)
      setError(err.response?.data?.detail || "Reset failed. Please check your recovery code.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-sm mx-auto">
      <AnimatePresence mode="wait">
        {stage === "request" && (
          <motion.div
            key="request"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            <div className="text-center mb-12">
              <Link to="/login" className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#1D1D1F] dark:bg-white text-white dark:text-black shadow-apple-large mb-8 transition-transform hover:scale-105 active:scale-95 overflow-hidden">
                <Zap size={32} className="fill-current" />
              </Link>
              <h1 className="text-4xl font-bold tracking-tight text-[#1D1D1F] dark:text-white mb-3">Forgot key.</h1>
              <p className="text-sm font-medium text-[#6E6E73] dark:text-[#86868B]">Enter your email to receive a recovery code.</p>
            </div>

            <Form {...requestForm}>
              <form onSubmit={requestForm.handleSubmit(onRequestSubmit)} className="space-y-4">
                <FormField
                  control={requestForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem className="space-y-0">
                      <FormControl>
                        <div className="relative group">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#86868B] dark:text-[#A1A1A6] transition-colors group-focus-within:text-[#0071E3]" />
                          <Input 
                            placeholder="Email Address" 
                            {...field} 
                            className="bg-white dark:bg-white/5 border-[#E5E5EA] dark:border-white/10 text-[#1D1D1F] dark:text-white rounded-2xl h-14 pl-12 pr-5 font-medium transition-all focus:ring-4 focus:ring-[#0071E3]/10 focus:border-[#0071E3]" 
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-[10px] font-bold text-rose-500 mt-2 ml-2" />
                    </FormItem>
                  )}
                />

                {error && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 text-[11px] font-bold uppercase tracking-tight italic flex items-center gap-2"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                    {error}
                  </motion.div>
                )}

                <div className="pt-4">
                  <Button 
                    type="submit" 
                    className="w-full bg-[#0071E3] hover:bg-[#0077ED] text-white rounded-full h-14 font-black text-[12px] uppercase tracking-widest shadow-lg shadow-[#0071E3]/20 transition-all active:scale-95" 
                    disabled={loading}
                  >
                    {loading ? "Sending..." : "Send Code"}
                  </Button>
                </div>
              </form>
            </Form>

            <div className="mt-12 text-center">
              <Link to="/login" className="inline-flex items-center gap-2 text-sm font-bold text-[#6E6E73] hover:text-[#0071E3] transition-colors">
                <ArrowLeft size={16} /> Back to Sign in
              </Link>
            </div>
          </motion.div>
        )}

        {stage === "reset" && (
          <motion.div
            key="reset"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <div className="text-center mb-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#0071E3]/10 text-[#0071E3] mb-8">
                <Shield size={32} />
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-[#1D1D1F] dark:text-white mb-3">Reset key.</h1>
              <p className="text-sm font-medium text-[#6E6E73] dark:text-[#86868B]">Verify your code and enter a new access key.</p>
            </div>

            <Form {...resetForm}>
              <form onSubmit={resetForm.handleSubmit(onResetSubmit)} className="space-y-4">
                <FormField
                  control={resetForm.control}
                  name="token"
                  render={({ field }) => (
                    <FormItem className="space-y-0">
                      <FormControl>
                        <div className="relative group">
                          <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#86868B] dark:text-[#A1A1A6] transition-colors group-focus-within:text-[#0071E3]" />
                          <Input 
                            placeholder="6-Digit Reset Code" 
                            {...field} 
                            maxLength={6}
                            className="bg-white dark:bg-white/5 border-[#E5E5EA] dark:border-white/10 text-[#1D1D1F] dark:text-white rounded-2xl h-14 pl-12 pr-5 font-medium transition-all focus:ring-4 focus:ring-[#0071E3]/10 focus:border-[#0071E3] tracking-[0.2em]" 
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-[10px] font-bold text-rose-500 mt-2 ml-2" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={resetForm.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem className="space-y-0">
                      <FormControl>
                        <div className="relative group">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#86868B] dark:text-[#A1A1A6] transition-colors group-focus-within:text-[#0071E3]" />
                          <Input 
                            type="password"
                            placeholder="New Access Key" 
                            {...field} 
                            className="bg-white dark:bg-white/5 border-[#E5E5EA] dark:border-white/10 text-[#1D1D1F] dark:text-white rounded-2xl h-14 pl-12 pr-5 font-medium transition-all focus:ring-4 focus:ring-[#0071E3]/10 focus:border-[#0071E3]" 
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-[10px] font-bold text-rose-500 mt-2 ml-2" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={resetForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem className="space-y-0">
                      <FormControl>
                        <div className="relative group">
                          <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#86868B] dark:text-[#A1A1A6] transition-colors group-focus-within:text-[#0071E3]" />
                          <Input 
                            type="password"
                            placeholder="Verify Access Key" 
                            {...field} 
                            className="bg-white dark:bg-white/5 border-[#E5E5EA] dark:border-white/10 text-[#1D1D1F] dark:text-white rounded-2xl h-14 pl-12 pr-5 font-medium transition-all focus:ring-4 focus:ring-[#0071E3]/10 focus:border-[#0071E3]" 
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-[10px] font-bold text-rose-500 mt-2 ml-2" />
                    </FormItem>
                  )}
                />

                {error && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 text-[11px] font-bold uppercase tracking-tight italic flex items-center gap-2"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                    {error}
                  </motion.div>
                )}

                <div className="pt-4">
                  <Button 
                    type="submit" 
                    className="w-full bg-[#0071E3] hover:bg-[#0077ED] text-white rounded-full h-14 font-black text-[12px] uppercase tracking-widest shadow-lg shadow-[#0071E3]/20 transition-all active:scale-95" 
                    disabled={loading}
                  >
                    {loading ? "Resetting..." : "Reset Access Key"}
                  </Button>
                </div>
              </form>
            </Form>

            <div className="mt-12 text-center">
              <button 
                onClick={() => setStage("request")}
                className="inline-flex items-center gap-2 text-sm font-bold text-[#6E6E73] hover:text-[#0071E3] transition-colors"
              >
                <ArrowLeft size={16} /> Back to Request
              </button>
            </div>
          </motion.div>
        )}

        {stage === "success" && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="text-center"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-500 mb-8 animate-bounce">
              <CheckCircle2 size={32} />
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-[#1D1D1F] dark:text-white mb-3">Key Updated.</h1>
            <p className="text-sm font-medium text-[#6E6E73] dark:text-[#86868B] mb-8">Your security access protocols have been successfully synchronized.</p>
            
            <Link to="/login" className="inline-block w-full">
              <Button className="w-full bg-[#0071E3] hover:bg-[#0077ED] text-white rounded-full h-14 font-black text-[12px] uppercase tracking-widest shadow-lg shadow-[#0071E3]/20 transition-all active:scale-95">
                Sign in Now
              </Button>
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
