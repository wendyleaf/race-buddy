import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function SetupNotice() {
  return (
    <Card className="mx-auto mt-12 max-w-xl">
      <CardHeader>
        <CardTitle>Connect Supabase to get started</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-zinc-600">
        <p>
          Race Buddy stores your races, training builds, and diary in Supabase.
          Create a <code className="rounded bg-zinc-100 px-1">.env.local</code>{" "}
          file with:
        </p>
        <pre className="rounded-md bg-zinc-900 p-3 text-xs text-zinc-100">
          {`NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key`}
        </pre>
        <p>
          Then run <code className="rounded bg-zinc-100 px-1">supabase-migrations.sql</code>{" "}
          in the Supabase SQL Editor and restart the dev server.
        </p>
      </CardContent>
    </Card>
  )
}
