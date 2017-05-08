import React from 'react';
import ReactDOM from 'react-dom';
import Transaction from './Transaction';

ReactDOM.render(
	<Transaction party="me" type="thing" particulars="part" code="cod" reference="ref" amount="19.43" />
	,
	document.getElementById('root')
);