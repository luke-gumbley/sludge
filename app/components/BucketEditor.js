import React, { Component } from 'react';
import { connect } from 'react-redux';
import Big from 'big.js';
import moment from 'moment';
import Modal from 'react-modal';

import { createBucket, updateBucket, editBucket } from '../actions/buckets.js';

class BucketEditor extends Component {

	handleSubmit = (evt) => {
		const inputs = evt.target.elements;

		let bucket = {
			name: inputs['name'].value,
			amount: new Big(inputs['amount'].value),
			period: inputs['period'].value,
			periodUnit: inputs['periodUnit'].value,
			date: moment(inputs['date'].value, 'l'),
			budget: inputs['budget'].value || null,
		};

		if(this.props.bucketId !== null)
			bucket.id = this.props.bucketId;

		this.props.onSubmit(bucket, this.props.bucketId !== null ? updateBucket : createBucket);
		this.props.onRequestClose();

		evt.preventDefault();
	}

	render() {
		return (<Modal onRequestClose={this.props.onRequestClose} isOpen={this.props.bucketId !== undefined}>
			<form id='bucketForm' className='grid' onSubmit={this.handleSubmit}>
				<label htmlFor='bucketName'>Name:</label>
				<input id='bucketName' autoFocus name='name' defaultValue={this.props.bucket.name} />

				<label htmlFor='bucketAmount'>Amount:</label>
				<input id='bucketAmount' name='amount' defaultValue={this.props.bucket.amount.toFixed(2)} />

				<label htmlFor='bucketPeriod'>Period:</label>
				<div className='grid'>
				<input id='bucketPeriod' name='period' defaultValue={this.props.bucket.period} size={6}/>
				<select id='bucketPeriodUnit' name='periodUnit' defaultValue={this.props.bucket.periodUnit}>
					<option>months</option>
					<option>days</option>
				</select>
				</div>

				<label htmlFor='bucketDate'>Date:</label>
				<input id='bucketDate' name='date' defaultValue={this.props.bucket.date.format('l')} />

				<label htmlFor='bucketBudget'>Budget:</label>
				<input id='bucketBudget' name='budget' defaultValue={this.props.bucket.budget} />

				<span className='button' onClick={this.props.onRequestClose}>Cancel</span>
				<button className='button' type='submit'>Save</button>
			</form>
		</Modal>);
	}
}

function mapStateToProps(state, props) {
	return {
		bucket: state.buckets.items[props.bucketId] || { amount: new Big(0), period: 0, date: moment(), budget: 'Slush' }
	};
}

function mapDispatchToProps(dispatch) {
	return {
		onSubmit: (bucket, method) => dispatch(method(bucket)),
		onRequestClose: () => dispatch(editBucket(undefined))
	};
}

export default connect(mapStateToProps, mapDispatchToProps)(BucketEditor);
