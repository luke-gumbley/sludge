import React, { Component } from 'react';
import { connect } from 'react-redux';
import { getBarrels } from '../selectors/barrels';

class BarrelPicker extends Component {

	handleClick = (barrelId => (event) => {
		console.log('CLICK', barrelId);
	});

	render() {
		let barrels = this.props.barrels.map(barrel => (<div key={barrel.id} className='BarrelOption' onClick={this.handleClick(barrel.id)}>{barrel.id}</div>));

		return (<div className='BarrelPicker'>
			{barrels}
		</div>);
	}
}

const mapStateToProps = state => ({
	barrels: getBarrels(state)
});

export default connect(mapStateToProps)(BarrelPicker);
