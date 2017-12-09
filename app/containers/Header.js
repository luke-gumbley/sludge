import React, { Component } from 'react';
import { connect } from 'react-redux';

import Upload from '../components/Upload';

export default class Header extends Component {

	render() {
		return (
			<div className='container'>
				<div className='cell'></div>
				<div className='cell'>
					<Upload />
				</div>
			</div>
		);
	}
}
