import Cookies from 'js-cookie';

// naive convenience function for supplying tokens and xsrf header
const nativeFetch = fetch;
fetch = function(input, init) {
	init = Object.assign(
		{ credentials: 'same-origin' },
		init,
		{ headers: Object.assign({ 'X-XSRF-TOKEN': Cookies.get('xsrf-token') }, (init || {}).headers) }
	);
	return nativeFetch.call(this, input, init)
		.then(response => {
			if (!response.ok) {
				throw Error(response.statusText);
			}
			return response;
		});
}

import React from 'react';
import { render } from 'react-dom';
import Modal from 'react-modal';
import Root from './containers/Root';
import styles from './sludge.css';

history.replaceState(history.state, '', '/');

render(
	<Root />,
	document.getElementById('root')
);

Modal.setAppElement('#root');
Object.assign(Modal.defaultStyles.content, {
	top: '50%',
	left: '50%',
	right: 'auto',
	bottom: 'auto',
	marginRight: '-50%',
	transform: 'translate(-50%, -50%)'
});
