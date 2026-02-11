
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Link, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { loginSchema, LoginSchema } from "./schemas"
import { useAuthStore } from "@/store/authStore"

export function LoginForm() {
  const navigate = useNavigate()
  const { login, loading, error } = useAuthStore()
  
  const form = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  async function onSubmit(values: LoginSchema) {
    await login(values.email, values.password)
    // On success redirect handled or here
    if (!useAuthStore.getState().error) {
       navigate("/dashboard")
    }
  }

  return (
    <div className="w-full max-w-md p-8 bg-black/50 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
          Welcome Back
        </h1>
        <p className="text-gray-400">Sign in to access your intelligence console</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="analyst@scoutiq.ai" {...field} className="bg-white/5 border-white/10 text-white" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input type="password" {...field} className="bg-white/5 border-white/10 text-white" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {error && <div className="text-red-500 text-sm">{error}</div>}

          <Button type="submit" variant="neon" className="w-full" disabled={loading}>
            {loading ? "Authenticating..." : "Sign In"}
          </Button>
          
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-black/50 px-2 text-gray-400">Or continue with</span>
            </div>
          </div>

          <Button 
            type="button" 
            variant="outline" 
            className="w-full border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10 hover:text-cyan-300"
            onClick={() => {
                form.setValue("email", "demo@scoutiq.ai");
                form.setValue("password", "demo123");
                form.handleSubmit(onSubmit)();
            }}
            disabled={loading}
          >
            Run Demo Agent
          </Button>
        </form>
      </Form>
      
      <div className="mt-6 text-center text-sm text-gray-500">
        Don't have an account? <Link to="/register" className="text-cyan-400 hover:underline">Request Access</Link>
      </div>
    </div>
  )
}
