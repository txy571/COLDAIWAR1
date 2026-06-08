/**
 * @file Annual Newspaper Overlay Modal Component
 * @desc Renders the AI annual newspaper with era-specific visual styling:
 *       - POST_WW2: Vintage sepia newsprint, double columns, serif fonts.
 *       - IRON_CURTAIN: Monospace teletype green terminal screen.
 *       - INFO_AGE: Neon cyberpunk holographic digital bulletin board.
 *       Includes teleprinter typing animation effect and loading skeleton.
 */
'use client'

import { useState, useEffect } from 'react'
import type { Newspaper } from '@/types'
import { audioManager } from '@/lib/audio'

interface NewspaperModalProps {
  newspaper: Newspaper | null // if null, indicates "generating" loading state
  onClose: () => void
  year: number
  era: 'POST_WW2' | 'IRON_CURTAIN' | 'INFO_AGE'
}

export function NewspaperModal({ newspaper, onClose, year, era }: NewspaperModalProps) {
  const [typedContent, setTypedContent] = useState('')
  const [typingDone, setTypingDone] = useState(false)

  // Telex typing effect for Era II
  useEffect(() => {
    if (!newspaper) {
      setTypedContent('')
      setTypingDone(false)
      return
    }

    if (era !== 'IRON_CURTAIN') {
      setTypedContent(newspaper.content)
      setTypingDone(true)
      return
    }

    // Type content slowly for Telex feel
    let idx = 0
    const fullText = newspaper.content
    setTypedContent('')
    setTypingDone(false)

    // Play teleprinter ticker sounds periodically
    const soundInterval = setInterval(() => {
      audioManager.playTick()
    }, 180)

    const timer = setInterval(() => {
      idx += 3 // type 3 chars at a time for speed
      if (idx >= fullText.length) {
        setTypedContent(fullText)
        setTypingDone(true)
        clearInterval(timer)
        clearInterval(soundInterval)
      } else {
        setTypedContent(fullText.substring(0, idx))
      }
    }, 25)

    return () => {
      clearInterval(timer)
      clearInterval(soundInterval)
    }
  }, [newspaper, era])

  const handleClose = () => {
    audioManager.playClick()
    onClose()
  }

  // Render Loading / Generating State
  if (!newspaper) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 font-serif p-4">
        <div className={`w-full max-w-2xl min-h-[400px] border-4 flex flex-col justify-center items-center rounded-sm ${
          era === 'POST_WW2' ? 'bg-[#f4ebd0] border-[#5c4d3c] text-[#3c2f2f]' :
          era === 'IRON_CURTAIN' ? 'bg-stone-950 border-emerald-500 text-emerald-500 font-mono' :
          'cyber-glass border-cyan-500 text-cyan-400 font-sans'
        }`}>
          {era === 'POST_WW2' && (
            <div className="text-center p-8 space-y-4">
              <div className="text-5xl animate-bounce">📰</div>
              <h2 className="text-2xl font-bold tracking-widest font-serif border-b border-[#5c4d3c] pb-2">全球时报 · 特刊印制中</h2>
              <p className="text-xs text-stone-600 italic">“正在汇总 ${year - 1} 年地缘政治重大情报，排版印制头版社论...”</p>
              <div className="w-48 h-1 bg-[#5c4d3c]/20 mx-auto rounded overflow-hidden">
                <div className="h-full bg-[#5c4d3c] animate-[loading_1.5s_infinite]" style={{ width: '40%' }} />
              </div>
            </div>
          )}

          {era === 'IRON_CURTAIN' && (
            <div className="p-8 space-y-4 font-mono text-xs w-full max-w-md">
              <div className="flex justify-between border-b border-emerald-500/30 pb-2">
                <span>[TELEX-NET: ACTIVE]</span>
                <span className="animate-pulse">● LOGGING</span>
              </div>
              <div className="space-y-1 mt-4">
                <p>&gt; CONNECTING TO D-INTELLIGENCE DATABASE...</p>
                <p>&gt; RETRIEVING ACTION LOGS FOR YEAR {year - 1}...</p>
                <p className="animate-pulse">&gt; COMPILING NATIONAL RETROSPECTIVE BULLETIN...</p>
              </div>
              <div className="h-2 bg-emerald-950 border border-emerald-800 rounded overflow-hidden mt-6">
                <div className="h-full bg-emerald-500 animate-[loading_1.2s_infinite]" style={{ width: '30%' }} />
              </div>
            </div>
          )}

          {era === 'INFO_AGE' && (
            <div className="text-center p-8 space-y-5">
              <div className="relative w-12 h-12 mx-auto">
                <div className="absolute inset-0 border-4 border-cyan-500/20 rounded-full" />
                <div className="absolute inset-0 border-4 border-t-cyan-400 rounded-full animate-spin" />
              </div>
              <h2 className="text-xl font-bold tracking-wider uppercase text-cyan-400 font-mono">
                &lt; HOLOGRAPHIC FEED GENERATOR &gt;
              </h2>
              <p className="text-[10px] text-cyan-500/75 font-mono">
                SECURE LOGS COMPILED FOR GEOPOLITICAL INTERVAL: {year - 1}
              </p>
              <div className="text-[9px] text-cyan-300 font-mono tracking-widest animate-pulse">
                DECRYPTING ENCRYPTED SATELLITE EDITORIAL DATA...
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-6 overflow-y-auto">
      {/* WW2 Era - Vintage Newspaper */}
      {era === 'POST_WW2' && (
        <div className="w-full max-w-2xl bg-[#f5efe0] border-8 border-double border-[#4a3f35] rounded-sm text-[#2b241e] shadow-2xl p-5 sm:p-8 font-serif select-text max-h-[95vh] overflow-y-auto">
          {/* Header Banner */}
          <div className="text-center border-b-4 border-black pb-4">
            <div className="text-xs tracking-[0.3em] font-bold uppercase mb-1">★★★★★ THE TRANSNATIONAL GAZETTE ★★★★★</div>
            <h1 className="text-4xl sm:text-5xl font-black uppercase tracking-wider font-serif my-2 leading-none">
              全球时局年报
            </h1>
            <div className="flex justify-between items-center text-[10px] font-bold border-t border-b border-[#4a3f35] py-1 mt-3">
              <span>公元 {newspaper.year + 1} 年元旦特刊</span>
              <span>第 {newspaper.year - 1944} 期</span>
              <span>定价：五美分 / 拾里拉</span>
            </div>
          </div>

          {/* Subheading / Big headline */}
          <div className="my-6 text-center">
            <h2 className="text-xl sm:text-2xl font-black italic leading-tight text-[#422c1b]">
              “{newspaper.headline}”
            </h2>
          </div>

          {/* Double Column Content */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs leading-relaxed border-t border-[#4a3f35] pt-4 text-justify">
            <div className="first-letter:text-4xl first-letter:font-black first-letter:float-left first-letter:mr-2 first-letter:text-[#422c1b]">
              {newspaper.content.split('\n\n')[0]}
            </div>
            <div className="space-y-4">
              {newspaper.content.split('\n\n').slice(1).map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          </div>

          {/* Bottom Controls */}
          <div className="mt-8 pt-4 border-t-2 border-black flex justify-center">
            <button
              onClick={handleClose}
              className="px-6 py-2 bg-[#4a3f35] hover:bg-black text-[#f5efe0] font-bold text-xs rounded-sm transition-colors tracking-widest uppercase border border-black"
            >
              关闭报纸 · 开启 {newspaper.year + 1} 年局势
            </button>
          </div>
        </div>
      )}

      {/* CRT Era - Telex Grid Terminal */}
      {era === 'IRON_CURTAIN' && (
        <div className="w-full max-w-2xl bg-stone-950 border-4 border-emerald-500/80 rounded-sm text-emerald-400 font-mono shadow-2xl p-4 sm:p-6 select-text max-h-[90vh] overflow-y-auto relative crt-grid">
          {/* Scanline overlay */}
          <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[size:100%_4px,3px_100%] opacity-40" />

          {/* Teletype Header */}
          <div className="border-b-2 border-emerald-500 pb-3 mb-4 text-xs">
            <div className="flex justify-between">
              <span>[SECURE-LINE: REG-99-RETRO]</span>
              <span>YEAR-END WRAP-UP // {newspaper.year}</span>
            </div>
            <h1 className="text-xl font-bold tracking-widest uppercase mt-2 text-emerald-300">
              NATIONAL RETROSPECTIVE BULLETIN
            </h1>
          </div>

          {/* Headline */}
          <div className="bg-emerald-950/40 border border-emerald-800 p-2.5 rounded-sm mb-4">
            <span className="text-stone-500 font-bold block text-[9px]">SUBJECT //</span>
            <h2 className="text-sm sm:text-base font-bold text-emerald-300 uppercase leading-snug">
              &gt; {newspaper.headline}
            </h2>
          </div>

          {/* Typed Content Box */}
          <div className="text-[11px] sm:text-xs leading-relaxed whitespace-pre-wrap min-h-[220px] bg-black/60 p-4 border border-emerald-900/60 rounded-sm font-mono text-justify">
            {typedContent}
            {!typingDone && <span className="animate-pulse bg-emerald-400 text-emerald-400 ml-1">_</span>}
          </div>

          {/* Telex metadata */}
          <div className="mt-4 text-[9px] text-emerald-600 flex justify-between font-mono">
            <span>DECRYPTION PROTOCOL: AES-256-TELETYPE</span>
            <span>STATUS: {typingDone ? 'COMPLETED' : 'RECEIVING DATA...'}</span>
          </div>

          {/* Bottom Controls */}
          <div className="mt-6 pt-3 border-t border-emerald-800 flex justify-end">
            <button
              onClick={handleClose}
              disabled={!typingDone}
              className="px-5 py-1.5 bg-emerald-800 hover:bg-emerald-700 disabled:opacity-40 disabled:hover:bg-emerald-800 text-stone-900 font-bold text-xs rounded-sm tracking-wider uppercase transition-colors"
            >
              CONFIRM & RUN YEAR {newspaper.year + 1}
            </button>
          </div>
        </div>
      )}

      {/* Cyber Era - Holo-feed */}
      {era === 'INFO_AGE' && (
        <div className="w-full max-w-2xl cyber-glass border-2 border-cyan-500/80 rounded-md text-cyan-100 shadow-2xl p-5 sm:p-7 select-text max-h-[90vh] overflow-y-auto font-sans relative">
          {/* Header */}
          <div className="flex justify-between items-start border-b border-cyan-500/40 pb-3 mb-5">
            <div>
              <div className="text-[8px] font-mono tracking-widest text-cyan-400 uppercase">Holographic Broadcast Feed</div>
              <h1 className="text-2xl font-black tracking-wider uppercase text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-400 font-mono">
                GEOPOLITICAL LOG // {newspaper.year}
              </h1>
            </div>
            <div className="text-right font-mono text-[9px] text-cyan-500">
              <div>STABILITY: LOCKED</div>
              <div>INTERVAL: {newspaper.year + 1}-01-01</div>
            </div>
          </div>

          {/* Headline */}
          <div className="relative border-l-4 border-fuchsia-500 bg-fuchsia-950/20 p-3 rounded-r-md mb-5">
            <span className="text-[8px] font-mono uppercase text-fuchsia-400 tracking-wider">Top Headline //</span>
            <h2 className="text-base sm:text-lg font-bold text-white font-mono leading-tight">
              {newspaper.headline}
            </h2>
          </div>

          {/* Content */}
          <div className="text-xs sm:text-sm leading-relaxed space-y-4 text-justify font-sans text-cyan-100/90 select-text bg-cyan-950/10 p-4 rounded-md border border-cyan-900/40">
            {newspaper.content.split('\n\n').map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>

          {/* Bottom Info */}
          <div className="mt-6 pt-4 border-t border-cyan-900/60 flex items-center justify-between">
            <div className="text-[8px] text-cyan-500/70 font-mono">
              ENCRYPTION KEY: SH-256-DYNAMICS // FEED: SYNCED
            </div>
            <button
              onClick={handleClose}
              className="px-5 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs rounded-sm tracking-wider uppercase font-mono shadow-md shadow-cyan-500/20 hover:scale-105 active:scale-95 transition-all"
            >
              NEXT YEAR &gt;&gt;
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
