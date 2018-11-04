import React, { Component } from 'react';


import { InfiniteLoader, Column, Table, AutoSizer } from 'react-virtualized';
import Draggable from 'react-draggable';

export default class CustomTable extends Component {

	constructor(props) {
		super(props);

		let totalWidth = 0;
		const widths = React.Children.map(this.props.children, child => {
			totalWidth += child.props.width;
			return {
				width: child.props.width,
				dataKey: child.props.dataKey
			};
		});

		widths.forEach(w => w.width /= totalWidth);
		this.state = { widths };
	}

	render() {
		const { widths } = this.state;
		const width = this.props.width;
		const columns = React.Children.count(this.props.children);

		const children = React.Children.map(this.props.children, (child, i) => {
			//console.log(width * widths[i]);
			return React.cloneElement(child, {
				width: width * widths[i].width,
				headerRenderer: i === columns - 1 ? undefined : this.headerRenderer
			});
		});

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
		return (<React.Fragment key={dataKey}>
			<div className="ReactVirtualized__Table__headerTruncatedText">
				{label}
			</div>
			<Draggable
				axis="x"
				defaultClassName="DragHandle"
				defaultClassNameDragging="DragHandleActive"
				onDrag={(event, { deltaX }) => this.resizeRow({ dataKey, deltaX }) }
				position={{ x: 0 }}
				zIndex={999}
				>
				<span className="DragHandleIcon">⋮</span>
			</Draggable>
		</React.Fragment>);
	}

	resizeRow = ({ dataKey, deltaX }) => {
		return this.setState(prevState => {
			const prevWidths = prevState.widths;
			const percentDelta = deltaX / this.props.width;

			let increment = 0;
			const widths = prevWidths.map((w, i) => {
				w = Object.assign({}, w, { width: w.width + increment });
				if(w.dataKey === dataKey && !increment) {
					w.width += percentDelta;
					increment = -percentDelta/(prevWidths.length - i - 1);
				}
				return w;
			});

			return { widths };
    	});
	};
}
