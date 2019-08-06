import React, { Component } from 'react';


import { InfiniteLoader, Column, Table, AutoSizer } from 'react-virtualized';
import Draggable from 'react-draggable';

export default class CustomTable extends Component {

	constructor(props) {
		super(props);

		const originalChildren = React.Children.toArray(props.children);

		const columns = props.columnLayout.map(column => {
			const child = originalChildren.find(child => child.props.label === column.label);
			return Object.assign({}, column, { child });
		}).filter(column => column.child);

		this.state = {
			columns,
			deltas: {}
		};
	}

	static calculateWidths({width, columns, deltas}) {
		const layout = {
			count: columns.filter(c => c.width).length,
			width: columns.reduce((w,c) => w + c.width || 0, 0)
		};

		// allow for columns in the layout that have not been given width
		const sized = layout.count / columns.length;
		const unsized = (columns.length - layout.count) / columns.length;

		layout.width *= columns.length / layout.count;

		let allocated = 0, modifier = 1;
		return columns.map(column => {
			const delta = deltas[column.label] || 0;
			const ratio = column.width
				? (column.width / layout.width) * sized
				: (unsized / (columns.length - layout.count))

			const columnWidth = width * ratio * modifier + delta;

			allocated += columnWidth;
			modifier *= (width - allocated) / (width - allocated + delta);

			return columnWidth;
		});
	}

	render() {
		const { columns } = this.state;
		const widths = CustomTable.calculateWidths({ width: this.props.width, ...this.state });

		const children = columns.map((column, i) => React.cloneElement(column.child, {
			width: widths[i],
			headerRenderer: i === columns.length - 1 ? undefined : this.headerRenderer
		}));

		return (<Table {...this.props}>
			{children}
		</Table>);
	}

	headerRenderer = ({
		columnData,
		dataKey,
		disableSort,
		label,
		sortBy,
		sortDirection
	}) => {
		return (<React.Fragment key={label}>
			<div className="ReactVirtualized__Table__headerTruncatedText">
				{label}
			</div>
			<Draggable
				axis="x"
				defaultClassName="DragHandle"
				defaultClassNameDragging="DragHandleActive"
				onStop={() => this.rationaliseDeltas() }
				onDrag={(event, { deltaX }) => this.resizeRow({ label, deltaX }) }
				position={{ x: 0 }}
				zIndex={999}
				>
				<span className="DragHandleIcon">⋮</span>
			</Draggable>
		</React.Fragment>);
	}

	rationaliseDeltas = () => {
		return this.setState((prevState, props) => {
			const widths = CustomTable.calculateWidths({ width: props.width, ...prevState });
			const columns = prevState.columns.map((column, i) => {
				return Object.assign({}, column, { width: widths[i] });
			});
			return { columns, deltas: {} };
		});
	};

	resizeRow = ({ label, deltaX }) => {
		return this.setState(prevState => {
			const deltas = Object.assign({}, prevState.deltas);
			deltas[label] = (deltas[label] || 0) + deltaX;
			return { columns: prevState.columns, deltas };
    	});
	};
}
