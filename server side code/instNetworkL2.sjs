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
// Form the arguments of the anded query
qryAnds = [];
qryAnds.push(cts.parse(this_qry));

//
// Loop over list of  resNames
var qryResOr = [];
if ((resNames != null) && (resNames.length > 0)) {
	resList = resNames.split(";");
	for (var i = 0; i < resList.length; i++) {
		if (resList[i].length > 0) qryResOr.push(cts.jsonPropertyWordQuery('researcherName', resList[i]));
	}
}
//

if (docType) qryAnds.push(cts.jsonPropertyWordQuery('docOrigin', docType));
if (yearMin) qryAnds.push(cts.jsonPropertyRangeQuery('year','>=',parseInt(yearMin)));
if (yearMax) qryAnds.push(cts.jsonPropertyRangeQuery('year','<=',parseInt(yearMax)));
if (selectedCountry) qryAnds.push(cts.jsonPropertyWordQuery('Institution_CountryName', selectedCountry));
if (resNames) qryAnds.push(cts.orQuery([qryResOr]));
if (thisCompName) qryAnds.push(cts.jsonPropertyWordQuery('Institution_Name', thisCompName));
qryList = [];
qryList.push(cts.andQuery([qryAnds]));

//get facets
var facets =
jsearch.facets
([
  jsearch.facet('Institution_Name', 'Institution_Name').orderBy('frequency').slice(0,10),
  jsearch.facet('researcherName', 'researcherName').orderBy('frequency').slice(0,10)
])
.where(qryList)
.result()
resFacets = facets['facets'];
instList = resFacets['Institution_Name'];
resList = resFacets['researcherName'];
//
// Save the main institution
output = [];
thisResult = {'type':'main','name':thisCompName,'instList':instList,'resList':resList};
output.push(thisResult);
//
// Now loop over top 10 links institutions and find their links


//
// Loop over all pairs
var names = [];
var nameTypes = [];
for(instKey in instList){
	qryList = [];
	qryAnds.pop();
	if ((instKey != null) && (instKey.length > 0)) qryAnds.push(cts.jsonPropertyWordQuery('Institution_Name', instKey));	
	qryList.push(cts.andQuery([qryAnds]));

	//get facets
	var facets =
	jsearch.facets
	([
	  jsearch.facet('Institution_Name', 'Institution_Name').orderBy('frequency').slice(0,10),
	  jsearch.facet('researcherName', 'researcherName').orderBy('frequency').slice(0,10)
	])
	.where(qryList)
	.result()
	resFacets = facets['facets'];
	instList = resFacets['Institution_Name'];
	resList = resFacets['researcherName'];
	thisResult = {'type':'subInst','name':instKey,'instList':instList,'resList':resList};
	output.push(thisResult);
}
//
// Loop over the output (skip first since it is double counted)
var instListNew = {};
var resListNew = {};
pairs = []
for (var i=1; i<output.length; i++) {
//
// Temp lists
	var instListTemp = {};
	var resListTemp = {};
	var instListArray = [];
	var resListArray = [];
	thisResult = output[i];
	thisInstList = thisResult['instList'];
	for(key in thisInstList){
		var val = thisInstList[key];
		instListNew[key] = (instListNew[key] || 0) + val;
		if (instListTemp[key]) {
			instListTemp[key] = instListTemp[key] + val;
		} else {
			instListTemp[key] = val;
			instListArray.push(key);
		}
	}
	thisResList = thisResult['resList'];
	for(key in thisResList){
		var val = thisResList[key];
		var keyParts = key.split(',');
		if (keyParts.length > 1) {
			if (keyParts[1].length >0) {
				key = keyParts[0]+","+keyParts[1].charAt(0);
			}
		} 
		resListNew[key] = (resListNew[key] || 0) + val;
		if (resListTemp[key]) {
			resListTemp[key] = resListTemp[key] + val;
		} else {
			resListTemp[key] = val;
			resListArray.push(key);
		}
	}
//
// Using the temp lists, make the edge list
// -- edges between all instiutitons
	for(ii=0; ii<instListArray.length-1; ii++){
		for(jj=ii+1; jj<instListArray.length; jj++){
			pair={'a':instListArray[ii],'b':instListArray[jj],'weight':1}
			pairs.push(pair);
		}
	}
// -- edges between main instiutiton and researchers
	for(ii=0; ii<resListArray.length; ii++){
		pair={'a':instListArray[0],'b':resListArray[ii],'weight':1}
		pairs.push(pair);
	}
	
}
newoutput = {'institutionNodes':instListNew,'researcherNodes':resListNew,'edges':pairs};

//
// Now return everything
//xdmp.toJSON(object)
//xdmp.toJSON(res)
//xdmp.toJSON(oneres)
xdmp.toJSON(newoutput)
//xdmp.toJsonString(output)
//xdmp.toJSON(countryList)
//xdmp.toJSON(output)
