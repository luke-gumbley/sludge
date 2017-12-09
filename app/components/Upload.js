import React, { Component } from 'react';

export default class Upload extends Component {
	static defaultProps = { text: 'Upload' }

	constructor() {
		super();
		this.uploadFile = this.uploadFile.bind(this);
		this.readFile = this.readFile.bind(this);
		this.handleChange = this.handleChange.bind(this);
	}

	uploadFile(filename, data) {
		fetch(`/statements/${filename}`, {
				method: 'POST',
				headers: { "Content-Type": "application/octet-stream" },
				body: data
			}).then(response => response.json())
			.then(success => console.log(success))
			.catch(ex => {console.log('whoops!'); console.log(ex); });
	}

	readFile(file) {
		const uploadFile = this.uploadFile;
  		const reader = new FileReader();

  		reader.onload = e => uploadFile(file.name, e.currentTarget.result);
  		reader.readAsText(file);
	}

	handleChange(e) {
		Array.from(e.target.files).forEach(this.readFile);
		e.target.value = null;
	}

	render() {
		return (
			<div className='upload_button'>
				{this.props.text}
				<input type='file' multiple onChange={this.handleChange}></input>
			</div>
		)
	}
}
