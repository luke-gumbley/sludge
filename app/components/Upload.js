import React, { Component } from 'react';

export default class Upload extends Component {
	static defaultProps = { text: 'Upload' }

	constructor() {
		super();
		this.readFile = this.readFile.bind(this);
		this.handleChange = this.handleChange.bind(this);
	}

	readFile(file) {
		const onFile = this.props.onFile;
  		const reader = new FileReader();

  		reader.onload = e => onFile(file.name, e.currentTarget.result);
  		reader.readAsText(file);
	}

	handleChange(e) {
		Array.from(e.target.files).forEach(this.readFile);
		e.target.value = null;
	}

	render() {
		return (
			<div className='upload button'>
				{this.props.text}
				<input type='file' name={this.props.name} multiple onChange={this.handleChange}></input>
			</div>
		)
	}
}
