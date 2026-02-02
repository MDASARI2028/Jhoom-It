import { getAccessToken } from '@/lib/spotify';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    console.log('--- CALLBACK ROUTE ENTRY (Client-Side Fix) ---');
    try {
        const { searchParams } = new URL(request.url);
        const code = searchParams.get('code');
        const error = searchParams.get('error');

        if (error) {
            return NextResponse.redirect(new URL('/?error=' + error, request.url));
        }

        if (!code) {
            return NextResponse.json({ error: 'No code provided' }, { status: 400 });
        }

        const data = await getAccessToken(code);

        if (data.error) {
            return NextResponse.json({ error: data.error, details: data.error_description }, { status: 400 });
        }

        const { access_token, refresh_token, expires_in } = data;

        // Serve HTML that sets the cookie in the browser manually
        const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Authenticating...</title>
            <style>
                body { background: #000; color: #1DB954; font-family: monospace; display: flex; align-items: center; justify-content: center; height: 100vh; }
            </style>
        </head>
        <body>
            <h1>CONNECTING TO SPOTIFY...</h1>
            <script>
                // Set Cookies Manually
                document.cookie = "spotify_access_token=${access_token}; path=/; max-age=${expires_in}; samesite=lax";
                ${refresh_token ? `document.cookie = "spotify_refresh_token=${refresh_token}; path=/; max-age=2592000; samesite=lax";` : ''}
                
                // Redirect
                setTimeout(() => {
                    window.location.href = "/?connected=true";
                }, 1000);
            </script>
        </body>
        </html>
        `;

        return new NextResponse(html, {
            headers: { 'Content-Type': 'text/html' }
        });

    } catch (error) {
        console.error('FATAL LOGIC ERROR in callback:', error);
        return NextResponse.json({
            error: 'Internal Server Error',
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}
