export const GET_BARRELS_REQUEST = 'GET_BARRELS_REQUEST';
export const GET_BARRELS_RESPONSE = 'GET_BARRELS_RESPONSE';

function getBarrelsRequest() {
	return {
		type: GET_BARRELS_REQUEST
	};
}

function getBarrelsResponse(barrels) {
	return {
		type: GET_BARRELS_RESPONSE,
		barrels
	};
}

export function getBarrels() {
	return dispatch => {
		dispatch(getBarrelsRequest());
		return fetch('/api/barrels')
			.then(response => response.json())
			.then(barrels => dispatch(getBarrelsResponse(barrels)));
	};
}
