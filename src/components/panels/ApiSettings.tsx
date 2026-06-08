/**
 * @file AI裁判 与 联机服务器设置
 * @desc OpenAI/Anthropic 切换，API Key 与 Cloudflare Worker 联机节点本地存储 (localStorage)
 */
'use client'

import { useState, useCallback, useEffect } from 'react'
import { audioManager } from '@/lib/audio'

export function ApiSettings() {

  const [open, setOpen] = useState(false)
  const [apiKey, setApiKey] = useState('')
  const [provider, setProvider] = useState<'openai' | 'anthropic'>('openai')
  const [workerHost, setWorkerHost] = useState('localhost:8787')
  const [saved, setSaved] = useState(false)

  const handleSave = useCallback(() => {
    audioManager.playClick()
    localStorage.setItem('ai_judge_api_key', apiKey.trim())
    localStorage.setItem('ai_judge_provider', provider)
    localStorage.setItem('multiplayer_worker_host', workerHost.trim())
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }, [apiKey, provider, workerHost])

  const handleClear = useCallback(() => {
    audioManager.playClick()
    localStorage.removeItem('ai_judge_api_key')
    localStorage.removeItem('ai_judge_provider')
    localStorage.removeItem('multiplayer_worker_host')
    setApiKey('')
    setWorkerHost('localhost:8787')
    setSaved(false)
  }, [])

  // Load saved config on mount
  useEffect(() => {
    const savedKey = localStorage.getItem('ai_judge_api_key')
    const savedProvider = localStorage.getItem('ai_judge_provider')
    const savedHost = localStorage.getItem('multiplayer_worker_host')
    if (savedKey) setApiKey(savedKey)
    if (savedProvider === 'openai' || savedProvider === 'anthropic') setProvider(savedProvider)
    if (savedHost) setWorkerHost(savedHost)
  }, [])

  return (
    <div className="border-t-2 border-stone-400/60 bg-[#dfd9cb]/50">
      <button
        onClick={() => { setOpen(!open); audioManager.playClick(); }}
        className="w-full p-2 text-[9px] text-stone-500 hover:text-stone-700 font-mono tracking-wider flex items-center justify-center gap-1 transition-colors"
      >
        {open ? '▼' : '▶'} ⚙️ 全局接口设置
      </button>
      {open && (
        <div className="p-3 text-[10px] space-y-2 border-t border-stone-300/50">
          <div>
            <label className="block text-[8px] text-stone-400 font-mono mb-1 uppercase">AI 裁判后端</label>
            <div className="flex gap-2 mb-1.5">
              <button
                className={`flex-1 py-1 text-[9px] border rounded-sm font-mono ${
                  provider === 'openai' ? 'bg-stone-700 text-stone-100 border-stone-700' : 'bg-stone-100 text-stone-500 border-stone-300'
                }`}
                onClick={() => { setProvider('openai'); audioManager.playClick(); }}
              >OpenAI</button>
              <button
                className={`flex-1 py-1 text-[9px] border rounded-sm font-mono ${
                  provider === 'anthropic' ? 'bg-stone-700 text-stone-100 border-stone-700' : 'bg-stone-100 text-stone-500 border-stone-300'
                }`}
                onClick={() => { setProvider('anthropic'); audioManager.playClick(); }}
              >Anthropic</button>
            </div>
            <input
              type="password"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder={`输入 ${provider === 'openai' ? 'OpenAI' : 'Anthropic'} API Key...`}
              className="w-full bg-stone-100 border border-stone-400 rounded-sm p-1.5 text-[10px] font-mono outline-none focus:border-stone-600 placeholder:text-stone-300"
            />
          </div>

          <div>
            <label className="block text-[8px] text-stone-400 font-mono mb-1 uppercase">联机服务器 Host</label>
            <input
              type="text"
              value={workerHost}
              onChange={e => setWorkerHost(e.target.value)}
              placeholder="例如: localhost:8787"
              className="w-full bg-stone-100 border border-stone-400 rounded-sm p-1.5 text-[10px] font-mono outline-none focus:border-stone-600"
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button onClick={handleSave} className="flex-1 py-1 bg-stone-700 text-stone-100 rounded-sm hover:bg-stone-800 text-[9px] font-bold">
              {saved ? '✓ 已保存' : '保存'}
            </button>
            <button onClick={handleClear} className="px-2 py-1 bg-stone-200 text-stone-500 rounded-sm hover:bg-stone-300 text-[9px]">
              重置
            </button>
          </div>
          <p className="text-[7.5px] text-stone-400 leading-tight">
            设置保存在浏览器本地。未配置 API Key 时将自动回退本地规则引擎判定。
          </p>
        </div>
      )}
    </div>
  )
}
