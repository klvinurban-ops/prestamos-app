export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      clients: {
        Row: {
          id: string
          name: string
          phone: string | null
          document: string | null
          address: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          phone?: string | null
          document?: string | null
          address?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          phone?: string | null
          document?: string | null
          address?: string | null
          notes?: string | null
          created_at?: string
        }
      }
      loans: {
        Row: {
          id: string
          client_id: string
          amount: number
          interest_rate: number
          total_amount: number
          remaining_balance: number
          start_date: string
          due_date: string
          payment_frequency: 'monthly' | 'biweekly'
          installments_count: number
          status: 'active' | 'paid' | 'overdue'
          created_at: string
        }
        Insert: {
          id?: string
          client_id: string
          amount: number
          interest_rate: number
          total_amount: number
          remaining_balance: number
          start_date: string
          due_date: string
          payment_frequency?: 'monthly' | 'biweekly'
          installments_count?: number
          status?: 'active' | 'paid' | 'overdue'
          created_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          amount?: number
          interest_rate?: number
          total_amount?: number
          remaining_balance?: number
          start_date?: string
          due_date?: string
          payment_frequency?: 'monthly' | 'biweekly'
          installments_count?: number
          status?: 'active' | 'paid' | 'overdue'
          created_at?: string
        }
      }
      payments: {
        Row: {
          id: string
          loan_id: string
          amount: number
          payment_date: string
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          loan_id: string
          amount: number
          payment_date: string
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          loan_id?: string
          amount?: number
          payment_date?: string
          notes?: string | null
          created_at?: string
        }
      }
    }
  }
}

export type PaymentFrequency = Database['public']['Tables']['loans']['Row']['payment_frequency']
export type Client = Database['public']['Tables']['clients']['Row']
export type Loan = Database['public']['Tables']['loans']['Row']
export type Payment = Database['public']['Tables']['payments']['Row']

export type ClientInsert = Database['public']['Tables']['clients']['Insert']
export type ClientUpdate = Database['public']['Tables']['clients']['Update']
export type LoanInsert = Database['public']['Tables']['loans']['Insert']
export type PaymentInsert = Database['public']['Tables']['payments']['Insert']
