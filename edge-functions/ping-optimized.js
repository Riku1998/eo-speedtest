// 优化的ping端点，专门用于测速
// 返回最小的可能响应，减少HTTP处理开销

export function onRequestGet() {
    return new Response(null, {
        status: 204, // No Content - 最小的HTTP响应
        headers: {
            "Cache-Control": "no-store, max-age=0",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
            "Content-Length": "0" // 明确指定0字节
        }
    });
}

export function onRequestHead() {
    return new Response(null, {
        status: 204,
        headers: {
            "Cache-Control": "no-store, max-age=0",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
            "Content-Length": "0"
        }
    });
}

export function onRequestOptions() {
    return new Response(null, {
        status: 204,
        headers: {
            "Cache-Control": "no-store, max-age=0",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
            "Allow": "GET, HEAD, OPTIONS",
            "Access-Control-Allow-Headers": "*",
            "Content-Length": "0"
        }
    });
}