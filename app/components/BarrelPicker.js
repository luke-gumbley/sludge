import React, { Component } from 'react';
import { connect } from 'react-redux';
import { setBarrel } from '../actions/barrels';
import { getBarrels } from '../selectors/barrels';

class BarrelPicker extends Component {

	handleClick = (barrelId => (event) => {
		console.log('CLICK', barrelId);
	});

	render() {
		let barrels = this.props.barrels.map(barrel => (<div key={barrel.id} className='BarrelOption' onClick={() => this.props.onSelect(barrel.id)}>{barrel.name}</div>));

		return (<div className='BarrelPicker'>
			{barrels}
		</div>);
	}
}

const mapStateToProps = state => ({
	barrels: getBarrels(state)
});

function mapDispatchToProps(dispatch) {
	return {
		onSelect: barrelId => dispatch(setBarrel(barrelId)),
	};
}

export default connect(mapStateToProps, mapDispatchToProps)(BarrelPicker);
