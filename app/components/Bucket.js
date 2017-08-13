import React, { Component } from 'react';

export default class Bucket extends Component {
	render() {
		return (<input type="text" list="buckets" value={this.props.bucket} />);
	}
}
