# AI AGENT SHOULD NEVER MODIFY THIS FILE WITHOUT USER CONSENT AUTOMATICALLY!

# User Creation Without Webhooks

This document explains how user creation in Supabase is implemented without using webhooks when users sign up through Clerk.io.


## Pre-req

1. make sure supabase service key is added correctly from /settings/api-keys (knowing that this is legacy approach, but we will use it until its full deprecated, and new approach is in /settings/api-keys/new in supabase site)

## How Auth Should Work In App

Instead of using webhooks, this implementation uses a combination of server-side and middleware approaches to ensure users are created in Supabase when they authenticate through Clerk:

1. **API Route**: An API endpoint at `/api/user` checks if the user exists in Supabase and creates them if they don't.
2. **Middleware**: The Next.js middleware calls this API endpoint when authenticated users access protected routes.
3. **Auth Callback**: A special route at `/api/auth/clerk-auth-callback` handles user creation after successful authentication.
4. **Server Components**: The protected server page directly calls a utility function to ensure the user exists in Supabase.

This approach has several advantages over webhooks:
- No need to configure and maintain webhook endpoints
- Works in development environments without tunneling
- Simpler to debug and test
- More reliable as it's triggered during normal application usage

## Implementation Details

### 1. API Route for User Management

The `/api/user` route handles checking if a user exists in Supabase and creating them if they don't:

```typescript
// src/app/api/user/route.ts
export async function GET(req: NextRequest) {
  // Get the current user from Clerk
  const user = await currentUser();
  
  // If no user is authenticated, return an error
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  // Create a Supabase client with service role to bypass RLS
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  
  // Check if the user exists in Supabase
  const { data: userSelectData, error: userSelectError } = await supabase
    .from('users')
    .select('id, email, name, avatar_url, metadata')
    .eq('id', user.id);
  
  // If user doesn't exist, create them
  if (!userSelectData || userSelectData.length === 0) {
    // Insert the user into Supabase with default metadata { role: 'user' }
    // ...
  }
  
  // Return the user data
  return NextResponse.json({ data: userSelectData[0] });
}
```

### 2. Middleware Integration

The middleware ensures users are created in Supabase when they access protected routes:

```typescript
// src/middleware.ts
export default authMiddleware({
  publicRoutes,
  afterAuth: async (auth, req) => {
    // If the user is signed in and not on a public route, ensure they exist in Supabase
    if (auth.userId && !publicRoutes.includes(req.nextUrl.pathname)) {
      // Make a request to our API endpoint to ensure the user exists in Supabase
      try {
        const response = await fetch(`${req.nextUrl.origin}/api/user`, {
          headers: {
            'Cookie': req.headers.get('cookie') || '',
          },
        });
        
        if (!response.ok) {
          console.error('Error ensuring user exists in Supabase');
        }
      } catch (error) {
        console.error('Error making request to ensure user exists:', error);
      }
    }
    
    return NextResponse.next();
  }
});
```

### 3. Server-Side Utility Function

A utility function that can be called from server components:

```typescript
// src/lib/ensureUser.ts
export async function ensureUserInSupabase() {
  // Get the current user from Clerk
  const user = await currentUser();
  
  // If no user is authenticated, return
  if (!user) {
    return null;
  }

  // Create a Supabase client with service role to bypass RLS
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  
  // Check if the user exists in Supabase and create them if they don't
  // ...
  
  return user;
}
```

## Environment Variables

Make sure to add these environment variables to your `.env.local` file:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

The `SUPABASE_SERVICE_ROLE_KEY` is needed because the user creation process needs to bypass Row Level Security (RLS) to create new users. You can find this key in your Supabase dashboard under Project Settings > API.

## Database Schema

The users table in Supabase uses UUID for the primary key and stores Clerk user IDs in the metadata:

```sql
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- UUID primary key
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{"role":"user"}'::JSONB -- Default metadata with role set to "user" and clerk_user_id stored here
);
```

## Testing

After implementing this approach:
1. Sign up for a new account through Clerk's sign-up flow
2. The middleware and API routes will automatically create a new entry in your Supabase users table
3. The new user will have default metadata with `{"role":"user"}`

This implementation follows the same pattern used in your other project, where user data is synchronized between Clerk and Supabase without using webhooks.
