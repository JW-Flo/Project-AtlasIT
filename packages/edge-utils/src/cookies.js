export function parseCookie(header, key) {
    if (!header)
        return null;
    const parts = header.split(';');
    for (const part of parts) {
        const [k, v] = part.trim().split('=');
        if (k === key)
            return decodeURIComponent(v || '');
    }
    return null;
}
//# sourceMappingURL=cookies.js.map