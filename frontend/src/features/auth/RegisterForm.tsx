
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
import { registerSchema, RegisterSchema } from "./schemas"
import { useAuthStore } from "@/store/authStore"

export function RegisterForm() {
    const navigate = useNavigate()
    const { register, loading, error } = useAuthStore()

    const form = useForm<RegisterSchema>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            fullName: "",
            email: "",
            password: "",
            confirmPassword: "",
        },
    })

    async function onSubmit(values: RegisterSchema) {
        await register({
            email: values.email,
            password: values.password,
            full_name: values.fullName
        })
        if (!useAuthStore.getState().error) {
            navigate("/dashboard") // Or login page if email verify needed
        }
    }

    return (
        <div className="w-full max-w-md p-8 bg-black/50 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
          Create Account
        </h1>
        <p className="text-gray-400">Join the elite intelligence network</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input placeholder="John Doe" {...field} className="bg-white/5 border-white/10 text-white" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
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
           <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm Password</FormLabel>
                <FormControl>
                  <Input type="password" {...field} className="bg-white/5 border-white/10 text-white" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {error && <div className="text-red-500 text-sm">{error}</div>}

          <Button type="submit" variant="neon" className="w-full mt-2" disabled={loading}>
            {loading ? "Creating Account..." : "Register"}
          </Button>
        </form>
      </Form>
      
      <div className="mt-6 text-center text-sm text-gray-500">
        Already have an account? <Link to="/login" className="text-cyan-400 hover:underline">Log in</Link>
      </div>
    </div>
    )
}
