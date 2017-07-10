var dataReturned = "";
var countryData = ""
var InstitutionNames = "";
var InstitutionValues = "";
var ResearcherNames = "";
var ResearcherValues = "";
var docNames = "";
var docValues = "";
var yearNames;
var yearValues;
var yearNamesOne;
var yearValuesOne;
var momNames;
var momValues;
var momNamesOne ;
var momValuesOne;
var oTable;
var drewTable = false;

var selectedCountry = "";

var sessionData = JSON.parse(localStorage.getItem("sessionData"));
if(!sessionData.vizData){
	sessionData.vizData = {};
	sessionData.vizData.start_year = sessionData.start_year;
	sessionData.vizData.end_year = sessionData.end_year;
	updateSessionData(sessionData);
}

var this_qry = sessionData.mainQuery;
var main_qry = sessionData.mainQuery;
var instName = sessionData.intitution;
var resName = sessionData.researcher;
var thisCompName = sessionData.instData.compName;
var docType = sessionData.docType;
var yearMin = sessionData.start_year;
var yearMax = sessionData.end_year;
var selectedCountry = sessionData.selectedCountry;
var topics = {};
for(var i = 0; i < 99; i++){
	var topStr = "topic"+String(i);
	var labStr = "label"+String(i);
	var tmpObj = {};
	if(sessionData.topStr){
		tmpObj.topic = sessionData[topStr];
		if(sessionData.labStr){
			tmpObj.label = sessionData[labStr];
		}
		topics[topStr] = tmpObj;
	}
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}
function capitalize(tstring) {
    return tstring.replace(/(?:^|\s)\S/g, function(a) { return a.toUpperCase(); });
};

createTable();
function createTable(callback){
	console.log("creating dt");
	if(!drewTable){
	drewTable = true;
	oTable = $('#doc-subset-table').DataTable({
		serverSide: true,
		ajax: {
		      type: "GET",
		      crossDomain: true,
		      xhrFields: {
		    	  withCredentials: true,
		      },
		      url: "http://"+config.host+":"+config.port+"/docMaster/datatables.sjs",
		      data: sessionData,

		},

	    "scrollY": '60vh',
	    "scrollX": false,
	    "scrollCollapse": true,
			"order": [[ 0, "desc" ]],
 "columnDefs": [

	 {
		 "render": function ( data, type, row ) {
			 data = data.replace(";","");
			 data = data.replace(",","");
			 var odata = data;
			 data = data.toLowerCase();
             return '<a onclick="clickInst(this)" id="'+odata+'" href="#">'+data+'</a>';
		 },
		 "targets": 2
	 },
    {
    	targets: 4,
    	render: function(data,type,row){
    		console.log(row[5]);
    		return '<a onclick = "clickDoc(this)" class = "'+row[5]+'" id = "'+row[6]+'" href="#" target="_blank">' + data + '</a>';
    	}
    },

                ]
  });
}
}
var dataReturned = "";
 $.ajax({
        url: "http://"+config.host+":"+config.port+"/institution/inst_info2.sjs",
        type: "GET",
    	xhrFields: { withCredentials: true },
    	data: JSON.stringify(sessionData),
		  dataType: 'json',
        success: function(retdata){

		   	console.log("complete");
            console.log(retdata);
				//console.log(retdata["instName"]);
				numTotal = retdata["total"];
				numPubmed = retdata["numPubmed"];
				numPatent = retdata["numPatent"];
				numNsf = retdata["numNsf"];
				var numNih = retdata["numNih"];
				console.log("numNih " +numNih);
				numCTrials = retdata["numCTrials"];
				numTotal = retdata["total"];
				if (numPubmed === undefined) numPubmed = 0;
				if (numPatent === undefined) numPatent = 0;
				if (numNsf === undefined) numNsf = 0;
				if (numCTrials === undefined) numCTrials = 0;
				if (numNih === undefined) numNih = 0;


				//console.log(Object.getOwnPropertyNames(instData));
				var x = document.getElementById("inst_summary_data").rows[2].cells;
				x[1].innerHTML = numTotal
				x = document.getElementById("inst_summary_data").rows[3].cells;
				x[1].innerHTML = numPubmed;
				x = document.getElementById("inst_summary_data").rows[4].cells;
				x[1].innerHTML = numPatent;
				x = document.getElementById("inst_summary_data").rows[5].cells;
				x[1].innerHTML = numNih;
				x = document.getElementById("inst_summary_data").rows[6].cells;
				x[1].innerHTML = numNsf;
				x = document.getElementById("inst_summary_data").rows[7].cells;
				x[1].innerHTML = numCTrials;
        }
		  //error: function() {
		  // alert("error");
		  //}
		});
//document.getElementById("title").innerHTML = "Detailed Data for Institution: "+capitalize(decodeURI(pars.thisCompName));



//
// Code for plotting charts
$.ajax({
	url: "http://"+config.host+":"+config.port+"/institution/instVsAll_rates.sjs",
	type: "GET",
	xhrFields: { withCredentials: true },
	data: JSON.stringify(sessionData),
	dataType: 'json',
	success: function(retdata){
		console.log("complete");
		console.log(retdata);
		yearNames = retdata.main.yearNames;
		yearValues = retdata.main.yearValues;
		yearNamesOne = retdata.oneInst.yearNames;
		yearValuesOne = retdata.oneInst.yearValues;
		momNames = retdata.main.momentumKeys;
		momValues = retdata.main.momentumVals;
		momNamesOne = retdata.oneInst.momentumKeys;
		momValuesOne = retdata.oneInst.momentumVals;
//		console.log(Institution_Name,retdata.InstitutionNames,retdata,InstitutionValues);
		my_chart();
//		my_chart(parsed_response);

	}
//	error: function() {
//		alert("error");
//	}
});


function my_chart() {
//
// Second chart

   $('#compRate').highcharts({
	    chart: {
        zoomType: 'xy'
    },
    title: {
        text: 'Comparison of Total Document Rate'
    },
    subtitle: {
        text: ''
    },
    xAxis: [{
        categories: yearNames,
        crosshair: true
    }],
    yAxis: [{ // Primary yAxis
        labels: {
            style: {
                color: Highcharts.getOptions().colors[1]
            }
        },
        title: {
            text: 'All Documents',
            style: {
                color: Highcharts.getOptions().colors[1]
            }
        }
    }, { // Secondary yAxis
        title: {
            text: 'This Institutions Documents',
            style: {
                color: Highcharts.getOptions().colors[0]
            }
        },
        labels: {
            style: {
                color: Highcharts.getOptions().colors[0]
            }
        },
        opposite: true
    }],
    tooltip: {
        shared: true
    },
    legend: {
        layout: 'vertical',
        align: 'left',
        x: 200,
        verticalAlign: 'top',
        y: 25,
        floating: true,
        backgroundColor: (Highcharts.theme && Highcharts.theme.legendBackgroundColor) || '#FFFFFF'
    },
		 series: [
		  {
				name: 'This Institution',
				data: yearValuesOne,
				type: 'column',
				yAxis: 1,
					tooltip: {
					valueSuffix: ' mm'
				}
        },
		  {
				name: 'All',
				data: yearValues,
				type: 'spline',
					tooltip: {
					valueSuffix: ' mm'
				}
        }
		 ]
});



//
// Second chart

   $('#compMom').highcharts({
	    chart: {
        zoomType: 'xy'
    },
    title: {
        text: 'Comparison of Momentum'
    },
    subtitle: {
        text: ''
    },
    xAxis: [{
        categories: momNames,
        crosshair: true
    }],
    yAxis: [{ // Primary yAxis
        labels: {
            style: {
                color: Highcharts.getOptions().colors[1]
            }
        },
        title: {
            text: 'All Documents',
            style: {
                color: Highcharts.getOptions().colors[1]
            }
        }
    }, { // Secondary yAxis
        title: {
            text: 'This Institutions Documents',
            style: {
                color: Highcharts.getOptions().colors[0]
            }
        },
        labels: {
            style: {
                color: Highcharts.getOptions().colors[0]
            }
        },
        opposite: true
    }],
    tooltip: {
        shared: true
    },
    legend: {
        layout: 'vertical',
        align: 'left',
        x: 200,
        verticalAlign: 'top',
        y: 25,
        floating: true,
        backgroundColor: (Highcharts.theme && Highcharts.theme.legendBackgroundColor) || '#FFFFFF'
    },
		 series: [
		  {
				name: 'This Institution',
				data: momValuesOne,
				type: 'spline',
//				type: 'column',
				yAxis: 1,
					tooltip: {
					valueSuffix: ' mm'
				}
        },
		  {
				name: 'All',
				data: momValues,
				type: 'spline',
					tooltip: {
					valueSuffix: ' mm'
				}
        }
		 ]
});







};
