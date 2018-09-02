import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Column, Table, AutoSizer } from 'react-virtualized';
import 'react-virtualized/styles.css';
import Bucket from './Bucket';
import GlyphButton from './GlyphButton';
import { editRule, deleteRule } from '../actions/rules.js';
import { getRules } from '../selectors/rules.js';

class RuleList extends Component {
	rowClassName = ({ index }) => {
		if(index == -1) return undefined;
		return (index % 2) ? 'altRow' : undefined;
	};

	rowGetter = ({ index }) => {
		return this.props.rules[index];
	};

	renderAdd = options => {
		return (<GlyphButton glyph="plus" onClick={this.handleAdd} />);
	};

	renderBucket = options => {
		return (<Bucket bucketId={options.rowData.bucketId} />);
	};

	renderActions = options => {
		const rule = options.rowData;
		return (<div>
			<GlyphButton glyph="pencil-alt" onClick={this.handleEdit(rule)} />
			{'\u00A0'}
			<GlyphButton glyph="trash" onClick={this.handleDelete(rule.id)} />
		</div>);
	};

	handleAdd = () => this.props.dispatch(editRule({}));

	handleEdit = rule => {
		return () => this.props.dispatch(editRule(rule));
	};

	handleDelete = id => {
		return () => this.props.dispatch(deleteRule(id));
	};

	render() {
		return (<AutoSizer>
			{({height, width}) => (
				<Table
						width={width}
						height={height}
						headerHeight={20}
						rowHeight={30}
						rowCount={(this.props.rules || []).length}
						rowClassName={this.rowClassName}
						rowGetter={this.rowGetter} >
					<Column label='Account' dataKey='account' width={80} flexGrow={1} />
					<Column label='Search' dataKey='search' width={160} flexGrow={2} />
					<Column label='Bucket' dataKey='bucketId' cellRenderer={this.renderBucket} width={80} flexGrow={1} />
					<Column
						dataKey='id'
						headerRenderer={this.renderAdd}
						cellRenderer={this.renderActions}
						width={20}
						flexGrow={0.5} />
				</Table>
			)}
		</AutoSizer>);
	}
}

const mapStateToProps = state => ({
	rules: getRules(state)
});

export default connect(mapStateToProps)(RuleList);
