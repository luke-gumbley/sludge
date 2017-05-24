import React from 'react';

class Bucket extends React.Component {
	constructor(props) {
		super(props);

		this.state = { bucket: props.bucket || '' };

		this.handleChange = this.handleChange.bind(this);
 		this.handleBlur = this.handleBlur.bind(this);
	}

	componentWillReceiveProps(nextProps) {
		if(this.props.bucket !== nextProps.bucket)
			this.setState({ bucket: nextProps.bucket || '' });
	}

	handleChange(event) {
		this.setState({ bucket: event.target.value });
	}

	handleBlur(event) {
		this.props.onBucketChange(this.state.bucket);
	}

	render() {
		return (<input type="text" list="buckets" onChange={this.handleChange} onBlur={this.handleBlur} value={this.state.bucket} />);
	}
}

module.exports = Bucket;
