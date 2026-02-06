import jwt from 'jsonwebtoken';

interface TokenCache {
    token: string;
    expiry: number;
}

const tokenCache: Record<string, TokenCache> = {};

export function generateZhipuToken(apiKey: string): string {
    const now = Date.now();

    if (tokenCache[apiKey] && now < tokenCache[apiKey].expiry) {
        return tokenCache[apiKey].token;
    }

    const [id, secret] = apiKey.split('.');
    if (!id || !secret) {
        throw new Error('유효하지 않은 Zhipu API Key 형식입니다. (id.secret 형식이어야 합니다)');
    }

    const payload = {
        api_key: id,
        exp: now + 3600 * 1000,
        timestamp: now,
    };

    const token = jwt.sign(payload, secret, {
        algorithm: 'HS256',
        header: { alg: 'HS256', sign_type: 'SIGN' } as any
    });

    tokenCache[apiKey] = {
        token,
        expiry: now + 3600 * 1000 - 300 * 1000
    };

    return token;
}
