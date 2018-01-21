import React, { Component } from 'react';
import { connect } from 'react-redux';

import { postStatement } from '../actions/transactions.js';
import Upload from '../components/Upload';
import Download from '../components/Download';

class Header extends Component {

	render() {
		return (
			<div className='container'>
				<div className='cell'>
					<Upload onFile={ this.props.handleFile }/>
				</div>
				<div className='cell'>
					<Download url='/api/bucket/export' />
				</div>
			</div>
		);
	}
}

function mapDispatchToProps(dispatch) {
	return {
		handleFile: (filename, data) => dispatch(postStatement(filename, data))
	};
}

export default connect(null,mapDispatchToProps)(Header);
