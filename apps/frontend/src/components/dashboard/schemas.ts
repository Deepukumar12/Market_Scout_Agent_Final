
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

export const forgotPasswordSchema = z.object({
    email: z.string().email({ message: "Please enter a valid email address" }),
})

export type ForgotPasswordSchema = z.infer<typeof forgotPasswordSchema>

export const resetPasswordSchema = z.object({
    email: z.string().email({ message: "Please enter a valid email address" }),
    token: z.string().min(6, { message: "Reset code must be 6 digits" }).max(6, { message: "Reset code must be 6 digits" }),
    newPassword: z.string().min(8, { message: "Access key must be at least 8 characters" }),
    confirmPassword: z.string().min(8, { message: "Verify access key must be at least 8 characters" }),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
})

export type ResetPasswordSchema = z.infer<typeof resetPasswordSchema>

