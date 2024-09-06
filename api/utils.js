export function stableSort(array, accessor) {
	array.forEach((e, i) => array[i] = {e, i});

	array.sort((a, b) => {
		const elA = accessor(a.e), elB = accessor(b.e);
		return elA < elB ? -1 : elA > elB ? 1 : a.i < b.i ? -1 : 1;
	});

	const wasSorted = array.every((e, i) => e.i === i);

	array.forEach((e, i) => array[i] = e.e);

	return wasSorted;
}

export function log({ time, user, duration, content }) {
	if(process.env.NODE_ENV!='test') {
		console.log([(time || new Date()).toISOString(),
			(user || '').padStart(35),
			(duration || 0).toString().padStart(5),
			content].join('\t'));
	}
}
