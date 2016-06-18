'use strict';

import React from 'react'
import ReactDOM from 'react-dom'
import ParallelCoordinatesComponent from '../'//react-parallel-coordinates.js'


class PCTest extends React.Component {
	constructor (props) {
		super(props)
		this.state={
			brushing: {},
			width: props.minWidth,
			height: props.minHeight
		}
		this._bind('brushUpdated', 'handleResize');
	}
	_bind(...methods) {
		methods.forEach( (method) => this[method] = this[method].bind(this) );
	}
	debugOutput () {
		return (
			<p>Number of brushed images: {this.state.brushing.length}</p>
		)
	}
	handleResize(e) {
		let newWidth = ReactDOM.findDOMNode(this).offsetWidth;
		if (newWidth < this.props.minWidth) { newWidth = this.props.minWidth; }
		this.setState({width: newWidth});
	}
	componentDidMount() {
		this.handleResize()
		window.addEventListener('resize', this.handleResize);
	}
	componentWillUnmount() {
		window.removeEventListener('resize', this.handleResize);
	}
	brushUpdated (data) {
		this.setState({brushing: data})
	}
	render () {
		let {
			data,
			dimensions, // array of objects; compare format: http://bl.ocks.org/syntagmatic/0d1635533f6fb5ac4da3
			initialBrushExtents, // set initial brush extents, change them with ??? ParallelCoordinatesComponent. ???
			onBrush_extents, // this is called with current brush extents
			onBrushEnd_extents, // same
			onBrushEnd_data, // this is called with the complete data of all brushed items
		} = this.props



		return (
			<div>
				<ParallelCoordinatesComponent data={data} height={this.state.height} width={this.state.width}
					dimensions={dimensions}
					dimensionTitleRotation={-50}
					initialBrushExtents={initialBrushExtents}
					onBrush_extents={onBrush_extents} onBrushEnd_extents={onBrushEnd_extents} onBrushEnd_data={this.brushUpdated} />
				<div className='debugOutput'>{this.debugOutput()}</div>
			</div>
		)
	}
}





//let _dimensionTypes=["number","number","number","number","number","string"]; // remove types? dont change anything
//let _dimensionTitles=["d0","d1","d2","d3","d4","d5"];
let _dimensions=[
	{
		key: "0",
		description: "dim0",
		type: "number",
	},
	{
		key: "1",
		description: "dim1",
		type: "number",
	},
	{
		key: "2",
		description: "dim2",
		type: "number",
	},
	{
		key: "3",
		description: "dim3",
		type: "number",
		isVisible: false,
	},
	{
		key: "4",
		description: "dim4",
		type: "string",
	},
	{
		key: "5",
		description: "dim5",
		type: "string",
	},
]

let _data=[
	[0,-0,0,0,"yes",1],
	[1,-1,1,2,"no",1],
	[2,,4,4,"yes",1],
	[3,,9,6,,],
	[4,-4,16,8,"yes",1]
];
let _initialBrushExtents={1:[-1.75,-0.8]};
let _onBrush = function(d) {};
let _onBrushEnd = function(d) {console.log(d)};

ReactDOM.render(
	<PCTest minWidth={500} minHeight={150} dimensions={_dimensions} initialBrushExtents={_initialBrushExtents} data={_data} onBrush_extents={_onBrush} onBrushEnd_extents={_onBrushEnd} onBrushEnd_data={_onBrushEnd}></PCTest>,
	document.querySelectorAll('.mygraph')[0]
)
