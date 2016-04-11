'use strict';

var React = require ('react')
var ReactDOM = require ('react-dom')
var _ = require ('lodash')
var d3 = require ('d3')
var parcoords = require ('./parallel-coordinates/d3.parcoords.js')

require('./parallel-coordinates/d3.parcoords.css'); // TODO: find a css solution that refrains from using globals

var ParallelCoordinatesComponent = React.createClass ({
	getDefaultProps: function() {
		return {
			state: {}
		};
	},
	onBrushEnd: function (data) {
		//data = _.map(data, function (d) { return ({ id: d.id, name: d.name }) })
		this.props.onBrushEnd_data(data)
		var ratio = 100/data.length
		this.pc.alpha( _.min([1,_.max([ratio,0.04])]) ).render()
		this.props.onBrushEnd_extents(this.pc.brushExtents())
		//console.log(ratio);
	},
	onBrush: function (data) {
		var ratio = 100/data.length
		this.pc.alpha( _.min([1,_.max([ratio,0.04])]) ).render()
		this.props.onBrush_extents(this.pc.brushExtents())
	},
	componentDidMount: function () { // component is now in the DOM

		var self = this
		var DOMNode = ReactDOM.findDOMNode(this)

		this.pc = d3.parcoords({
				//alpha: 0.2,
				color: "#069",
				shadowColor: "#f3f3f3", // does not exist in current PC version
				width: this.props.width,
				height: this.props.height,
				dimensionTitleRotation: this.props.dimensionTitleRotation || -50,
				margin: { top: 33, right: 0, bottom: 12, left: 0 },
				nullValueSeparator: "bottom"
			})( DOMNode )

		var ratio = 100/this.props.data.length;

		var types = _.zipObject(_.map(this.props.dimensions, (d, key)=>{return key}), _.map(this.props.dimensions, (d)=>{return d.type}))

		//var dimensions = _.map(this.props.dimensions, (d, key)=>{return key})
		//var dimensionTitles = _.map(this.props.dimensions, (d)=>{return d.description})
		var dimensions = _.map(this.props.dimensionsVisible, (d, key)=>{return d.value})
		var dimensionTitles = _.map(this.props.dimensionsVisible, (d, key)=>{return d.label})

		this.pc = this.pc
			.data(this.props.data)
			.alpha( _.min([1,_.max([ratio,0.04])]) )
			.composite("source-over") // globalCompositeOperation "darken" may be broken in chrome, "source-over" is boring
			.mode("queue")
			//
			// TODO: once dimensions-metadata is available in d3 par coords, this will be a single call
			//.types(types)
			.dimensions(this.props.dimensions)
			// show/hide dimensions [0,1,2,3,4,5]
			//.dimensionTitles(dimensionTitles)
			.render()
			.shadows()
			////////////.commonScale(false, "number", [0,1])
			////////////.tickValues([0.00,0.25,0.50,0.75,1.00]) //[0,0.25,0.5,0.75,1.0]
			////////////.tickFormat('')
			.createAxes()
      .flip(['month'])
			.reorderable()
			.brushMode("1D-axes") // enable brushing
			.on("brushend", function (d) { self.onBrushEnd(d) })
			.on("brush", function (d) { self.onBrush(d) })
			//////////.on("resize", function (d) { console.log('onResize') })
			//////////.on("highlight", function (d) { console.log('onHighlight') })
			//////////.on("render", function (d) { console.log('onRender') })
    /*
    setTimeout(()=> 
               {
                this.pc.flip(['month']);
                this.pc.render();
                this.pc.createAxes()
                    .reorderable()
                    .brushMode("1D-axes") // enable brushing
                    .on("brushend", function (d) { self.onBrushEnd(d) })
                    .on("brush", function (d) { self.onBrush(d) })
               }, 
               1000);
    */
			

		if (this.props.initialBrushExtents) {// set initial brushes
			this.pc.brushExtents(this.props.initialBrushExtents)
		}
		//this.pc.render()
	},
	componentDidUpdate: function () { // update w/ new data http://blog.siftscience.com/blog/2015/4/6/d-threeact-how-sift-science-made-d3-react-besties
		//console.log('componentDidUpdate')
		var self = this
		
		// keep brush
		var brushExtents = this.pc.brushExtents()
		
		//var dimensions = _.map(this.props.dimensionsVisible, (d, key)=>{return d.value})
		var dimensionTitles = _.map(this.props.dimensionsVisible, (d, key)=>{return d.label})
		this.pc = this.pc
			.width(this.props.width)
			.height(this.props.height)
			.dimensions(this.props.dimensions)
			//.dimensionTitles(dimensionTitles)
			.autoscale()
			.unhighlight([])
			.render()
			.shadows()
			.createAxes()
			.reorderable()
			.brushMode("None") // enable brushing
			.brushMode("1D-axes") // enable brushing
			.brushExtents(brushExtents)
			.on("brushend", function (d) { self.onBrushEnd(d) })
			.on("brush", function (d) { self.onBrush(d) })
      .flip(['month'])
			
    console.log('been here');
		if (this.props.dataHighlighted !== undefined && this.props.dataHighlighted.length > 0) {
			this.pc = this.pc.highlight(this.props.dataHighlighted)
		}
		
	},/*,
	componentWillUnmount: function () { // clean up
		console.log('componentWillUnmount')
	},*/
	shouldComponentUpdate: function (nextProps, nextState) {
		//return false
		
		return (
			(JSON.stringify(nextProps.dimensionsVisible) !== JSON.stringify(this.props.dimensionsVisible)) ||
			(JSON.stringify(nextProps.dataHighlighted) !== JSON.stringify(this.props.dataHighlighted) ||
			(nextProps.width != this.props.width) || (nextProps.height != this.props.height))
			)
		//return (nextProps !== this.props)
	},
	render: function () {
		var style = {
			width: this.props.width,
			height: this.props.height,
			position: 'relative'
		};
		//return (<div className={'parcoords'} style={style}></div>)
		return React.createElement('div', { className: 'parcoords', style: style });
	}
})


module.exports = ParallelCoordinatesComponent;
