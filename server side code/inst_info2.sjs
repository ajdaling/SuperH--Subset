xdmp.addResponseHeader('Access-Control-Allow-Origin', 'http://localhost:8010');
xdmp.addResponseHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
xdmp.addResponseHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
xdmp.addResponseHeader('Access-Control-Allow-Credentials', "true");
xdmp.setResponseContentType("application/json");
//generate object with field names from Request fields
var fields =JSON.parse(xdmp.getRequestFieldNames());

var instName = fields.instData.compName.toLowerCase();

var jsearch = require('/MarkLogic/jsearch.sjs');
var utilities = require('/lib/utilities.sjs');

var res;
res = jsearch.facets([
   	 jsearch.facet('year', 'year')
		 	.orderBy('frequency')
   	 	.slice(0, 10),
   	 jsearch.facet('docOrigin', 'docOrigin')
		 	.orderBy('frequency')
   	 	.slice(0, 10)
		 ])
		 .where(
   			cts.andQuery([
					cts.jsonPropertyWordQuery('Institution_Name', instName)
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
	var years = facResEach['year'];
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

	var oneRes = {"instName": instName,"total":totalDocs, 
						"numPubmed":numPubmed,
						"numNih":numNih,
						"numNsf":numNsf,
						"numPatent":numPatent,
						"numCTrials":numCTrials,
						"years":years
							};
	var newOut = {};
	newOut.instName = instName;
	newOut.total = totalDocs;
	newOut.numPubmed = numPubmed;
	newOut.numNih = numNih;
	newOut.numNsf = numNsf;
	newOut.numPatent = numPatent;
	newOut.numCTrials = numCTrials;
//xdmp.toJSON(object)
//xdmp.toJSON(res)
//xdmp.toJSON(oneres)
//xdmp.toJSON(output)
//xdmp.toJSON(oneRes)
xdmp.toJSON(newOut)
 
  
