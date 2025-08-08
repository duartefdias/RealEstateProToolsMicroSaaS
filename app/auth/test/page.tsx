'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/lib/auth/context'

export default function AuthTestPage() {
  const [logs, setLogs] = useState<string[]>([])
  const { signInWithGoogle } = useAuth()

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [...prev, `[${timestamp}] ${message}`])
    console.log(`🧪 [${timestamp}] ${message}`)
  }

  const testGoogleOAuth = async () => {
    setLogs([])
    addLog('Starting Google OAuth test...')
    
    try {
      addLog('Calling signInWithGoogle()...')
      const { error } = await signInWithGoogle()
      
      if (error) {
        addLog(`❌ OAuth Error: ${error.message}`)
      } else {
        addLog('✅ OAuth initiated successfully - should redirect to Google')
        addLog('⏳ Waiting for redirect... (if you see this, redirect failed)')
        
        // If we reach here, the redirect didn't happen
        setTimeout(() => {
          addLog('❌ Redirect to Google did not occur - check Supabase OAuth configuration')
        }, 2000)
      }
    } catch (error) {
      addLog(`❌ Exception: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  const testSupabaseConnection = async () => {
    addLog('Testing Supabase connection...')
    try {
      const response = await fetch('/api/auth/debug')
      const data = await response.json()
      
      if (data.supabase?.connectionTest === 'success') {
        addLog('✅ Supabase connection successful')
      } else {
        addLog(`❌ Supabase connection failed: ${data.supabase?.error}`)
      }
      
      addLog(`Environment: ${data.environment?.NODE_ENV}`)
      addLog(`Site URL: ${data.environment?.NEXT_PUBLIC_SITE_URL || 'not set'}`)
      addLog(`Callback URL: ${data.oauth?.expectedCallbackUrl}`)
    } catch (error) {
      addLog(`❌ Failed to test connection: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  return (
    <div className="container max-w-4xl py-8">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Google OAuth Debug Tool</CardTitle>
          <CardDescription>
            Use this tool to debug the Google OAuth authentication flow
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button onClick={testSupabaseConnection} variant="outline">
              Test Supabase Connection
            </Button>
            <Button onClick={testGoogleOAuth} variant="default">
              Test Google OAuth
            </Button>
            <Button onClick={() => setLogs([])} variant="ghost">
              Clear Logs
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Debug Logs</CardTitle>
          <CardDescription>
            Watch the logs below and check the browser console for detailed information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-900 text-green-400 p-4 rounded font-mono text-sm h-96 overflow-y-auto">
            {logs.length === 0 ? (
              <div className="text-gray-500">Click a test button to start debugging...</div>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="mb-1">
                  {log}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Common Issues & Solutions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div><strong>1. Google OAuth not configured:</strong> Go to Supabase Dashboard → Authentication → Providers → Enable Google</div>
          <div><strong>2. Missing redirect URLs:</strong> Add <code>http://localhost:3000/auth/callback</code> to Supabase → Authentication → URL Configuration</div>
          <div><strong>3. OAuth redirect fails:</strong> Check browser console for detailed error logs</div>
          <div><strong>4. Environment variables:</strong> Ensure .env file has correct NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY</div>
        </CardContent>
      </Card>
    </div>
  )
}