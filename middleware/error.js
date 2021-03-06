const db = require("../util/db");

const errorHandler = (data, request, response, next) => {
	if (data.status && data.status !== 401 && data.status !== 403 && data.status !== 404 && request.decodedToken) {
		return db.query("SELECT log_error($1, $2, $3, $4, $5, $6);", [data.message, data.error.stack, request.decodedToken.evaluator_id, request.headers.origin, request.headers.referer, request.headers['user-agent']], res => {
			return response.status(data.status || 500).json({
				error: {
					status: data.status,
					message: data.message || "Unknown error",
					id: res.rows[0].log_error
				},
			});
		});
	} else {
		return response.status(data.status || 500).json({
			error: {
				status: data.status,
				message: data.message || "Unknown error",
				id: null
			},
		});
	}
}

module.exports = errorHandler;
