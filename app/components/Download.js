import React, { Component } from 'react';
import { saveAs } from 'file-saver';

export default class Download extends Component {
	static defaultProps = { text: 'Download' }

	constructor() {
		super();
		this.handleClick = this.handleClick.bind(this);
	}

	handleClick(e) {
		fetch(this.props.url).then(response => response.blob()).then(blob => {
			saveAs(blob, "buckets.csv");
		}).catch(ex => {console.log('whoops!'); console.log(ex); });
//		var blob = new Blob([response.body], {type: "text/plain;charset=utf-8"});
	}

	render() {
		return (
			<div className='download button' onClick={this.handleClick}>
				{this.props.text}
			</div>
		)
	}
}
