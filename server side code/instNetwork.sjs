xdmp.addResponseHeader('Access-Control-Allow-Origin', 'http://localhost:8010');
xdmp.addResponseHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
xdmp.addResponseHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
xdmp.addResponseHeader('Access-Control-Allow-Credentials', "true");
//
// min max plot years
var yearMinPlot = 2000;
var yearMaxPlot = 2020;
//generate object with field names from Request fields
var fields ={};
var field_names = xdmp.getRequestFieldNames().toArray();
for(var fname_idx in field_names){
  fields[field_names[fname_idx]] = String(xdmp.quote(xdmp.getRequestField(String(field_names[fname_idx]))));
}
var main_qry = fields['main_qry'];
var this_qry = fields['this_qry'];
var instNames = fields['instName'];
var thisCompName = fields['thisCompName'];
if ((instNames!=null)  && (instNames!='undefined')) {
	instNames = instNames.toLowerCase();
} else {
	instNames = null;
}
if ((thisCompName!=null)  && (thisCompName!='undefined')) {
	thisCompName = thisCompName.toLowerCase();
} else {
	thisCompName = null;
}
var resNames = fields['resName']
if ((resNames!=null)  && (resNames!='undefined')) {
	resNames = resNames.toLowerCase();
} else {
	resNames = null;
}
var docType = fields['docType']
if (docType=='undefined') {
	docType = null;
}
var yearMin = fields['yearMin']
if (yearMin=='undefined') {
	yearMin = null;
}
var yearMax = fields['yearMax']
if (yearMax=='undefined') {
	yearMax = null;
}
var selectedCountry = fields['selectedCountry']
if ((selectedCountry!=null)  && (selectedCountry!='undefined')) {
	selectedCountry = selectedCountry.toLowerCase();
} else {
	selectedCountry = null;
}
var jsearch = require('/MarkLogic/jsearch.sjs');
var utilities = require('/lib/utilities.sjs');
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
qryList = [];
qryList.push(cts.andQuery([qryAnds]));

var qry_str = String(qryList);

//get facets
var facets =
jsearch.facets
([
  jsearch.facet('Institution_Name', 'Institution_Name').orderBy('frequency').slice(0,100),
  jsearch.facet('researcherName', 'researcherName').orderBy('frequency').slice(0,100)
])
.where(qryList)
.result()
resFacets = facets['facets'];
instList = resFacets['Institution_Name'];
resList = resFacets['researcherName'];
//
// Loop over all pairs
var names = [];
var nameTypes = [];
for(instKey in instList){
//  var value = instList[instKey];
//  resName = value
	names.push(instKey);
	nameTypes.push('Institution_Name');
}
for(resKey in resList){
//  var value = resList[resKey];
//  resName = value
	names.push(resKey);
	nameTypes.push('researcherName');
}
//
// NOw loop over all pairs and count
pairs = []
/*
for (var i = 0; i < names.length - 1; i++) {
	for (var j = i+1; j < names.length; j++) {
//
// Only look at pairs which include institutions which are not the main institution
		if (((nameTypes[i] == 'Institution_Name') && (names[i] != thisCompName) && (nameTypes[j] == 'researcherName')) 
				|| ((nameTypes[j] == 'Institution_Name') && (names[j] != thisCompName) && (nameTypes[i] == 'researcherName')) ) {
			var qry = [];
			if (nameTypes[i] == 'Institution_Name') {
				qry.push(cts.jsonPropertyWordQuery('Institution_Name',names[i]));
			} else {
				qry.push(cts.jsonPropertyWordQuery('researcherName',names[i]));
			}
			if (nameTypes[j] == 'Institution_Name') {
				qry.push(cts.jsonPropertyWordQuery('Institution_Name',names[j]));
			} else {
				qry.push(cts.jsonPropertyWordQuery('researcherName',names[j]));
			}
//		var numThisPair = cts.estimate(cts.search(cts.andQuery(qry)));
			var numThisPair = cts.estimate(cts.andQuery(qry));
//     qryFacets
//	 var res = jsearch.documents().where(qry)
//		 .map({snippet:true})
//		 .result();  
//	 numThisPair = res.estimate;
//		numThisPair = 1;
			if (numThisPair > 0) {
				pair={'a':names[i],'b':names[j],'weight':numThisPair}
				pairs.push(pair);
			}
		}
	}
}
*/
output = {'institutionNodes':instList,'researcherNodes':resList,'edges':pairs};
//
// Now return everything
//xdmp.toJSON(object)
//xdmp.toJSON(res)
//xdmp.toJSON(oneres)
xdmp.toJSON(output)
//xdmp.toJsonString(output)
//xdmp.toJSON(countryList)
//xdmp.toJSON(output)
