import type { ComponentType } from 'react'
import { template as orderCustomer } from './order-customer'
import { template as orderOwner } from './order-owner'
import { template as bookingCustomer } from './booking-customer'
import { template as bookingOwner } from './booking-owner'
import { template as dailyDigest } from './daily-digest'

export interface TemplateEntry {
  component: ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  displayName?: string
  previewData?: Record<string, any>
  /** Fixed recipient — overrides caller-provided recipientEmail when set. */
  to?: string
}

/**
 * Template registry — maps template names to their React Email components.
 * Import and register new templates here after creating them in this directory.
 */
export const TEMPLATES: Record<string, TemplateEntry> = {
  'order-customer': orderCustomer,
  'order-owner': orderOwner,
  'booking-customer': bookingCustomer,
  'booking-owner': bookingOwner,
  'daily-digest': dailyDigest,
}
