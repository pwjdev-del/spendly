import crypto from "crypto";

const JWT_SECRET = process.env.AUTH_SECRET || "default_fallback_secret_for_development";

function base64urlEncode(str: string | Buffer): string {
    return Buffer.from(str)
        .toString("base64")
        .replace(/=/g, "")
        .replace(/\+/g, "-")
        .replace(/\//g, "_");
}

export function signJwt(payload: object, expiresInDays = 30): string {
    const header = { alg: "HS256", typ: "JWT" };
    const exp = Math.floor(Date.now() / 1000) + expiresInDays * 24 * 60 * 60;

    const encodedHeader = base64urlEncode(JSON.stringify(header));
    const encodedPayload = base64urlEncode(JSON.stringify({ ...payload, exp }));

    const signatureInput = `${encodedHeader}.${encodedPayload}`;
    const signature = crypto
        .createHmac("sha256", JWT_SECRET)
        .update(signatureInput)
        .digest();

    const encodedSignature = base64urlEncode(signature);
    return `${signatureInput}.${encodedSignature}`;
}

export function verifyJwt(token: string): any {
    try {
        const parts = token.split(".");
        if (parts.length !== 3) return null;

        const [encodedHeader, encodedPayload, encodedSignature] = parts;
        const signatureInput = `${encodedHeader}.${encodedPayload}`;

        // Verify signature
        const expectedSignature = crypto
            .createHmac("sha256", JWT_SECRET)
            .update(signatureInput)
            .digest();

        if (base64urlEncode(expectedSignature) !== encodedSignature) {
            return null;
        }

        // Verify expiration
        const payload = JSON.parse(Buffer.from(encodedPayload, "base64").toString("utf-8"));
        if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
            return null;
        }

        return payload;
    } catch (error) {
        return null;
    }
}
