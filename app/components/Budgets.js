import React, { Component } from 'react';
import { connect } from 'react-redux';

import { getBudgets } from '../selectors/buckets.js';

class Budgets extends Component {
	render() {
		let budgets = (this.props.budgets || []).map(budget => (<div className='budget' key={budget.name}>{budget.name}: {'$' + Number(budget.balance.toFixed(2)).toLocaleString('en') } </div>));
		return (<div className='budgets'>
			{budgets}
		</div>);
	}
}

const mapStateToProps = state => ({
	budgets: getBudgets(state)
});

export default connect(mapStateToProps)(Budgets);
