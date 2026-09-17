// Optimized 404 response for ping testing
// Returns minimal 404 response like ESA does

export function onRequest(context) {
	return new Response(null, {
		status: 404,
		headers: {
			'Content-Type': 'text/html;charset=utf-8',
			'Content-Length': '0',
			'Cache-Control': 'no-store, no-cache, must-revalidate',
			'Pragma': 'no-cache',
			'Server': 'EdgeOne-CDN'
		}
	});
}