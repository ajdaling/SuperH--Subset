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
//
// Parse the fields
var iDisplayStart = parseInt(fields['iDisplayStart']);
//var iDisplayStart = 1;
//var iDisplayLength = 10;
var iDisplayLength = parseInt(fields['iDisplayLength']);
var sortColumn = parseInt(fields['iSortCol_0']);
var sortDirection = fields['sSortDir_0'];
var generalSearchTerm = fields.title;
var instName = fields.instName;
if (fields.hasOwnProperty('sSearch')) {
	generalSearchTerm = fields['sSearch'];
}

var sortCol = 'year';
if (sortColumn == 0) {
	sortCol = 'year';
} else if (sortColumn == 1) {
	sortCol = 'docOrigin';
} else if (sortColumn == 2) {
	sortCol = 'Institution_Name';
} else if (sortColumn == 3) {
	sortCol = 'researcherName';
}
var sortOrder = 'descending';
if (sortDirection == 'asc') sortOrder = 'ascending';
var debug = {"sortCol":sortCol, "sortOrder":sortOrder};
//xdmp.setResponseContentType("text/plain");

var jsearch = require('/MarkLogic/jsearch.sjs');
var utilities = require('/lib/utilities.sjs');

var res;
if (generalSearchTerm != "") {
	res =
  jsearch.documents()
		.where(
			 cts.andQuery([
				 cts.jsonPropertyWordQuery('Institution_Name', instName),
				 cts.orQuery([
					 cts.jsonPropertyWordQuery('docOrigin', generalSearchTerm),
					 cts.jsonPropertyWordQuery('title', generalSearchTerm),
					 cts.jsonPropertyWordQuery('abstract', generalSearchTerm)
				 ])
			 ])
		 ) 
//	  .where(
//			cts.jsonPropertyWordQuery('Institution_Name', instName)
//		)
		.orderBy(cts.indexOrder(cts.jsonPropertyReference(sortCol), sortOrder))
		.slice(iDisplayStart,iDisplayStart+iDisplayLength)
		.map({extract: {paths: ['/title', '/year','/institution/Institution_Name','/researcher/researcherName','/docOrigin'
												,'/pmid','/epoDocs','/APPLICATION_ID','/AwardID','/nct_id']}})
	  .result();
//	res = jsearch.documents()
//	  .where(
//			cts.jsonPropertyWordQuery('Institution_Name', instName)
//		)
//		  .where(
//   			cts.andQuery([
//					cts.jsonPropertyWordQuery('Institution_Name', instName),
//					cts.orQuery([
//						cts.jsonPropertyWordQuery('docOrigin', 'NIH')
//						cts.jsonPropertyWordQuery('docOrigin', generalSearchTerm),
//						cts.jsonPropertyWordQuery('title', generalSearchTerm),
//						cts.jsonPropertyWordQuery('abstract', generalSearchTerm)
//					])
//				])
//			) 
//		.orderBy(cts.indexOrder(cts.jsonPropertyReference(sortCol), sortOrder))
//		.slice(iDisplayStart,iDisplayStart+iDisplayLength)
//			.map({extract: {paths: ['/title', '/year','/institution/Institution_Name','/researcher/researcherName','/docOrigin',
//												,'/pmid','/epoDocs','/APPLICATION_ID','/AwardID','/nct_id']}})
//		  .result();
} else {
	res =
  jsearch.documents()
	  .where(
			cts.jsonPropertyWordQuery('Institution_Name', instName)
		)
		.orderBy(cts.indexOrder(cts.jsonPropertyReference(sortCol), sortOrder))
		.slice(iDisplayStart,iDisplayStart+iDisplayLength)
		.map({extract: {paths: ['/title', '/year','/institution/Institution_Name','/researcher/researcherName','/docOrigin'
												,'/pmid','/epoDocs','/APPLICATION_ID','/AwardID','/nct_id']}})
	  .result();
}
var output = {};
output.aaData = [];
var iFilteredTotal = 0;
var iTotal = res['estimate']
var results = res['results'];

//
// Loop over the results
for (var j=0; j<results.length; j++) {
	thisRes = results[j];
	resExtracted = thisRes['extracted'];
	researchers = "";
	institutions = "";
	year = "";
	docOrigin = "";
	id_patstat = "";
	id_pubmed = "";
	id_nih = "";
	id_nsf = "";
	id_CT = "";
	url = "";
	title = "";
	var temp = [];
//
// Loop over the contents of this result and extract important data
	for (var i=0; i<resExtracted.length; i++){
		thisObj = resExtracted[i];

		var thisKey = Object.keys(thisObj)[0];
		var thisValue = String(thisObj[thisKey]);
		if (thisKey.localeCompare("researcherName") == 0) {
			researchers  += utilities.capitalize(thisValue) + ";";
		}
		else if (thisKey.localeCompare("Institution_Name") == 0) {
			newInst = utilities.capitalize(thisValue);
			if (! institutions.includes(newInst))
				institutions  += newInst + ";";
		}
		else if (thisKey.localeCompare("year") == 0) {
			year = thisValue;
		}
		else if (thisKey.localeCompare("docOrigin") == 0) {
			 docOrigin = thisValue;
		}
		else if (thisKey.localeCompare("pmid") == 0) {
			 id_pubmed = thisValue;
			 url = 'https://www.ncbi.nlm.nih.gov/pubmed/'+id_pubmed
		}
		else if (thisKey.localeCompare("epoDocs") == 0) {
			 id_patent = thisValue;
			 parts = id_patent.split(',');
			 id_patent = parts[0];
			 url = 'https://worldwide.espacenet.com/searchResults?submitted=true&locale=en_EP&DB=EPODOC&ST=advanced&TI=+&AP='+id_patent;
		}
		else if (thisKey.localeCompare("APPLICATION_ID") == 0) {
			 id_nih = thisValue;
			 url = 'https://projectreporter.nih.gov/project_info_details.cfm?icde=0&aid='+id_nih;
		}
		else if (thisKey.localeCompare("AwardID") == 0) {
			 id_nsf = thisValue;
			 if (id_nsf.length==6) {
			 	id_nsf = '0'+id_nsf;
			 } else if (id_nsf.length==5) {
			 	id_nsf = '00'+id_nsf;
			}
			 url = 'https://www.nsf.gov/awardsearch/showAward?HistoricalAwards=false&AWD_ID='+id_nsf;
		}
		else if (thisKey.localeCompare("nct_id") == 0) {
			 id_CT = thisValue;
			 url = 'https://clinicaltrials.gov/ct2/show/'+id_CT;
		}
		else if (thisKey.localeCompare("") == 0) {
			 id_ = thisValue;
		}
		else if (thisKey.localeCompare("title") == 0) {
			 title = utilities.capitalizeFirstLetter(thisValue);
		}
	}

// Patstat https://worldwide.espacenet.com/searchResults?submitted=true&locale=en_EP&DB=EPODOC&ST=advanced&TI=+&AP=AT20010000998
// Pubmed  https://www.ncbi.nlm.nih.gov/pubmed/20331356
// NIH   https://projectreporter.nih.gov/project_info_details.cfm?aid=nihappID&icde=0
// NSF   https://www.nsf.gov/awardsearch/showAward?AWD_ID=1501207&HistoricalAwards=false
// CT    https://clinicaltrials.gov/ct2/show/NCT03002207
//
// Put the extracted content into our temp object and then push that into the storage
	temp.push(year);
	temp.push(docOrigin);
	temp.push(institutions);
	temp.push(title);
	temp.push(url);
	temp.push(researchers);
	output.aaData.push(temp);
	iFilteredTotal = iFilteredTotal + 1;
	temp = [];
}
output.sEcho = 0; //parseInt(request['sEcho']);
output.iTotalRecords = iTotal;
output.iTotalDisplayRecords = iTotal;

var oneRes = {"researchers":researchers, "institutions":institutions, "year":year, "docOrigin":docOrigin,"title":title,"url":url};
//var oneRes = {"researchers":resExtracted};

//xdmp.toJSON(object)
//xdmp.toJSON(res)
//xdmp.toJSON(res)
//xdmp.toJSON(oneRes)
//xdmp.toJSON(results)
xdmp.toJSON(output)
