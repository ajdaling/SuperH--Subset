xdmp.addResponseHeader('Access-Control-Allow-Origin', 'http://localhost:8010');
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
if (instName != "") {
	res = jsearch.facets(
   	 jsearch.facet('Institution_Name', 'Institution_Name')
		 .orderBy('frequency')
   	 .slice(0, 50))
		 .where(
   			cts.andQuery([
					cts.jsonPropertyWordQuery('Institution_Name', instName)
					//cts.jsonPropertyRangeQuery('year', '>', 2009)
				])
			) 
	  .result()
} else { 
	res = jsearch.facets(
   	 jsearch.facet('Institution_Name', 'Institution_Name')
		 .orderBy('frequency')
   	 .slice(0, 50))
	  .result()
}  
xdmp.toJSON(res)
var output = [];
//
// Loop over the results
var facRes = res['facets'];
var insts = facRes['Institution_Name'];
keys = Object.keys(insts);
var thisInst;
var oneres;
//for (var j=0; j<1; j++) {
for (var j=0; j<keys.length; j++) {
	thisInst = keys[j];
	thisInstNum = insts[thisInst];
	res = jsearch.facets(
   	 jsearch.facet('docOrigin', 'docOrigin')
		 .orderBy('frequency')
   	 .slice(0, 10))
		 .where(
   			cts.andQuery([
					cts.jsonPropertyWordQuery('Institution_Name', thisInst)
				])
			) 
	  .result()
	var numPubmed = 0;
	var numNih = 0;
	var numNsf = 0;
	var numPatent = 0;
	var numCTrials = 0;
	var facResEach = res['facets'];
	oneres = facResEach;
	var docTypes = facResEach['docOrigin'];
	keysEach = Object.keys(docTypes);
	for (var jj=0; jj<keysEach.length; jj++) {
		thisDoc = keysEach[jj];
		if (thisDoc.localeCompare("PUBMED") == 0) {
			numPubmed = docTypes[thisDoc];
		} else if (thisDoc.localeCompare("NIH") == 0) {
			numNih = docTypes[thisDoc];
		} else if (thisDoc.localeCompare("NSF") == 0) {
			numNsf = docTypes[thisDoc];
		} else if (thisDoc.localeCompare("PATENT") == 0) {
			numPatent = docTypes[thisDoc];
		} else if (thisDoc.localeCompare("CLINICALTRIALS") == 0) {
			numCTrials = docTypes[thisDoc];
		} 
	}

//
// Loop over the results
	var totalDocs = numPubmed + numNih + numNsf + numPatent + numCTrials;

	var oneRes = {"instName": thisInst,"total":totalDocs, 
						"numPubmed":numPubmed,
						"numNih":numNih,
						"numNsf":numNsf,
						"numPatent":numPatent,
						"numCTrials":numCTrials
							};
	output.push(oneRes);
}

//xdmp.toJSON(object)
//xdmp.toJSON(res)
//xdmp.toJSON(oneres)
xdmp.toJSON(output)
//xdmp.toJSON(debug)
//xdmp.toJSON(output)
 
  
