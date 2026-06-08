/**
 * @file Multiplayer Settings Panel
 * @desc UI for room joining, role assignment, live chat, and round timer.
 */
'use client'

import { useState } from 'react'
import { audioManager } from '@/lib/audio'

interface MultiplayerPanelProps {
  activeRoomId: string | null
  onlineTimer: number | null
  mpMessages: string[]
  mpRole: 'usa' | 'ussr' | 'observer' | null
  onJoinRoom: (roomId: string, side: 'usa' | 'ussr' | 'observer') => void
  onLeaveRoom: () => void
  onSendChat: (text: string) => void
}

export function MultiplayerPanel({
  activeRoomId,
  onlineTimer,
  mpMessages,
  mpRole,
  onJoinRoom,
  onLeaveRoom,
  onSendChat,
}: MultiplayerPanelProps) {
  const [open, setOpen] = useState(true)
  const [roomId, setRoomId] = useState('')
  const [side, setSide] = useState<'usa' | 'ussr' | 'observer'>('usa')
  const [chatText, setChatText] = useState('')

  const handleJoin = () => {
    if (roomId.trim()) {
      onJoinRoom(roomId.trim(), side)
    }
  }

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault()
    if (chatText.trim()) {
      audioManager.playClick()
      onSendChat(chatText.trim())
      setChatText('')
    }
  }

  return (
    <div className="border-t-2 border-stone-400/60 bg-stone-100/50">
      <button
        onClick={() => { setOpen(!open); audioManager.playClick(); }}
        className="w-full p-2 text-[9px] text-stone-500 hover:text-stone-700 font-mono tracking-wider flex items-center justify-center gap-1 transition-colors"
      >
        {open ? '▼' : '▶'} 🌐 联机对战模式
      </button>

      {open && (
        <div className="p-3 text-[10px] space-y-3 border-t border-stone-300/50">
          {!activeRoomId ? (
            <div className="space-y-2">
              <div>
                <label className="block text-[8px] text-stone-400 uppercase font-mono mb-1">房间代号</label>
                <input
                  type="text"
                  placeholder="输入房间 ID..."
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-400 rounded-sm p-1.5 text-[10px] font-mono outline-none focus:border-stone-600"
                />
              </div>

              <div>
                <label className="block text-[8px] text-stone-400 uppercase font-mono mb-1">选择角色阵营</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setSide('usa'); audioManager.playClick(); }}
                    className={`flex-1 py-1 text-[9px] border rounded-sm font-mono transition-colors ${
                      side === 'usa' ? 'bg-blue-800 text-white border-blue-800' : 'bg-stone-50 text-stone-600 border-stone-300'
                    }`}
                  >
                    🇺🇸 美方
                  </button>
                  <button
                    onClick={() => { setSide('ussr'); audioManager.playClick(); }}
                    className={`flex-1 py-1 text-[9px] border rounded-sm font-mono transition-colors ${
                      side === 'ussr' ? 'bg-red-800 text-white border-red-800' : 'bg-stone-50 text-stone-600 border-stone-300'
                    }`}
                  >
                    🇷🇺 苏方
                  </button>
                  <button
                    onClick={() => { setSide('observer'); audioManager.playClick(); }}
                    className={`flex-1 py-1 text-[9px] border rounded-sm font-mono transition-colors ${
                      side === 'observer' ? 'bg-stone-700 text-white border-stone-700' : 'bg-stone-50 text-stone-600 border-stone-300'
                    }`}
                  >
                    👁 观察
                  </button>
                </div>
              </div>

              <button
                onClick={() => { handleJoin(); audioManager.playClick(); }}
                className="w-full py-1.5 bg-stone-700 text-stone-50 hover:bg-stone-800 rounded-sm font-mono text-[9px] tracking-wide font-bold"
              >
                连接房间 (支持本地 Mock 联机)
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              <div className="flex justify-between items-center text-[9px] font-mono border-b border-stone-300/40 pb-1.5">
                <span className="text-stone-500">房间: <span className="text-stone-800 font-bold">{activeRoomId}</span></span>
                <span className={`px-1.5 py-0.5 rounded-sm font-bold text-white uppercase text-[8px] ${
                  mpRole === 'usa' ? 'bg-blue-700' : mpRole === 'ussr' ? 'bg-red-700' : 'bg-stone-500'
                }`}>
                  {mpRole === 'usa' ? '🇺🇸 美方' : mpRole === 'ussr' ? '🇷🇺 苏方' : '👁 观察者'}
                </span>
              </div>

              {onlineTimer !== null && (
                <div className="flex justify-between items-center bg-stone-200/60 px-2 py-1 rounded-sm">
                  <span className="font-mono text-[9px] text-stone-500">本回合操作倒计时</span>
                  <span className={`font-mono text-xs font-bold ${onlineTimer < 15 ? 'text-red-600 animate-pulse' : 'text-stone-700'}`}>
                    ⏱ {onlineTimer} 秒
                  </span>
                </div>
              )}

              {/* Chat Log */}
              <div className="h-28 overflow-y-auto border border-stone-300 bg-stone-50 p-1.5 rounded-sm space-y-1.5 text-[9px] font-mono">
                {mpMessages.length === 0 ? (
                  <p className="text-stone-300 italic text-center mt-8">暂无联机聊天与系统消息</p>
                ) : (
                  mpMessages.map((msg, index) => (
                    <div key={index} className="leading-tight break-all border-b border-stone-200/30 pb-0.5">
                      {msg}
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={handleSendChat} className="flex gap-1.5">
                <input
                  type="text"
                  placeholder="发送信息给对手..."
                  value={chatText}
                  onChange={(e) => setChatText(e.target.value)}
                  className="flex-1 bg-stone-50 border border-stone-400 rounded-sm p-1 text-[9px] outline-none"
                />
                <button type="submit" className="px-2 py-1 bg-stone-700 hover:bg-stone-800 text-white rounded-sm text-[8px]">
                  发送
                </button>
              </form>

              <button
                onClick={() => { onLeaveRoom(); audioManager.playClick(); }}
                className="w-full py-1 bg-red-800/10 text-red-800 hover:bg-red-800/20 border border-red-800/25 rounded-sm font-mono text-[9px]"
              >
                断开联机连接
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
