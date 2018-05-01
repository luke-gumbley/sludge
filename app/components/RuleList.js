import React, { Component } from 'react';
import { connect } from 'react-redux';
import Rule from './Rule';
import GlyphButton from './GlyphButton';
import { editRule } from '../actions/rules.js';
import { getRules } from '../selectors/rules.js';

class RuleList extends Component {
	render() {
		var rules = this.props.rules.map(rule => {
			return (<Rule key={rule.id} rule={rule} />);
		});
		return (<div>
			{rules}
			<div className='container'>
				<div style={{flex: 2}}></div>
				<div><GlyphButton glyph="plus" onClick={this.props.onAdd} /></div>
			</div>
		</div>);
	}
}

const mapStateToProps = state => ({
	rules: getRules(state)
});

const mapDispatchToProps = dispatch => ({
	onAdd: rule => dispatch(editRule(null))
});

export default connect(mapStateToProps, mapDispatchToProps)(RuleList);
