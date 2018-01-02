import React, { Component } from 'react';
import { connect } from 'react-redux';
import Big from 'big.js';
import moment from 'Moment';
import Modal from 'react-modal';

import { updateBucket, editBucket } from '../actions/buckets.js';
import Bucket from './Bucket';

class BucketEditor extends Component {
	constructor() {
		super();
		this.handleSubmit = this.handleSubmit.bind(this);
	}

	handleSubmit(evt) {
		const inputs = evt.target.elements;

		this.props.onSubmit({
			id: this.props.bucketId,
			name: inputs['name'].value,
			amount: new Big(inputs['amount'].value),
			periodDays: inputs['periodDays'].value,
			periodMonths: inputs['periodMonths'].value,
			nextDate: moment(new Date(inputs['nextDate'].value))
		});

		evt.preventDefault();
	}

	render() {
		return (<Modal onRequestClose={this.props.onRequestClose} isOpen={this.props.bucketId !== null && this.props.bucketId !== undefined}>
			<form onSubmit={this.handleSubmit}>
				<label>Name: <input name='name' defaultValue={this.props.bucket.name} /></label>
				<label>Amount: <input name='amount' defaultValue={this.props.bucket.amount.toFixed(2)} /></label>
				<label>Days: <input name='periodDays' defaultValue={this.props.bucket.periodDays} /></label>
				<label>Months: <input name='periodMonths' defaultValue={this.props.bucket.periodMonths} /></label>
				<label>Next: <input name='nextDate' defaultValue={this.props.bucket.nextDate.format('l')} /></label>
				<span className='button left' onClick={this.props.onRequestClose}>Cancel</span>
				<button className='button right' type='submit'>Save</button>
			</form>
		</Modal>);
	}
}

function mapStateToProps(state, props) {
	return {
		bucket: state.buckets.items[props.bucketId] || { amount: new Big(0), nextDate: moment() }
	};
}

function mapDispatchToProps(dispatch) {
	return {
		onSubmit: bucket => dispatch(updateBucket(bucket)),
		onRequestClose: bucket => dispatch(editBucket(null))
	};
}

export default connect(mapStateToProps, mapDispatchToProps)(BucketEditor);
