xdmp.addResponseHeader('Access-Control-Allow-Origin', '*');
xdmp.addResponseHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
xdmp.addResponseHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
xdmp.addResponseHeader('Access-Control-Allow-Credentials', "true");

//generate object with field names from Request fields
var fields ={};
var field_names = xdmp.getRequestFieldNames().toArray();
for(var fname_idx in field_names){
  fields[field_names[fname_idx]] = String(xdmp.quote(xdmp.getRequestField(String(field_names[fname_idx]))));
}
var instName = fields['instName'];

var jsearch = require('/MarkLogic/jsearch.sjs');
var utilities = require('/lib/utilities.sjs');

var res;
res = jsearch.documents()
	  .where(
   		cts.andQuery([
				cts.jsonPropertyWordQuery('Institution_Name', instName)
			])
		) 
		.slice(0,100000)
		.map({extract: {paths: ['/year','/institution/Institution_Name','/researcher/researcherName','/docOrigin']}})
	  .result();


//
// Loop over the results
var totalDocs = res['estimate']
var results = res['results'];

var docOriginCounts = {};
var yearCounts = {};
var researcherCounts = {};
var InstitutionCounts = {};

if (results) {
	for (var j=0; j<Object.keys(results).length; j++) {
		thisRes = results[j];
		resExtracted = thisRes['extracted'];
		researchers = ""
		institutions = ""
		year = ""
		docOrigin = ""
		title = ""
		var temp = [];
	//
	// Loop over the contents of this result and extract important data
		for (var i=0; i<resExtracted.length; i++){
			thisObj = resExtracted[i];

			var thisKey = Object.keys(thisObj)[0];
			var thisValue = String(thisObj[thisKey]);
			if (thisKey.localeCompare("researcherName") == 0) {
				researchers = thisValue.split(';');
				for (k=0; k<researchers.length; k++) {
					researcherCounts[researchers[k]] = researcherCounts[researchers[k]] ? researcherCounts[researchers[k]]+1 : 1;
				}
			} else if (thisKey.localeCompare("Institution_Name") == 0) {
				Institutions = thisValue.split(';');
				for (k=0; k<Institutions.length; k++) {
					if (Institutions[k].indexOf(instName) < 0) {
						InstitutionCounts[Institutions[k]] = InstitutionCounts[Institutions[k]] ? InstitutionCounts[Institutions[k]]+1 : 1;
					}
				}
			} else if (thisKey.localeCompare("year") == 0) {
				yearCounts[thisValue] = yearCounts[thisValue] ? yearCounts[thisValue]+1 : 1;
			} else if (thisKey.localeCompare("docOrigin") == 0) {
				docOriginCounts[thisValue] = docOriginCounts[thisValue] ? docOriginCounts[thisValue]+1 : 1;
			}
		}
	}
}
//
// Now sort the researchers by number
researcherKeysSorted = Object.keys(researcherCounts).sort(function(a,b){return researcherCounts[b]-researcherCounts[a]});
researcherCountsSorted = {}
for (k=0; k<researcherKeysSorted.length; k++) {
	key = researcherKeysSorted[k];
	researcherCountsSorted[key] = researcherCounts[key]
}
//
// Now sort the Institutions by number
InstitutionKeysSorted = Object.keys(InstitutionCounts).sort(function(a,b){return InstitutionCounts[b]-InstitutionCounts[a]});
InstitutionCountsSorted = {}
for (k=0; k<InstitutionKeysSorted.length; k++) {
	key = InstitutionKeysSorted[k];
	InstitutionCountsSorted[key] = InstitutionCounts[key]
}

var oneRes = {"instName": instName,"total":totalDocs, "yearCounts":yearCounts, "docOriginCounts":docOriginCounts, 
						"InstitutionTotal":Object.keys(InstitutionCounts).length, "InstitutionCounts":InstitutionCountsSorted,
						"researcherTotal":Object.keys(researcherCounts).length, "researcherCounts":researcherCountsSorted,
						};
//var oneRes = {"researchers":resExtracted};
  
//xdmp.toJSON(object)
//xdmp.toJSON(res)
//xdmp.toJSON(res)
xdmp.toJSON(oneRes)
//xdmp.toJSON(debug)
//xdmp.toJSON(output)
 
  
