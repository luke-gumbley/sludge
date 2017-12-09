import React, { Component } from 'react';

export default class Upload extends Component {
	static defaultProps = { text: 'Upload' }

	render() {
		return (
			<div className='upload_button'>
				{this.props.text}
				<input type='file' multiple></input>
			</div>
		)
	}
}
