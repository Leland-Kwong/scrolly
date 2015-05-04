function JSONDiff(a, b) {
	var isString, isNumOrBoolean, isEqual;

	for ( var prop in a ) {
		isString = typeof a[prop] === 'string';
		isNumOrBoolean = typeof a[prop] === 'number' || typeof a[prop] === 'boolean';
		isEqual = a[prop] === b[prop];

		// recursively compare child properties
		if ( typeof a[prop] === 'object' && a[prop] !== null && Object.keys(a[prop]).length ) {
			JSONDiff(a[prop], b[prop]);
		} else if ( !isEqual && !isString ) {
			a[prop] = '<span class=\'json-diff json-prop\'>' + a[prop] + '<\/span>';
		} else if ( isString ) {
			a[prop] = '<span class=\'json-diff json-prop\'>&quot;' + a[prop] + '&quot;<\/span>';
		} else {
			a[prop] = '<span class=\'json-prop\'>' + a[prop] + '<\/span>';
		}
	}

	return a;
}
