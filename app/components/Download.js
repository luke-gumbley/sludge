import React, { Component } from 'react';
import { saveAs } from 'file-saver';

export default class Download extends Component {
	static defaultProps = { text: 'Download', filename: 'default.csv' }

	handleClick = e => {
		fetch(this.props.url).then(response => response.blob()).then(blob => {
			saveAs(blob, this.props.filename);
		}).catch(ex => {console.log('whoops!'); console.log(ex); });
		//var blob = new Blob([response.body], {type: "text/plain;charset=utf-8"});
	};

	render() {
		return (
			<div className='download button' onClick={this.handleClick}>
				{this.props.text}
			</div>
		)
	}
}
