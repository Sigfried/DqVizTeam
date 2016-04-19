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
//require("!style!css!./lib/parallel-coordinates/style.css");
require("!style!css!./lib/parallel-coordinates/d3.parcoords.css");
//require("./lib/sylvester.src.js");
//require("./lib/d3.svg.multibrush/d3.svg.multibrush.js");
//require("./lib/parallel-coordinates/d3.parcoords.js");
var ParallelCoordinatesComponent=require('./react-parallel-coordinates/react-parallel-coordinates');

let FILELABELS = [
                'visit_occurrence', 
                'condition_occurrence',
                'drug_exposure',
                'observation', 'measurement', //'care_site', 
                 'procedure_occurrence',
                 //'device_exposure', 'death', 
              ];
//const LINEBY = 'month';
const LINEBY = 'age';
if (LINEBY === 'age') {
  FILELABELS.unshift('person');
}

function extractDate(rec, label) {
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
  //return rec[field].replace(/(....)(..)(..)/,"$2/01/$1");
  return new Date(rec[field].replace(/(....)(..)(..)/,"$1-$2-01"));
}
function dataSetup(selectedData) {
  if (LINEBY === 'age')
    return dataSetupAge(selectedData);
  let prepd = [];
  prepd = 
    _.chain(selectedData)
      .map((recs, label)=>{
        if (label === "condition_occurrence") // manufacture data quality problem
                                              // delete conditions in last quarter 2008
          recs = recs.filter(
            d => !d.CONDITION_START_DATE.match(/^20081/) ||
                 d.PERSON_ID % 2);
        return recs.map(rec=>{return {
          month: extractDate(rec,label),
          label: label
        }});
      })
      .flatten()
      .value()
  prepd.push(... 
    _.supergroup(selectedData.visit_occurrence,
     [d=>new Date(d.VISIT_START_DATE.replace(/(....)(..)(..)/,"$1-$2-01")),
       'PERSON_ID'])
     .leafNodes().map(d=>{return {label:'patient_count',month:d.parentNode.val}}));

  let pcrecs = _.supergroup(prepd, ['month','label'])
    .map(month=>{
      let pcrec={month:month.val}; 
      month.children.forEach(lbl=>{
        pcrec[lbl]=lbl.records.length
      });
      return pcrec
    });
  return pcrecs;
}
function dataSetupAge(selectedData) {
  // calculate age based on date of first visit
  let personVisits = _.supergroup(selectedData.visit_occurrence, 'PERSON_ID');
  let ages = {};
  selectedData.person.forEach(p => {
    let person = personVisits.lookup(p.PERSON_ID);
    if (person) {
      let firstVisit = new Date(
            _.chain(person.records).pluck('VISIT_START_DATE')
                .map(d=>d.replace(/(....)(..)(..)/,"$1-$2-$3"))
                .sort().first().value());
      let age = Math.floor(
        (firstVisit - 
        new Date(`${p.YEAR_OF_BIRTH}-${p.MONTH_OF_BIRTH}-${p.DAY_OF_BIRTH}`))
        / (1000 * 60 * 60 * 24 * 365.25));
      ages[p.PERSON_ID] = age;
      p.age = age;
    }
  });

  let prepd = [];
  prepd = 
    _.chain(selectedData)
      .map((recs, label)=>{
          return _.chain(recs).map(rec=>{
                      if (typeof ages[rec.PERSON_ID] !== "undefined") {
                        return { age: ages[rec.PERSON_ID], label: label };
                      }
                   }).compact().value();
      })
      .flatten()
      .value()
  prepd.push(... 
    _.supergroup(selectedData.person, ['age', 'PERSON_ID'])
     .leafNodes()
     .map(d=>{return {label:'patient_count',age:d.parentNode.val}}));

  let pcrecs = _.supergroup(prepd.filter(d=>typeof d.age !== "undefined"), ['age','label'])
    .map(age=>{
      let pcrec={age:age.val}; 
      age.children.forEach(lbl=>{
        pcrec[lbl]=lbl.records.length
      });
      return pcrec
    });
  return pcrecs;
}
class App extends React.Component {
  constructor() {
    super();
    this.state = {selected:{},
                  processedData: [],
                  dimensions: {},
                 };
  }
  render() {
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
                data={this.state.processedData}
                dimensions={this.state.dimensions}
                width={900} height={400}
                onBrushEndData={this.onBrushEndData.bind(this)}
              />
            </Col>
          </Row>
          <Row>
            <Col md={12}>
              <ul style={{maxHeight:170, width:'100%', overflow:'auto',
                          border:'1px solid brown',
                        }} >
                {this.state.brushedData}
              </ul>
            </Col>
          </Row>
          <FileChooser 
              fileLabels={FILELABELS}
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
  componentDidMount() {
    FILELABELS.forEach(label => {
      this.fetchData(label)
      this.selectData(label, true);
    });
  }
  onBrushEndData(data) {
    var fmt = d3.time.format("%Y-%m-%d");
    var fields = ['visit_occurrence', 
                  'patient_count',
                  'condition_occurrence',
                  'drug_exposure',
                  'observation', 'measurement',
                  'procedure_occurrence'];
    console.log(data);
    let brushedData = data.map((d,i)=>
        <li key={i}>
          {fmt(d.month)}
          <ul><li>
            {fields.map(f=>`${f}: ${d[f]}`).join(', ')}
          </li></ul>
        </li>)
    this.setState({brushedData});
  }
  fetchData(label) {
    if (!this.state[lkey(label)]) {
      this.setState({[lkey(label)]: 'loading'});
      d3.csv(`CDM_${label.toUpperCase()}.csv`, data => {
        //console.log('got data', data);
        this.setState({[lkey(label)]: data});
        if (this.allDataReady()) {
          let processedData = dataSetup(this.selectedData());
          let dimensions = {};
          if (LINEBY === 'month')
            dimensions[LINEBY] = { type:"date"};
          else
            dimensions[LINEBY] = { type:"number"};
          dimensions.patient_count = { type:"number", };
          for (let label in this.selectedData()) {
            if (label !== 'person') // no person dimension
              dimensions[label] = {type:"number"};
          }
          //processedData = processedData.sort((a,b)=>b.month<a.month ? -1 : a.month<b.month ? 1 : 0);
          this.setState({processedData, dimensions});
        }
      });
    }
  }
  dataReady(label) {
    return this.state[lkey(label)] && this.state[lkey(label)] !== "loading";
  }
  allDataReady() {
    return !_.isEmpty(this.selectedData()) && _.every(this.selectedData(),
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
    let {fileLabels, fetchData, getData, dataReady, dataFetched, selectData} = this.props;
    //console.log('filechooser render');
    //console.log(fileLabels.map(label=>dataReady(label)).join(','));
    const groupsOf4 = 
      _.chunk(fileLabels, 4)
       .map((grp,i) => 
            <Row key={i}>
              {grp.map(label=>
                <Col md={3} className="text-center" key={label}>
                  <Button 
                    bsStyle={
                      //!filesShown[label] ? 'default' :
                      dataReady(label) ? 
                        'success' : dataFetched(label) ? 
                                      'default' : 'primary'
                                      //'info' : 'primary'
                    }
                    onClick={
                      ()=>{
                        //if (!dataFetched(label)) fetchData(label);
                        filesShown[label] = !filesShown[label];
                        this.setState({filesShown});
                        //selectData(label, filesShown[label]);
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

class ParCoords extends React.Component {
  render() {
    const {data, dimensions, onBrushEndData} = this.props;
    let onBrush = function(d) {};
    let onBrushEnd = function(d) {
      console.log(d)};
    //console.log(data, dimensions);
    if (!data || !data.length)
      return <div/>;
    return (
      <div className="parcoords"
          style={{width:this.props.width, height:this.props.height}} >
        <ParallelCoordinatesComponent 
              dimensions={dimensions} data={data} 
              height={400} width={Object.keys(dimensions).length * 100} 
              bundlingStrength={0.2}
              smoothness={0.15}
              bundleDimension={LINEBY}
              onBrush_extents={onBrush} 
              onBrushEnd_extents={onBrushEnd} 
              onBrushEnd_data={onBrushEndData}
              />
      </div>
    );
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
