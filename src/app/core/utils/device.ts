export function isMobilePhone(userAgent: string = navigator.userAgent): boolean {
    const isIpad = /iPad/i.test(userAgent) || (/Macintosh/i.test(userAgent) && navigator.maxTouchPoints > 1);
    const isAndroidTablet = /Android/i.test(userAgent) && !/Mobile/i.test(userAgent);
    if (isIpad || isAndroidTablet) {
        return false;
    }

    return /iPhone|iPod|Android.*Mobile|Windows Phone|BlackBerry|BB10|IEMobile|Opera Mini/i.test(userAgent);
}
