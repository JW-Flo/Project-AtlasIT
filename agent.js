#!/usr/bin/env node

import fs from 'fs'
import readline from 'readline'
import { spawnSync, execSync } from 'child_process'
import https from 'https'
import { URL } from 'url'

const WORKER_URL = process.env.WORKER_URL
const LOG_FILE = 'agent.log'
const INPUT_FILE = process.env.INPUT_FILE
const WHISPER_MODEL = process.env.WHISPER_MODEL || 'base'

let VOSK_AVAILABLE = false
try {
  require.resolve('vosk')
  VOSK_AVAILABLE = true
} catch {}

const VOICE_INPUT = process.env.VOICE_INPUT === '1'

if (!WORKER_URL) {
  console.error('[ERROR] WORKER_URL env var not set')
  process.exit(1)
}

function log(msg) {
  fs.appendFileSync(LOG_FILE, `[${new Date().toISOString()}] ${msg}\n`)
}

function postPrompt(prompt) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ prompt })
    const url = new URL(WORKER_URL)
    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    }
    const req = https.request(options, res => {
      let body = ''
      res.on('data', chunk => { body += chunk })
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            resolve(JSON.parse(body))
          } catch (e) {
            reject(new Error('Invalid JSON from worker'))
          }
        } else {
          reject(new Error(`Worker error: ${res.statusCode}`))
        }
      })
    })
    req.on('error', reject)
    req.write(data)
    req.end()
  })
}

async function processPrompt(prompt) {
  try {
    const result = await postPrompt(prompt)
    if (!result || !result.action) {
      log(`[SKIP] No action for prompt: ${prompt}`)
      return
    }
    // Execute action via Cursor CLI
    const exec = spawnSync('cursor', ['remote', 'exec', result.action], { encoding: 'utf-8' })
    if (exec.error || exec.status !== 0) {
      log(`[ERROR] Action failed: ${prompt} | ${exec.stderr || exec.error}`)
      return
    }
    log(`[OK] Action executed: ${prompt} | ${result.action}`)
  } catch (err) {
    log(`[ERROR] ${err.message} | prompt: ${prompt}`)
  }
}

async function getVoicePrompt() {
  // Requires 'rec' (SoX) and Whisper CLI (pip install openai-whisper)
  const wavFile = 'prompt.wav'
  const txtFile = 'prompt.wav.txt'
  try {
    execSync(`rec -r 16000 -c 1 ${wavFile} trim 0 15`)
    log('[INFO] Audio recorded, running Whisper transcription')
    execSync(`whisper ${wavFile} --language English --model ${WHISPER_MODEL} --output_format txt`, { stdio: 'ignore' })
    const transcript = fs.readFileSync(txtFile, 'utf-8').trim()
    fs.unlinkSync(wavFile)
    fs.unlinkSync(txtFile)
    return transcript
  } catch (e) {
    log(`[ERROR] Voice input/Whisper failed: ${e.message}`)
    try { fs.unlinkSync(wavFile) } catch {}
    try { fs.unlinkSync(txtFile) } catch {}
    return ''
  }
}

async function main() {
  const input = []
  if (VOICE_INPUT) {
    log('[INFO] Voice input mode enabled')
    const prompt = await getVoicePrompt()
    if (prompt) input.push(prompt)
  } else if (INPUT_FILE) {
    try {
      const lines = fs.readFileSync(INPUT_FILE, 'utf-8').split('\n').filter(Boolean)
      input.push(...lines)
    } catch (e) {
      console.error(`[ERROR] Failed to read input file: ${INPUT_FILE}`)
      process.exit(1)
    }
  } else {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: false })
    for await (const line of rl) {
      if (line.trim()) input.push(line.trim())
    }
  }
  for (const prompt of input) {
    await processPrompt(prompt)
  }
}

main()

// Voice input now requires:
//   pip install openai-whisper
//   Install SoX: brew install sox
//   Usage: VOICE_INPUT=1 node agent.js 