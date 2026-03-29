import { KVNamespace } from '@cloudflare/kv-asset-handler'
import { D1Database } from '@cloudflare/workers-types'

interface DispatcherEnv {
  KV: KVNamespace
  DB: D1Database
}

export class Dispatcher {
  constructor(private readonly env: DispatcherEnv) {}

  async handleRequest(request: Request): Promise<Response> {
    const url = new URL(request.url)
    const path = url.pathname

    try {
      if (path.startsWith('/kv/')) {
        return this.handleKvRequest(request, path)
      }
      if (path.startsWith('/d1/')) {
        return this.handleD1Request(request, path)
      }
      return new Response('Not Found', { status: 404 })
    } catch (error) {
      console.error('Dispatcher error:', error)
      return new Response('Internal Server Error', { status: 500 })
    }
  }

  private async handleKvRequest(request: Request, path: string): Promise<Response> {
    const key = path.substring(4)
    if (!key) return new Response('Bad Request: Missing key', { status: 400 })

    switch (request.method) {
      case 'GET':
        const value = await this.env.KV.get(key)
        if (value === null) {
          return new Response('Not Found', { status: 404 })
        }
        return new Response(value)
      case 'PUT':
        const value = await request.text()
        await this.env.KV.put(key, value)
        return new Response('OK', { status: 200 })
      case 'DELETE':
        await this.env.KV.delete(key)
        return new Response('OK', { status: 200 })
      default:
        return new Response('Method Not Allowed', { status: 405 })
    }
  }

  private async handleD1Request(request: Request, path: string): Promise<Response> {
    const segments = path.split('/').filter(Boolean)
    if (segments.length < 2 || segments[0] !== 'd1') {
      return new Response('Not Found', { status: 404 })
    }

    const table = segments[1]
    const id = segments[2]

    switch (request.method) {
      case 'GET':
        if (id) {
          const stmt = this.env.DB.prepare(
            `SELECT * FROM ${table} WHERE id = ?`
          ).bind(id)
          const result = await stmt.first()
          return result
            ? new Response(JSON.stringify(result), {
                headers: { 'Content-Type': 'application/json' }
              })
            : new Response('Not Found', { status: 404 })
        } else {
          const stmt = this.env.DB.prepare(`SELECT * FROM ${table}`)
          const results = await stmt.all()
          return new Response(JSON.stringify(results.results), {
            headers: { 'Content-Type': 'application/json' }
          })
        }
      case 'POST':
        if (!id) {
          const data = await request.json()
          const columns = Object.keys(data).join(', ')
          const placeholders = Object.keys(data)
            .map((_, i) => `$${i + 1}`)
            .join(', ')
          const values = Object.keys(data).map(key => data[key])
          const stmt = this.env.DB.prepare(
            `INSERT INTO ${table} (${columns}) VALUES (${placeholders})`
          ).bind(...values)
          const result = await stmt.run()
          return new Response(JSON.stringify({ id: result.meta.last_row_id }), {
            status: 201,
            headers: { 'Content-Type': 'application/json' }
          })
        }
        return new Response('Bad Request', { status: 400 })
      case 'PUT':
        if (!id) return new Response('Bad Request: Missing ID', { status: 400 })
        const data = await request.json()
        const setClause = Object.keys(data)
          .map(key => `${key} = ?`)
          .join(', ')
        const values = [...Object.values(data), id]
        const stmt = this.env.DB.prepare(
          `UPDATE ${table} SET ${setClause} WHERE id = ?`
        ).bind(...values)
        const result = await stmt.run()
        return result.meta.changes > 0
          ? new Response('OK', { status: 200 })
          : new Response('Not Found', { status: 404 })
      case 'DELETE':
        if (!id) return new Response('Bad Request: Missing ID', { status: 400 })
        const deleteStmt = this.env.DB.prepare(
          `DELETE FROM ${table} WHERE id = ?`
        ).bind(id)
        const deleteResult = await deleteStmt.run()
        return deleteResult.meta.changes > 0
          ? new Response('OK', { status: 200 })
          : new Response('Not Found', { status: 404 })
      default:
        return new Response('Method Not Allowed', { status: 405 })
    }
  }
}
