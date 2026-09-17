function pingResponse() {
	return new Response(null, {
		status: 204,
		headers: {
			"Cache-Control": "no-store",
			"Access-Control-Allow-Origin": "*",
			"Access-Control-Allow-Methods": "GET, HEAD, OPTIONS"
		}
	});
}

export function onRequestGet() {
	return pingResponse();
}

export function onRequestHead() {
	return pingResponse();
}

export function onRequestOptions() {
	return pingResponse();
}
