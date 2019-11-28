import React, { Component } from 'react';
import { connect } from 'react-redux';
import Sludge from './Sludge';
import BarrelPicker from '../components/BarrelPicker';
import { getBarrels } from '../actions/barrels';

class Root extends Component {
	render() {
		return this.props.barrelId !== undefined
			? <Sludge />
			: <BarrelPicker />;
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
