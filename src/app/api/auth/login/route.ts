import { generateAuthUrl } from '@/lib/spotify';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        console.log('Login route called');


        const clientId = process.env.SPOTIFY_CLIENT_ID;
        const redirectUri = process.env.SPOTIFY_REDIRECT_URI;

        if (!clientId || !redirectUri) {
            console.error('Missing env vars:', { clientId: !!clientId, redirectUri: !!redirectUri });
            return NextResponse.json({
                error: 'Configuration Error',
                message: 'Missing SPOTIFY_CLIENT_ID or SPOTIFY_REDIRECT_URI',
                debug: { hasClientId: !!clientId, hasRedirectUri: !!redirectUri }
            }, { status: 500 });
        }

        const url = generateAuthUrl();
        console.log('Redirecting to Spotify:', url);
        return NextResponse.redirect(url);
    } catch (error) {
        console.error('Login route error:', error);
        return NextResponse.json({ error: 'Internal Server Error', details: String(error) }, { status: 500 });
    }
}
