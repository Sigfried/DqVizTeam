import 'babel-core/polyfill';
import React from 'react';
import ReactDOM, { render } from 'react-dom';
import { Grid, Row, Col, Glyphicon, Button, Panel, ButtonToolbar, 
         Input, Tabs, Tab } from 'react-bootstrap';
import d3 from 'd3';
import _ from 'supergroup-es6';
//import _ from './node_modules/supergroup-es6/src/es6.supergroup';
require('expose?$!expose?jQuery!jquery');
require("bootstrap-webpack");
require("!style!css!less!./style.less");
require("!style!css!./d3.parcoords.css");
var ParallelCoordinatesComponent=require('react-parallel-coordinates');


class App extends React.Component {
  constructor() {
    super();
    this.state = {selected:{}};
  }
  render() {
    const files = ['condition_occurrence','drug_exposure','visit_occurrence', 
                    'observation', 'measurement', 'care_site', 'death', 
                    'procedure_occurrence','device_exposure', 'person',];
    window.state = this.state;
    return (
      <Row>
        <Col md={10} mdOffset={1}>
          <Row>
            <h3>DQ Viz, Files explorer with parallel coordinates</h3>
          </Row>
          <Row>
            <Col md={12}>
              <ParCoords 
                selectedData={this.selectedData.bind(this)}
                allDataReady={this.allDataReady.bind(this)}
              />
            </Col>
          </Row>
          <FileChooser 
              files={files}
              fetchData={this.fetchData.bind(this)}
              getData={this.getData.bind(this)}
              dataReady={this.dataReady.bind(this)}
              dataFetched={this.dataFetched.bind(this)}
              selectData={this.selectData.bind(this)}
            />
        </Col>
      </Row>
    );
  }
  fetchData(label) {
    if (!this.state[lkey(label)]) {
      this.setState({[lkey(label)]: 'loading'});
      d3.csv(`CDM_${label.toUpperCase()}.csv`, data => {
        this.setState({[lkey(label)]: data});
      });
    }
  }
  dataReady(label) {
    return this.state[lkey(label)] && this.state[lkey(label)] !== "loading";
  }
  allDataReady() {
    return _.every(this.selectedData(),
      (recs,label) => Array.isArray(recs));
  }
  dataFetched(label) {
    return !!this.state[lkey(label)] || this.state[lkey(label)] === "loading";
  }
  getData(label) {
    return this.state[lkey(label)];
  }
  selectData(label, bool=true) {
    let selected = this.state.selected;
    if (bool)
      selected[label] = true;
    else
      delete selected[label];
    this.setState({selected});
  }
  selectedData() {
    return (
      _.chain(this.state.selected)
       .keys()
       .map(label=>[label,this.state[lkey(label)]])
       .object().value());
  }
}
function lkey(label) {
  return `data_${label}`;
}
class FileChooser extends React.Component {
  constructor() {
    super();
    this.state = {filesShown: {}};
    //debugger;
    //this.props.files.forEach(label=>this.state.filesShown[label] = false);
  }
  render() {
    let {filesShown} = this.state;
    let {files, fetchData, getData, dataReady, dataFetched, selectData} = this.props;
    const groupsOf4 = 
      _.chunk(files, 4)
       .map((grp,i) => 
            <Row key={i}>
              {grp.map(label=>
                <Col md={3} className="text-center" key={label}>
                  <Button 
                    bsStyle={
                      !filesShown[label] ? 'default' :
                      dataReady(label) ? 'success' : dataFetched ? 'info' : 'primary'}
                    onClick={
                      ()=>{
                        if (!dataFetched(label))
                          fetchData(label);
                        filesShown[label] = !filesShown[label];
                        this.setState({filesShown});
                        selectData(label, filesShown[label]);
                      }}
                  >{label}</Button>
                  <CSVInfo 
                      show={filesShown[label] && dataReady(label)}
                      data={getData(label)}
                    />
                </Col>)}
            </Row>);
    return <div>{groupsOf4}</div>;
  }
}
class LoaderButton extends React.Component {
}
class CSVInfo extends React.Component {
  constructor() {
    super();
    this.state = {};
  }
  render() {
    const {show, data} = this.props;
    if (!show) return <div/>;
    //if (loading) return <div>Loading {filename}</div>;
    return  <div>
              {data.length} records loaded
              <ul>
                {_.keys(data[0]).map(k=><li key={k}>{k}: {colStats(data,k).distinctVals} vals</li>)}
              </ul>
            </div>
  }
}
function colStats(recs, col) {
  let sg = _.supergroup(recs,col);
  //let missing = 
  return {distinctVals: sg.length};
}

d3.select('#root').append('div').attr('class','parcoords').attr('id','pc')
  .style('width','900px').style('height','250px');

class ParCoords extends React.Component {
  render() {
    return (
      <div className="parcoords"
           style={{width:900, height:250}} />
    );
  }
  componentDidUpdate() {
    const {selectedData, allDataReady} = this.props;
    let el = ReactDOM.findDOMNode(this);
    el.innerHTML = '';
    if (!allDataReady()) return;
    console.log(selectedData());
    let dimensions = {
      month: {type:"string"}
    };
    for (let label in selectedData()) {
      dimensions[label] = {type:"number"};
    }
    const data = this.dataSetup();
    d3.parcoords()(el)
                  .dimensions(dimensions)
                  .data(data)
                  .render()
                  .createAxes();
  }
  componentDidMount() {
    let el = ReactDOM.findDOMNode(this);
    this.parcoords = d3.parcoords()(el)
      //.data(data) .render() .createAxes();
  }
  extract(rec, label, lineby) {
    if (lineby === 'month') {
      if (label === 'condition_occurrence') {
        var field = 'CONDITION_START_DATE';
      } else if (label === 'drug_exposure') {
        field = 'DRUG_EXPOSURE_START_DATE';
      } else if (label === 'device_exposure') {
        field = 'DEVICE_EXPOSURE_START_DATE';
      } else if (label === 'visit_occurrence') {
        field = 'VISIT_START_DATE';
      } else if (label === 'observation') {
        field = 'OBSERVATION_DATE';
      } else if (label === 'measurement') {
        field = 'MEASUREMENT_DATE';
      } else if (label === 'death') {
        field = 'DEATH_DATE';
      } else if (label === 'procedure_occurrence') {
        field = 'PROCEDURE_DATE';
      }
      return rec[field].substr(0,6);
    }
  }
  dataSetup(lineby='month') {
    const {selectedData} = this.props;
    let prepd = [];
    prepd = 
      _.chain(selectedData())
        .map((recs, label)=>{
          return recs.map(rec=>{return {
            month: this.extract(rec,label,lineby),
            label: label
          }});
        })
        .flatten()
        .supergroup(['month','label'])
        .value()
    let pcrecs = prepd.map(month=>{
      let pcrec={month:month.valueOf()}; 
      //console.log(month.children[0].records);
      month.children.forEach(lbl=>{
        pcrec[lbl]=lbl.records.length
      });
      return pcrec
    });
    return pcrecs;
  }
}

render(
  <App/> ,
  document.getElementById('root')
);
if (process.env.NODE_ENV !== 'production') {
  // Use require because imports can't be conditional.
  // In production, you should ensure process.env.NODE_ENV
  // is envified so that Uglify can eliminate this
  // module and its dependencies as dead code.
  //require('./createDevToolsWindow')(store);
}
