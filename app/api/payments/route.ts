import { NextResponse } from 'next/server'
import { getLoanStatus } from '@/lib/loanStatus'
import { createServerSupabase } from '@/lib/supabaseServer'

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabase()
    const body = await request.json()
    const { loan_id, amount, payment_date, notes } = body as {
      loan_id: string
      amount: number
      payment_date: string
      notes?: string | null
    }
    if (!loan_id || amount == null || !payment_date) {
      return NextResponse.json(
        { error: 'loan_id, amount and payment_date are required' },
        { status: 400 }
      )
    }

    const { data: loan, error: loanError } = await supabase
      .from('loans')
      .select('remaining_balance, total_amount, due_date')
      .eq('id', loan_id)
      .single()

    if (loanError || !loan) {
      return NextResponse.json({ error: 'Loan not found' }, { status: 404 })
    }

    const currentBalance = Number((loan as { remaining_balance: number }).remaining_balance)
    if (amount <= 0 || amount > currentBalance) {
      return NextResponse.json(
        { error: 'Invalid payment amount' },
        { status: 400 }
      )
    }

    const typedLoan = loan as { remaining_balance: number; due_date: string }
    const newBalance = Math.round((currentBalance - amount) * 100) / 100
    const status = getLoanStatus({
      status: 'active',
      due_date: typedLoan.due_date,
      remaining_balance: newBalance,
    })

    // @ts-expect-error - Supabase client insert infers never with current typings
    const { error: insertError } = await supabase.from('payments').insert({
      loan_id,
      amount,
      payment_date,
      notes: notes ?? null,
    })

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    // @ts-expect-error - Supabase client update infers never with current typings
    const { error: updateError } = await supabase.from('loans').update({
      remaining_balance: newBalance,
      status,
    }).eq('id', loan_id)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Server error' },
      { status: 500 }
    )
  }
}
