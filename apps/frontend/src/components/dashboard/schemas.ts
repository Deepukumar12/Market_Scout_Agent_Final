
import { z } from "zod"

export const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
})

export type LoginSchema = z.infer<typeof loginSchema>

export const registerSchema = z.object({
    fullName: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(6),
    confirmPassword: z.string().min(6),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
})

export type RegisterSchema = z.infer<typeof registerSchema>
