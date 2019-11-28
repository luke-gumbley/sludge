export const GET_BARRELS_REQUEST = 'GET_BARRELS_REQUEST';
export const GET_BARRELS_RESPONSE = 'GET_BARRELS_RESPONSE';

export const SET_BARREL_REQUEST = 'SET_BARREL_REQUEST';
export const SET_BARREL_RESPONSE = 'SET_BARREL_RESPONSE';

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

function setBarrelRequest(barrelId) {
	return {
		type: SET_BARREL_REQUEST,
		barrelId
	};
}

function setBarrelResponse(barrelId) {
	return {
		type: SET_BARREL_RESPONSE,
		barrelId
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

export function setBarrel(barrelId) {
	return dispatch => {
		dispatch(setBarrelRequest(barrelId));
		return fetch('/auth/barrel/' + barrelId)
			.then(response => response.json())
			.then(barrel => dispatch(setBarrelResponse(barrel.id)));
	};
}
