xdmp.addResponseHeader('Access-Control-Allow-Origin', 'http://localhost:8010');
xdmp.addResponseHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
xdmp.addResponseHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
xdmp.addResponseHeader('Access-Control-Allow-Credentials', "true");
//
// min max plot years
var yearMinPlot = 2000;
var yearMaxPlot = 2020;
//generate object with field names from Request fields
var fields =JSON.parse(xdmp.getRequestFieldNames());

var main_qry = "";
if(fields.mainQuery){
	main_qry = fields['mainQuery']
}
var this_qry = "";
if(fields.mainQuery){
	this_qry = fields['mainQuery'];
}
var instNames = "";
if(fields.institution){
	var instNames = fields['institution'].toLowerCase();
}

var thisCompName = "";
if(fields.instData.compName){
	thisCompName = fields.instData.compName.toLowerCase();
}

var resNames = "";
if(fields.researcher){
	resNames = fields.researcher.toLowerCase();
}

var docType = "";
if(fields.docType){
	docType = fields.docType;
}

var yearMin = fields.start_year;
if(fields.instData.start_year){
	yearMin = fields.instData.start_year;
}

var yearMax = fields.end_year;
if(fields.instData.end_year){
	yearMax = fields.instData.end_year;
}
var selectedCountry = "";
if(fields.selectedCountry){
	selectedCountry = fields.selectedCountry;
} 
if(fields.instData.selectedCountry){
	selectedCountry = fields.instData.selectedCountry;
}
var jsearch = require('/MarkLogic/jsearch.sjs');
var utilities = require('/lib/utilities.sjs');

//
// Make the topic list
qryList = [];
qryTitle = [];
//
// Form the arguments of the anded query
qryAnds = [];
qryAnds.push(cts.parse(this_qry));

//
// Loop over list of  resNames
if ((resNames != null) && (resNames.length > 0)) {
	resList = resNames.split(";");
	var qryResOr = [];
	for (var i = 0; i < resList.length; i++) {
		if (resList[i].length > 0) qryResOr.push(cts.jsonPropertyWordQuery('researcherName', resList[i]));
	}
	qryAnds.push(cts.orQuery([qryResOr]));
}
//
// Loop over list of instNames
if ((instNames != null) && (instNames.length > 0)) {
	instList = instNames.split(";");
	var qryInstOr = [];
	for (var i = 0; i < instList.length; i++) {
		if (instList[i].length > 0) qryInstOr.push(cts.jsonPropertyWordQuery('Institution_Name', instList[i]));
	}
	qryAnds.push(cts.orQuery([qryInstOr]));
}

if ((docType != null) && (docType.length > 0)) qryAnds.push(cts.jsonPropertyWordQuery('docOrigin', docType));
if ((yearMin != null) && (yearMin.length > 0)) qryAnds.push(cts.jsonPropertyRangeQuery('year','>=',parseInt(yearMin)));
if ((yearMax != null) && (yearMax.length > 0)) qryAnds.push(cts.jsonPropertyRangeQuery('year','<=',parseInt(yearMax)));
if ((selectedCountry != null) && (selectedCountry.length > 0)) qryAnds.push(cts.jsonPropertyWordQuery('Institution_CountryName', selectedCountry));
qryList.push(cts.andQuery([qryAnds]));
qryTitle.push("main");

// Now loop over topics and store results in return object
output = {};
for (i=0; i<qryList.length; i++) {
	qry = qryList[i];
	title = qryTitle[i];
	var res;
	res = jsearch.facets([
			jsearch.facet('year', 'year')
				 .orderBy('frequency')
   	 		 .slice(0, 17)			
			])
			 .where(
					qry			 	
				) 
		  .result()
//
// LOcate returned facets
	if (res) {
		var facRes = res['facets'];
//
// Turn the year data into an array
		years = facRes["year"];
		yearKeys = [];
		yearVals = [];
		var totalFiltered = 0;
		startYear = yearMinPlot;
		lastYear = yearMaxPlot;
		yearData = []
		yearNumbers = []
		for (iyear=0; iyear<(yearMaxPlot-yearMinPlot)+1; iyear++) {
			yearData[iyear] = 0;
			yearNumbers[iyear] = startYear + iyear;
		}
		if (years != null) {
			keysEach = Object.keys(years);
			for (var jj=0; jj<keysEach.length; jj++) {
				thisyear = keysEach[jj];
				num = years[thisyear];
				totalFiltered += num;
				yearKeys.push(thisyear);
				yearVals.push(num);
				thisYear = +parseInt(thisyear);
				yearIndex = thisyear - yearMinPlot;
				if ((yearIndex >=0) && (yearIndex <20)) {
					yearData[yearIndex] = num;
				}
				if (thisyear > lastYear) lastYear = thisyear;
			}
		}


//
// Now calculate momentum
		momentumVals = [];
		momentumKeys = [];
		momentumVals.push(0);
		momentumKeys.push(startYear+0);
		momentumVals.push(0);
		momentumKeys.push(startYear+1);
      for (yearIndex=2; yearIndex<(lastYear-startYear)+1; yearIndex++) {
			avgPrevious = (yearData[yearIndex-2] + yearData[yearIndex-1])/2.0;
			thisVal = 100*yearData[yearIndex]/avgPrevious;
			momentumVals.push(thisVal);
			momentumKeys.push(startYear+yearIndex);
		}
			
//
// Now for the output for this subquery
		suboutput = {};
		suboutput.yearNames = yearNumbers;
		suboutput.yearValues = yearData;
		suboutput.momentumKeys = momentumKeys;
		suboutput.momentumVals = momentumVals;
		suboutput.totalFiltered = totalFiltered;
//
// Attach this to the main output
		output[title] = suboutput;
//		output[title] = qry;
//
	}
}
//
// NOw do the exact same thing, but for our specific institution
//
// Make the topic list
qryList = [];
qryTitle = [];
//
// Form the arguments of the anded query
qryAnds = [];
qryAnds.push(cts.parse(this_qry));

//
// Loop over list of  resNames
if ((resNames != null) && (resNames.length > 0)) {
	resList = resNames.split(";");
	var qryResOr = [];
	for (var i = 0; i < resList.length; i++) {
		if (resList[i].length > 0) qryResOr.push(cts.jsonPropertyWordQuery('researcherName', resList[i]));
	}
	qryAnds.push(cts.orQuery([qryResOr]));
}
//
// one instName
if ((thisCompName != null) && (thisCompName.length > 0)) qryAnds.push(cts.jsonPropertyWordQuery('Institution_Name', thisCompName));

if ((docType != null) && (docType.length > 0)) qryAnds.push(cts.jsonPropertyWordQuery('docOrigin', docType));
if ((yearMin != null) && (yearMin.length > 0)) qryAnds.push(cts.jsonPropertyRangeQuery('year','>=',parseInt(yearMin)));
if ((yearMax != null) && (yearMax.length > 0)) qryAnds.push(cts.jsonPropertyRangeQuery('year','<=',parseInt(yearMax)));
if ((selectedCountry != null) && (selectedCountry.length > 0)) qryAnds.push(cts.jsonPropertyWordQuery('Institution_CountryName', selectedCountry));
qryList.push(cts.andQuery([qryAnds]));
qryTitle.push("oneInst");

// Now loop over topics and store results in return object
for (i=0; i<qryList.length; i++) {
	qry = qryList[i];
	title = qryTitle[i];
	var res;
	res = jsearch.facets([
			jsearch.facet('year', 'year')
				 .orderBy('frequency')
   	 		 .slice(0, 17)			
			])
			 .where(
					qry			 	
				) 
		  .result()
//
// LOcate returned facets
	if (res) {
		var facRes = res['facets'];
//
// Turn the year data into an array
		years = facRes["year"];
		yearKeys = [];
		yearVals = [];
		var totalFiltered = 0;
		startYear = yearMinPlot;
		lastYear = yearMaxPlot;
		yearData = []
		yearNumbers = []
		for (iyear=0; iyear<(yearMaxPlot-yearMinPlot)+1; iyear++) {
			yearData[iyear] = 0;
			yearNumbers[iyear] = startYear + iyear;
		}
		if (years != null) {
			keysEach = Object.keys(years);
			for (var jj=0; jj<keysEach.length; jj++) {
				thisyear = keysEach[jj];
				num = years[thisyear];
				totalFiltered += num;
				yearKeys.push(thisyear);
				yearVals.push(num);
				thisYear = +parseInt(thisyear);
				yearIndex = thisyear - yearMinPlot;
				if ((yearIndex >=0) && (yearIndex <20)) {
					yearData[yearIndex] = num;
				}
				if (thisyear > lastYear) lastYear = thisyear;
			}
		}

//
// Now calculate momentum
		momentumVals = [];
		momentumKeys = [];
		momentumVals.push(0);
		momentumKeys.push(startYear+0);
		momentumVals.push(0);
		momentumKeys.push(startYear+1);
      for (yearIndex=2; yearIndex<(lastYear-startYear)+1; yearIndex++) {
			avgPrevious = (yearData[yearIndex-2] + yearData[yearIndex-1])/2.0;
			if (avgPrevious > 0) {
				thisVal = 100*yearData[yearIndex]/avgPrevious;
				//thisVal = +(Math.round(thisVal + "e+2") + "e-2")
			} else {
				thisVal = 0.0;
			}
			momentumVals.push(thisVal);
			momentumKeys.push(startYear+yearIndex);
		}
			
//
// Now for the output for this subquery
		suboutput = {};
		suboutput.yearNames = yearNumbers;
		suboutput.yearValues = yearData;
		suboutput.momentumKeys = momentumKeys;
		suboutput.momentumVals = momentumVals;
		suboutput.totalFiltered = totalFiltered;
//
// Attach this to the main output
		output[title] = suboutput;
//		output[title] = qry;
//
	}
//
}  
//
// Now return everything
//xdmp.toJSON(object)
//xdmp.toJSON(res)
//xdmp.toJSON(oneres)
xdmp.toJSON(output)
//xdmp.toJsonString(output)
//xdmp.toJSON(countryList)
//xdmp.toJSON(output)
