import { NextResponse } from 'next/server'
import { getLoanStatus } from '@/lib/loanStatus'
import { createServerSupabase } from '@/lib/supabaseServer'

async function recalculateLoanBalance(supabase: Awaited<ReturnType<typeof createServerSupabase>>, loanId: string) {
  const [{ data: loan, error: loanError }, { data: paymentRows, error: paymentsError }] = await Promise.all([
    supabase.from('loans').select('id, total_amount, due_date').eq('id', loanId).single(),
    supabase.from('payments').select('amount').eq('loan_id', loanId),
  ])

  if (loanError || !loan) {
    throw new Error('Loan not found')
  }
  if (paymentsError) {
    throw new Error(paymentsError.message)
  }

  const paidTotal = ((paymentRows as { amount: number }[] | null) ?? []).reduce(
    (sum, row) => sum + Number(row.amount),
    0
  )
  const totalAmount = Number((loan as { total_amount: number }).total_amount)
  const newBalance = Math.max(0, Math.round((totalAmount - paidTotal) * 100) / 100)
  const typedLoan = loan as { due_date: string }
  const status = getLoanStatus({
    status: 'active',
    due_date: typedLoan.due_date,
    remaining_balance: newBalance,
  })

  const { error: updateError } = await supabase
    .from('loans')
    .update({
      remaining_balance: newBalance,
      status,
    } as never)
    .eq('id', loanId)

  if (updateError) {
    throw new Error(updateError.message)
  }
}

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

    const { error: insertError } = await supabase.from('payments').insert({
      loan_id,
      amount,
      payment_date,
      notes: notes ?? null,
    } as never)

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    const { error: updateError } = await supabase.from('loans').update({
      remaining_balance: newBalance,
      status,
    } as never).eq('id', loan_id)

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

export async function PATCH(request: Request) {
  try {
    const supabase = await createServerSupabase()
    const body = await request.json()
    const { payment_id, amount, payment_date, notes } = body as {
      payment_id: string
      amount: number
      payment_date: string
      notes?: string | null
    }

    if (!payment_id || amount == null || !payment_date || amount <= 0) {
      return NextResponse.json({ error: 'payment_id, amount and payment_date are required' }, { status: 400 })
    }

    const { data: existingPayment, error: paymentError } = await supabase
      .from('payments')
      .select('id, loan_id')
      .eq('id', payment_id)
      .single()

    if (paymentError || !existingPayment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    const { error: updatePaymentError } = await supabase
      .from('payments')
      .update({
        amount,
        payment_date,
        notes: notes ?? null,
      } as never)
      .eq('id', payment_id)

    if (updatePaymentError) {
      return NextResponse.json({ error: updatePaymentError.message }, { status: 500 })
    }

    await recalculateLoanBalance(supabase, (existingPayment as { loan_id: string }).loan_id)

    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createServerSupabase()
    const body = await request.json()
    const { payment_id } = body as { payment_id: string }

    if (!payment_id) {
      return NextResponse.json({ error: 'payment_id is required' }, { status: 400 })
    }

    const { data: existingPayment, error: paymentError } = await supabase
      .from('payments')
      .select('id, loan_id')
      .eq('id', payment_id)
      .single()

    if (paymentError || !existingPayment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    const loanId = (existingPayment as { loan_id: string }).loan_id
    const { error: deleteError } = await supabase.from('payments').delete().eq('id', payment_id)
    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    await recalculateLoanBalance(supabase, loanId)

    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Server error' },
      { status: 500 }
    )
  }
}
