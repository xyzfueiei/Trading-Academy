import { useEffect, useMemo, useState } from 'react'
import { Check, Clipboard, ExternalLink, ShieldCheck } from 'lucide-react'
import SiteNav from '../components/SiteNav'
import { useAuth } from '../context/AuthContext'
import { Alert, Button, EmptyState, Spinner } from '../components/ui'
import { getPaymentMethods } from '../lib/api'
import { supabase } from '../lib/supabase'

const REQUIRED_AMOUNT_USDT = 10

export default function Payment() {
  const { user, profile } = useAuth()
  const [methods, setMethods] = useState([])
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState(null)
  const [form, setForm] = useState({ txid: '' })
  const [copiedMethodId, setCopiedMethodId] = useState(null)

  useEffect(() => {
    let active = true
    getPaymentMethods()
      .then((data) => {
        if (!active) return
        setMethods(data)
        setSelected(data[0] || null)
      })
      .catch((error) => {
        if (active) setMessage({ tone: 'error', text: error.message || 'Unable to load payment methods.' })
      })
      .finally(() => active && setLoading(false))
    return () => { active = false }
  }, [])

  const accessLabel = useMemo(() => profile?.payment_status || 'pending', [profile?.payment_status])

  async function copyWallet(method = selected) {
    const address = method?.wallet_address || ''
    if (!address) return
    try {
      await navigator.clipboard.writeText(address)
      setCopiedMethodId(method.id)
      window.setTimeout(() => setCopiedMethodId(null), 1800)
    } catch {
      setMessage({ tone: 'info', text: 'Copy was not available in this browser. Select the wallet address and copy it manually.' })
    }
  }

  async function submit(event) {
    event.preventDefault()
    setMessage(null)

    const txid = form.txid.trim()
    if (!selected) return setMessage({ tone: 'error', text: 'No active payment method is available right now.' })
    if (txid.length < 8 || txid.length > 256) return setMessage({ tone: 'error', text: 'Enter a valid transaction ID/TXID.' })

    setBusy(true)

    // `network` is not a column in the existing payments table. Keep the
    // selected payment method through payment_method_id when that column is
    // available, with a compatibility fallback for older schemas.
    const payload = {
      user_id: user.id,
      payment_method_id: selected.id,
      amount: REQUIRED_AMOUNT_USDT,
      txid,
      status: 'pending',
    }

    let result = await supabase.from('payments').insert(payload)
    if (result.error && /payment_method_id.*does not exist|column.*payment_method_id|payment_method_id/i.test(result.error.message || '')) {
      const fallbackPayload = { ...payload }
      delete fallbackPayload.payment_method_id
      result = await supabase.from('payments').insert(fallbackPayload)
    }
    setBusy(false)

    if (result.error) {
      setMessage({ tone: 'error', text: result.error.message })
      return
    }

    setForm({ txid: '' })
    setMessage({ tone: 'success', text: `Payment submitted for review: ${REQUIRED_AMOUNT_USDT} USDT via ${selected.network_name}. Access will change only after an authorized administrator approves the payment.` })
  }

  return <div className="app-shell">
    <SiteNav light />
    <main className="page-light">
      <div className="container page-head">
        <span className="eyebrow">Access request</span>
        <h1>Unlock your library.</h1>
        <p>Submit a USDT payment using an active network below. Your transaction stays pending until it is reviewed by an authorized administrator.</p>
      </div>

      <div className="container payment-layout">
        <aside className="payment-intro">
          <ShieldCheck size={21} color="var(--lime)" />
          <h2>Clear steps. No false promises.</h2>
          <p>Trading Academy does not claim to verify blockchain transactions automatically. This is a manual review workflow designed to keep payment status explicit.</p>
          <div className="payment-steps">
            <div className="payment-step"><b>01</b><span>Choose a network and send the exact amount.</span></div>
            <div className="payment-step"><b>02</b><span>Submit the TXID below after sending the exact amount.</span></div>
            <div className="payment-step"><b>03</b><span>Wait for admin review before content access changes.</span></div>
          </div>
          <div className="access-status"><span>Current access</span><strong>{accessLabel}</strong></div>
        </aside>

        <section className="payment-card">
          <h2 className="panel-title">Choose your payment network</h2>
          <p className="panel-subtitle">USDT only · choose the exact network you will use to send the payment</p>

          {loading ? <div className="empty-state"><Spinner /><p>Loading payment methods…</p></div> : methods.length ? <div className="payment-method-list">
            {methods.map((method) => {
              const active = selected?.id === method.id
              return <div key={method.id} className={`payment-method ${active ? 'selected' : ''}`}>
                <button type="button" className="payment-method-main" onClick={() => setSelected(method)} aria-pressed={active}>
                  <span className="method-select-indicator" aria-hidden="true">{active ? '✓' : ''}</span>
                  <span className="method-network"><span className="token-symbol">₮</span><span><strong>{method.token_name || 'USDT'}</strong><small>{method.network_name}</small></span></span>
                </button>
                <span className="wallet-line"><span className="wallet">{method.wallet_address || 'Wallet address unavailable'}</span>{method.wallet_address && <button className="copy-btn" type="button" aria-label={`Copy ${method.network_name || ''} wallet address`.trim()} onClick={() => copyWallet(method)}>{copiedMethodId === method.id ? <Check size={14} /> : <Clipboard size={14} />}</button>}</span>
              </div>
            })}
          </div> : <EmptyState title="No active methods" body="An administrator has not published a payment method yet." />}

          {message && <Alert tone={message.tone}>{message.text}</Alert>}

          {methods.length > 0 && <form className="payment-form" onSubmit={submit}>
            <div className="payment-amount-box">
              <div>
                <span>Required payment</span>
                <strong>$10</strong>
              </div>
              <div className="payment-amount-usdt">
                <span>Send exactly</span>
                <strong>{REQUIRED_AMOUNT_USDT} USDT</strong>
              </div>
            </div>
            <div className="payment-selection-note">
              <span>Selected network</span>
              <strong>{selected?.network_name || 'Choose a network above'}</strong>
            </div>
            <label className="field"><span>Transaction ID / TXID</span><input required maxLength={256} placeholder="Paste the transaction hash" value={form.txid} onChange={(event) => setForm({ ...form, txid: event.target.value })} /><small>Submit the TXID after sending exactly {REQUIRED_AMOUNT_USDT} USDT to the wallet shown for your selected network. Stored as pending until manual review.</small></label>
            <Button type="submit" size="lg" disabled={busy || !selected}>{busy ? 'Submitting for review…' : <>Submit payment for review <ExternalLink size={14} /></>}</Button>
          </form>}
        </section>
      </div>
    </main>
  </div>
}
