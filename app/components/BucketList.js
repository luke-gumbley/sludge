import React, { Component } from 'react';
import { connect } from 'react-redux';
import Bucket from './Bucket';
import GlyphButton from './GlyphButton';
import { editBucket } from '../actions/buckets.js';
import { getBuckets } from '../selectors/buckets.js';

class BucketList extends Component {
	render() {
		var buckets = this.props.buckets.map(bucket => {
			return (<Bucket key={bucket.id} bucket={bucket} />);
		});
		return (<div>
			{buckets}
			<div className='container'>
				<div style={{flex: 7}}></div>
				<div><GlyphButton glyph="plus" onClick={this.props.onAdd} /></div>
			</div>
		</div>);
	}
}

const mapStateToProps = state => ({
	buckets: getBuckets(state)
});

const mapDispatchToProps = dispatch => ({
	onAdd: bucket => dispatch(editBucket(null))
});

export default connect(mapStateToProps, mapDispatchToProps)(BucketList);
