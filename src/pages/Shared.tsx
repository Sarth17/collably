import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { brandOf, camp, cr, useStore } from '../store'
import { Empty, PageHeader, fmtD, fmtT } from '../ui'

export function Messages() {
  const { s, a } = useStore()
  const ses = s.session!
  const [sp] = useSearchParams()
  const mine = s.collabs.filter(l => ['accepted', 'active', 'completed'].includes(l.status) && (ses.role === 'creator' ? l.creatorId === ses.userId : camp(s, l.campaignId).brandId === ses.userId))
  const [sel, setSel] = useState(sp.get('c') ?? mine[0]?.id ?? '')
  const [text, setText] = useState('')
  const msgs = s.messages.filter(m => m.collabId === sel)
  const send = () => { if (text.trim() && sel) { a.send(sel, text.trim()); setText('') } }
  return (
    <>
      <PageHeader title="Messages" />
      {mine.length ? (
        <div className="grid gap-4 md:grid-cols-[240px_1fr]">
          <div className="card p-2">
            {mine.map(x => { const k = camp(s, x.campaignId); return (
              <button key={x.id} onClick={() => setSel(x.id)} className={`block w-full rounded-lg p-2 text-left text-sm ${x.id === sel ? 'bg-accent/10' : ''}`}>
                <b>{ses.role === 'creator' ? brandOf(s, k).name : cr(s, x.creatorId).name}</b>
                <span className="block text-xs text-muted">{k.name}</span>
              </button>
            ) })}
          </div>
          <div className="card flex h-[28rem] flex-col">
            <div className="flex-1 space-y-2 overflow-y-auto">
              {msgs.length ? msgs.map(m => (
                <div key={m.id} className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${m.from === ses.role ? 'ml-auto bg-accent text-white' : 'bg-stone-100'}`}>
                  {m.text}<div className="mt-1 text-[10px] opacity-70">{fmtT(m.at)}</div>
                </div>
              )) : <Empty text="No messages yet. Say hello." />}
            </div>
            <div className="mt-3 flex gap-2">
              <input aria-label="Message" className="input" placeholder="Write a message" value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} />
              <button className="btn btn-p" onClick={send}>Send</button>
            </div>
          </div>
        </div>
      ) : <Empty text="Conversations open once a creator accepts an invitation." />}
    </>
  )
}

export function Notifications() {
  const { s, a } = useStore()
  const nav = useNavigate()
  const me = s.session!.userId
  const list = s.notifications.filter(n => n.to === me)
  return (
    <>
      <PageHeader title="Notifications" action={<button className="btn" disabled={!list.some(n => !n.read)} onClick={() => a.readAll(me)}>Mark all as read</button>} />
      {list.length ? list.map(n => (
        <button key={n.id} onClick={() => { a.read(n.id); nav(n.link) }} className={`card mb-2 block w-full text-left text-sm ${n.read ? '' : 'border-accent'}`}>
          {!n.read && <span aria-label="Unread" className="mr-2 inline-block h-2 w-2 rounded-full bg-accent" />}
          {n.text}<span className="ml-2 text-xs text-muted">{fmtD(n.at)}</span>
        </button>
      )) : <Empty text="You are all caught up." />}
    </>
  )
}
