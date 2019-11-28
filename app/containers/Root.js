import React, { Component } from 'react';
import { connect } from 'react-redux';
import Sludge from './Sludge';
import BarrelPicker from '../components/BarrelPicker';
import { getBarrels } from '../actions/barrels';

class Root extends Component {
	render() {
		return this.props.barrels.barrelId !== undefined
			? <Sludge />
			: <div className="DefaultBarrel"><BarrelPicker /></div>;
	}

	componentDidMount() {
		const { dispatch } = this.props;
		dispatch(getBarrels());
	}

}

const mapStateToProps = state => ({
	barrels: state.barrels
});

export default connect(mapStateToProps)(Root);
