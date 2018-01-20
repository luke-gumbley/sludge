module.exports = {

	stableSort: function(array, accessor) {
		array.forEach((e, i) => array[i] = {e, i});

		array.sort((a, b) => {
			const elA = accessor(a.e), elB = accessor(b.e);
			return elA < elB ? -1 : elA > elB ? 1 : a.i < b.i ? -1 : 1;
		});

		const wasSorted = array.every((e, i) => e.i === i);

		array.forEach((e, i) => array[i] = e.e);

		return wasSorted;
	}
};
