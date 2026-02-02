console.log('--- SPOTIFY LIB LOADING ---');

const client_id = process.env.SPOTIFY_CLIENT_ID;
const client_secret = process.env.SPOTIFY_CLIENT_SECRET;
const redirect_uri = process.env.SPOTIFY_REDIRECT_URI;

export const generateAuthUrl = () => {
    const scope = 'user-read-playback-state user-modify-playback-state user-read-currently-playing';
    const state = generateRandomString(16);

    const params = new URLSearchParams({
        response_type: 'code',
        client_id: client_id || '',
        scope: scope,
        redirect_uri: redirect_uri || '',
        state: state
    });

    return 'https://accounts.spotify.com/authorize?' + params.toString();
};

export const getAccessToken = async (code: string) => {

    const basic = Buffer.from(`${client_id}:${client_secret}`).toString('base64');

    const params = new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirect_uri || ''
    });

    const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
            Authorization: `Basic ${basic}`,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
    });

    return response.json();
};

export const refreshAccessToken = async (refresh_token: string) => {
    const basic = Buffer.from(`${client_id}:${client_secret}`).toString('base64');

    const params = new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token
    });

    const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
            Authorization: `Basic ${basic}`,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
    });

    return response.json();
};

const generateRandomString = (length: number) => {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
};
