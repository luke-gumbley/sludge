import React from 'react';
import { render } from 'react-dom';
import Modal from 'react-modal';

import Root from './containers/Root';

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
