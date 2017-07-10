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

var selectedCountry = "";

var sessionData = JSON.parse(localStorage.getItem("sessionData"));
if(!sessionData.vizData){
	sessionData.vizData = {};
	sessionData.vizData.start_year = sessionData.start_year;
	sessionData.vizData.end_year = sessionData.end_year;
	updateSessionData(sessionData);
}

var allNodes = null;
var allEles = null;
var lastHighlighted = null;
var lastUnhighlighted = null;

var layout;
var sublayout;
var layoutname = 'cola';

var animTime = 500;
var easing = 'linear';

var params = {
	name: 'cola',
	nodeSpacing: 5,
	edgeLengthVal: 45,
	edgeLength : function(e){ return 45 / e.data('weight'); },
	infinite: true,
	fit: false
	}

var isZoomed = false;


var this_qry = sessionData.mainQuery;
var main_qry = sessionData.mainQuery;
var instName = sessionData.intitution;
var resName = sessionData.researcher;
var thisCompName = sessionData.instData.compName.toLowerCase();
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

var infoTemplate = Handlebars.compile([
    '<p class="ac-name">{{id}}</p>',
    '<p class="ac-node-type"><i class="fa fa-info-circle"></i> {{type}} {{#if Type}}({{Type}}){{/if}}</p>'
  ].join(''));


//
// Query to get data for a specific institution
var myData = $.ajax({
//    url:'http://localhost:8931/instNetworkL2.sjs?thisCompName=stanford%20university&this_qry=&main_qry=&instName=&resName=&docType=&yearMin=1980&yearMax=2017&selectedCountry=',
	url:'http://'+config.host+':'+config.port+'/institution/instNetworkL2.sjs',
    type: 'GET',
	xhrFields: { withCredentials: true },
	data: JSON.stringify(sessionData),
    crossDomain: true,
    dataType: 'json'
});
console.log(myData);
//
// Query to get layout info
var myStyle = fetch('cy-style.json', {mode: 'no-cors'})
.then(function(res) {
	return res.json()
});
Promise.all([myStyle,myData])
.then(function(dataArray) {
	var cy = window.cy = cytoscape({
		container: document.getElementById('cy'),
		style: dataArray[0],
/*		layout: {
   			name: 'cola',
	    		infinite: false,
	    		fit: false
  		},*/
		ready: function(){}
	});
	cy.panzoom({
		// options here...
	});

//
// Iterate over data returned
	networkData = dataArray[1];
	instNodes = networkData['institutionNodes'];
	resNodes = networkData['researcherNodes'];
	edges = networkData['edges'];
//

// Find min and max
	var minVal = 10000.0;
	var maxVal = 0.0; 
	for(instKey in instNodes){
		if (instKey.trim() != thisCompName) {
			var val = parseInt(instNodes[instKey]);
			if (val < minVal) minVal = val;
			if (val > maxVal) maxVal = val;
		}
	}
//
// Add all of the institution nodes
	var myMin = 10.0;
	var myMax = 60.0;
	for(instKey in instNodes){
		var val = parseInt(instNodes[instKey]);
		console.log(instKey + val);
		val = ((myMax - myMin)*(val - minVal)/(maxVal-minVal)) + myMin;
		if (instKey.trim() != thisCompName) {
			console.log(instKey);
			cy.add({
				data: { id: instKey,weight: parseInt(val), type: "inst"},
				position: {x: 1,y: 1},
				type: "inst"});
		} else {
			cy.add({
				data: { id: instKey,weight: parseInt(val), type: "main"},
				position: {x: 1,y: 1},
				type: "main"});
		}			
	}
//
// Add edges for all institutions, to the main node
	for(instKey in instNodes){
		var val = parseInt(instNodes[instKey]);
		var weight = 1.0; // val;
		if (instKey.trim() != thisCompName) {
   			cy.add({
   				data: {
					id: thisCompName+instKey, 
					source: thisCompName,
					target: instKey,
					weight: weight
				}
			});
		}
	}
//			
// Add edges and nodes for researchers
	minVal = 10000.0;
	maxVal = 0.0; 
	for(instKey in resNodes){
		var val = parseInt(resNodes[instKey]);
		if (val < minVal) minVal = val;
		if (val > maxVal) maxVal = val;
	}
	for(resKey in resNodes){
		var val = resNodes[resKey];
		val = ((myMax - myMin)*(val - minVal)/(maxVal-minVal)) + myMin;
		var weight = 1.0; // val;
		cy.add({
			data: { id: resKey,weight: val, type: "res"},
			position: {x: 1,y: 1},
			type: "res"
		});
		cy.add({
			data: {
				id: thisCompName+resKey, 
				source: thisCompName,
				target: resKey,
				weight: 1
      		 }
   		});
	}
//
// Add remaining
	for(var i=0; i<edges.length; i++){
		thisEdge = edges[i];
		weight = 1.0; //thisEdge['weight'];
		cy.add({
			data: {
				id: thisEdge['a']+thisEdge['b'], 
				source: thisEdge['a'],
				target: thisEdge['b'],
				weight: weight
			}
   		});
	}
	
	allNodes = cy.nodes();

/*    function makeLayout( opts ){
//      params.randomize = false;
//      params.edgeLength = function(e){ return params.edgeLengthVal / e.data('weight'); };

      for( var i in opts ){
        params[i] = opts[i];
      }

      return cy.makeLayout( params );
    }*/

    cy.nodes().forEach(function(n){
		var g = n.data('id');
		var weight = n.data('weight');
		n.qtip({
			content: [
			{
				name: weight,
            		txt: (n.data('type')=='inst'||n.data('type')=='main')? 'Institution: ' + capitalize(g): 'Researcher: ' + capitalize(g),
				url: 'xxx'
          	},
          	{
            		name: 'Zoom to this network',
            		url: 'instData.html'
          	}
        		].map(function( link ){
		    		if (link.url != 'xxx') {
					return '<a target="_blank" href="' + link.url + '">' + link.name + '</a>';
				} else {
			 		return link.txt;
			 	}
        		}).join('<br />\n'),
        		position: {
          		my: 'top center',
          		at: 'bottom center'
        		},
			style: {
				classes: 'qtip-bootstrap',
				tip: {
					width: 16,
					height: 8
				}
			}
		});
	});

// Making layout
	layout = cy.layout({
		name: 'cola',
		nodeSpacing: 5,
  		edgeLengthVal: 45,
  		edgeLength : function(e){ return 45 / e.data('weight'); },
  		infinite: true,
  		fit: false
	});
	layout.run();
//   var layout = makeLayout();
    var running = false;

    cy.on('layoutstart', function(){
		running = true;
    }).on('layoutstop', function(){
		running = false;
    });

/*	cy.on('mouseover', 'node', function(e){
//		var sel = e.cyTarget;
		var sel = e.target;
		cy.elements().difference(sel.outgoers()).not(sel).addClass('semitransp');
		sel.addClass('highlight').outgoers().addClass('highlight');
	});*/

/*	cy.on('mouseout', 'node', function(e){
		var sel = e.target;
		cy.elements().removeClass('semitransp');
		sel.removeClass('highlight').outgoers().removeClass('highlight');
	});*/
	
	cy.on('click', function(e){
/*		cy.elements().removeClass('semitransp');
		cy.elements().removeClass('highlight');*/
		reset();
	});

	cy.on('click', 'node', function(e){
		var sel = e.target;
		selection(sel);
	});

    // and finally, clear the loading animation
	var loading = document.getElementById('loading');
	loading.classList.add('loaded');
// cytoscape panzooom
   // the default values of each option are outlined below:

})
.then(function() {
	FastClick.attach( document.body );
});

/*----------------------------------------------------------------------------------------*/
//To save image
$("#save-as-png").click(function(evt){
    var pngContent = cy.png();

    // see http://stackoverflow.com/questions/16245767/creating-a-blob-from-a-base64-string-in-javascript
    function b64toBlob(b64Data, contentType, sliceSize) {
        contentType = contentType || '';
        sliceSize = sliceSize || 512;

        var byteCharacters = atob(b64Data);
        var byteArrays = [];

        for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
            var slice = byteCharacters.slice(offset, offset + sliceSize);

            var byteNumbers = new Array(slice.length);
            for (var i = 0; i < slice.length; i++) {
                byteNumbers[i] = slice.charCodeAt(i);
            }

            var byteArray = new Uint8Array(byteNumbers);

            byteArrays.push(byteArray);
        }

        var blob = new Blob(byteArrays, {type: contentType});
        return blob;
    }

    // this is to remove the beginning of the pngContent: data:img/png;base64,
    var b64data = pngContent.substr(pngContent.indexOf(",") + 1);

    saveAs(b64toBlob(b64data, "image/png"), "network.png");
    return false;

});

/*----------------------------------------------------------------------------------------*/
//For searchbox
$('#search').typeahead({
	minLength: 1,
	highlight: true,
	},
  	{
    		name: 'search-dataset',
    		display: 'id',
    		source: function( query, cb ){
      		function matches( str, q ){
        			str = (str || '').toLowerCase();
        			q = (q || '').toLowerCase();

		        return str.match( q );
      		}
      		var fields = ['id', 'type'];

      		function anyFieldMatches( n ){
        			for( var i = 0; i < fields.length; i++ ){
        		  		var f = fields[i];
        		  		if( matches( n.data(f), query ) ){
			            return true;
			          }
		        }
		        return false;
			}
			function getData(n){
        			var data = n.data();

		        return data;
      		}

      		function sortByName(n1, n2){
        			if( n1.data('id') < n2.data('id') ){
          			return -1;
        			} else if( n1.data('id') > n2.data('id') ){
          			return 1;
        		}

        		return 0;
      	}
      	var res = allNodes.stdFilter( anyFieldMatches ).sort( sortByName ).map( getData );
		cb( res );
    },
    templates: {
      suggestion: infoTemplate
    }
}).on('typeahead:selected', function(e, entry, dataset){
	var n = cy.getElementById(entry.id);
	
	cy.batch(function(){
		allNodes.unselect();
		n.select();
		selection(n);
		})
});

/*----------------------------------------------------------------------------------------*/
//For highlighting selected nodes and their connections
function selection(sel){	

	
	var nbhd = sel.closedNeighborhood();
	var others = cy.elements().not( nbhd );
	layout.stop();
	reset();
    others.addClass('semitransp');
	nbhd.addClass('highlight');


//    return Promise.resolve()
//      .then( reset )
//      .then( pullNbhd )
//      .then( fit(nbhd) )
//      .then( showOthersFaded )
//    ;
	pullNbhd(nbhd,sel);
  //  fit(nbhd);
}
/*----------------------------------------------------------------------------------------*/
//For the layout toggle buttons

$("#concentric").click(function(evt){
	layout.stop();
	allNodes.unselect();
	$(this).addClass('active');
	$("#cola").removeClass('active');
	layout = cy.layout({
		name: 'concentric',
		padding: 10,
		fit: true,
		minNodeSpacing: 0,
		spacingFactor: 0.2,
		animate: true,
		animationDuration: animTime,
		animationEasing: easing,
		concentric: function( node ){
			if (node.data('type') == 'main') {
				return 4;
	 		}
			if (node.data('type') == 'inst') {
		 		return 2;
 			}
			if (node.data('type') == 'res') {
				return 1;
 			}
		},
		levelWidth: function(  ){
  			return 1;
		}
	});
	reset();
	layoutname = 'concentric';
	return false;
});

$("#cola").click(function(evt){
	layout.stop();
	allNodes.unselect();
	$(this).addClass('active');
	$("#concentric").removeClass('active');
	layout = cy.layout({
		name: 'cola',
		nodeSpacing: 5,
		edgeLengthVal: 45,
		edgeLength : function(e){ return 45 / e.data('weight'); },
		infinite: true,
		fit: false
	});
	reset();
	layoutname = 'cola';
	return false;
});
/*----------------------------------------------------------------------------------------*/

function reset(){
	if(isZoomed){
		sublayout.stop();
		isZoomed=false;
	}
	cy.batch(function(){
		console.log("reset");
		cy.elements().removeClass('semitransp');
		cy.elements().removeClass('highlight');
	});
	layout.run();
	fit(cy.elements());
};

function fit(area){
	console.log('fit');
	cy.animation({
		fit: {
			eles: area,
			padding: 10
		},
		easing: easing,
		duration: animTime
	}).play();
}

function pullNbhd(nbhd,sel){
	console.log("pull");
	layout.stop();
	var pos = sel.position();
	if(layoutname == 'concentric'){
		sublayout = nbhd.makeLayout({
			name: 'concentric',
			fit: false,
			animate: true,
			animationDuration: animTime,
			animationEasing: easing,
			/*	boundingBox: {
				x1: pos.x - 1,
				x2: pos.x + 1,
				y1: pos.y - 1,
				y2: pos.y + 1
			},*/
			avoidOverlap: true,
			concentric: function( ele ){
				if( ele.same( sel ) ){
					return 3;
				} else if( ele.data('type') == 'inst' || ele.data('type') == 'main') {
					return 2;
				} else if (ele.data('type') == 'res') {
					return 1;
				}
			},
			levelWidth: function(){ return 1; },
		});
	} else {
		sublayout = nbhd.makeLayout({
			name: 'cola',
			nodeSpacing: 5,
			edgeLengthVal: 45,
			edgeLength : function(e){ return 45 / e.data('weight'); },
			infinite: true,
			fit: false
		});
	}	
//	var promise = cy.promiseOn('layoutstop');
	sublayout.run();
	isZoomed = true;
//	return promise;
};
