import { z } from "zod"

export const subscriptionSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(100),
  description: z.string().max(500).optional(),
  price: z
    .number({ message: "Preço inválido" })
    .int()
    .positive(),
  billingCycle: z.enum(["weekly", "monthly", "quarterly", "semiannual", "annual"]),
  nextPaymentDate: z.string().min(1, "Data do próximo pagamento é obrigatória"),
  category: z.string().min(1, "Categoria é obrigatória"),
  imageUrl: z.string().url("URL inválida").optional().or(z.literal("")),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Cor inválida")
    .optional(),
  isActive: z.boolean().optional().default(true),
  notes: z.string().max(1000).optional(),
  tags: z
    .array(z.string().max(30).transform((t) => t.trim().toLowerCase()))
    .max(10)
    .optional(),
})

export const updateSubscriptionSchema = subscriptionSchema.partial()

export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Senha é obrigatória"),
})

export const imageHistorySchema = z.object({
  url: z.string().url("URL inválida"),
  label: z.string().max(100).optional(),
})

export const paymentSchema = z.object({
  subscriptionId: z.string().min(1, "ID da assinatura é obrigatório"),
  paidAt: z.string().min(1, "Data do pagamento é obrigatória"),
  notes: z.string().max(200).optional(),
})

export const alertSettingsSchema = z.object({
  featureEnabled: z.boolean(),
  enabled: z.boolean(),
  daysBefore: z.number().int().min(1).max(30),
  recipients: z.array(z.string().email("Email inválido")).max(10),
  fromName: z.string().min(1).max(50),
  fromUser: z
    .string()
    .max(64)
    .regex(/^[^@\s]*$/, "Não pode conter @ ou espaços"),
  fromDomain: z.string().max(253),
})

export const updateAlertSettingsSchema = alertSettingsSchema.partial()
