import React, { Component } from 'react';
import { connect } from 'react-redux';
import { getBarrels } from '../selectors/barrels';

class BarrelPicker extends Component {
	render() {
		let barrels = this.props.barrels.map(barrel => (<option key={barrel.id}>{barrel.id}</option>));

		return (<select id='barrelPicker'>
			{barrels}
		</select>);
	}
}

const mapStateToProps = state => ({
	barrels: getBarrels(state)
});

export default connect(mapStateToProps)(BarrelPicker);
