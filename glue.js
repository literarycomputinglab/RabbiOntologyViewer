var yasqe = YASQE(document.getElementById("yasqe"), {
	sparql: {
		showQueryButton: true,
		endpoint: "http://146.48.93.235:3030/rabbiOntology/sparql"
	}
});
yasqe.addPrefixes({"rdf":"http://www.w3.org/1999/02/22-rdf-syntax-ns#",
		   "rabbi":"http://146.48.93.235:3030/rabbiOntology#",
		   "dct":"http://purl.org/dc/terms/",
		   "owl":"http://www.w3.org/2002/07/owl#",
		   "skos":"http://www.w3.org/2004/02/skos/core#",
		   "rdfs":"http://www.w3.org/2000/01/rdf-schema#",
		   "foaf":"http://xmlns.com/foaf/0.1/",
		   "xsd": "http://www.w3.org/2001/XMLSchema#"
		  });


//YASR.plugins.table.defaults.datatable.lengthMenu = [[10, 25, 50, -1], [10, 25, 50, "All"]]
YASR.plugins.table.defaults.datatable.scrollY = "300px";
YASR.plugins.table.defaults.datatable.scrollCollapse = true;
YASR.plugins.table.defaults.datatable.paging = false;
YASR.plugins.table.defaults.datatable.searching = false;
YASR.plugins.table.defaults.datatable.autoWidth = true;

var yasr = YASR(document.getElementById("yasr"), {
    //this way, the URLs in the results are prettified using the defined prefixes in the query
    getUsedPrefixes: yasqe.getPrefixesFromQuery,
    drawOutputSelector: false,
    drawDownloadIcon: false
});
document.getElementsByClassName("yasr_header")[0].style.display = "none"; //https://github.com/OpenTriply/YASGUI.YASR/issues/119
//link both together
yasqe.options.sparql.callbacks.complete = yasr.setResponse;

var map = {};
// add a item
map["q1"] = "SELECT (str(?_title) as ?title) ?description (concat('[',group_concat(?contributor;separator=','),']')\n" +
    "as ?contributors)  (str(?issued) as ?date) ?rights\n" +
    "WHERE { ?x dct:title ?_title .\n" +
    "?x dct:description ?description .\n" + 
    "?x dct:contributor ?contributor . \n" +
    "?x dct:issued ?issued . \n" +
    "?x dct:rights ?rights} \n" +
    "group by ?_title ?description ?contributors ?issued ?rights";
map["q2"] = "SELECT  ?italianName ?hebrewName ?alternativeItName ?rabbiClass (str(?_generation) as ?generation) \n" + 
" WHERE { ?rabbi rdf:type ?rabbiClass . \n " +
" ?rabbi rabbi:hasItalianName ?italianName . \n " +
" ?rabbi rabbi:hasHebrewName ?hebrewName . \n" +
"  OPTIONAL {?rabbi rabbi:hasItalianAlternativeName ?alternativeItName} . \n" +
"  OPTIONAL {?rabbi rabbi:belongsToGeneration ?_generation} . \n" +
" FILTER (?rabbiClass IN (rabbi:Amora, rabbi:Tanna, rabbi:MemberOfZug ) )} \n" +
" ORDER BY ?italianName";
map["q3"] = "SELECT  ?italianName ?hebrewName ?alternativeItName \n" +
" WHERE { ?rabbi rdf:type rabbi:Amora .  \n" +
"  ?rabbi rabbi:hasItalianName ?italianName .  \n" +
"  ?rabbi rabbi:hasHebrewName ?hebrewName .  \n" +
"  OPTIONAL {?rabbi rabbi:hasItalianAlternativeName ?alternativeItName}  \n" +
"  OPTIONAL {?rabbi rabbi:belongsToGeneration ?_generation}  \n" +
" FILTER (?_generation = 2)}  \n" +
" ORDER BY ?italianName";
map["q4"] = "Select DISTINCT ?italianName ?hebrewName ?alternativeItName ?rabbiClass \n " +
    " (concat('[',group_concat(?genA;separator=','),']') as ?generations) \n" +
" WHERE { ?rabbi rdf:type ?rabbiClass .\n" +
" ?rabbi rabbi:hasItalianName ?italianName .  \n" +
"  ?rabbi rabbi:hasHebrewName ?hebrewName .  \n" +
"  OPTIONAL {?rabbi rabbi:hasItalianAlternativeName ?alternativeItName} . \n" +
"  ?rabbi rabbi:belongsToGeneration ?genA, ?genB . \n" +
"  FILTER ( ?genA != ?genB ) .  \n" +
"  FILTER (?rabbiClass IN (rabbi:Amora, rabbi:Tanna, rabbi:MemberOfZug)) \n" +
"} \n" +
"GROUP BY ?italianName ?hebrewName ?alternativeItName ?rabbiClass ?generations \n" +
"ORDER BY ?italianName";
map["q5"] = "Select DISTINCT ?italianName ?hebrewName ?alternativeItName ?rabbiClass  \n" +
"  (concat('[',group_concat(?genA;separator=','),']') as ?generations)  \n" +
" WHERE { ?rabbi rdf:type ?rabbiClass . \n" +
" ?rabbi rabbi:hasItalianName ?italianName .   \n" +
"  ?rabbi rabbi:hasHebrewName ?hebrewName .   \n" +
"    ?rabbi rabbi:hasItalianAlternativeName ?alternativeItName .  \n" +

"  OPTIONAL {?rabbi rabbi:hasItalianAlternativeName ?alternativeItName} .  \n" +
"  ?rabbi rabbi:belongsToGeneration ?genA .  \n" +
 " FILTER (?rabbiClass IN (rabbi:Amora, rabbi:Tanna, rabbi:MemberOfZug))  \n" +
"} \n" +
"GROUP BY ?italianName ?hebrewName ?alternativeItName ?rabbiClass ?generations  \n" +
"ORDER BY ?italianName";

map["q6"] = "SELECT  ?italianName ?hebrewName  ?rabbiClass  (str(count(?pageRH)) as ?occurrences)\n" +
    "(concat('[',group_concat(?pageRH;separator=', '),']') as ?pages) \n" +
" WHERE { ?rabbi rdf:type ?rabbiClass . \n" +
"  ?rabbi rabbi:hasItalianName ?italianName . \n" +
"  ?rabbi rabbi:hasHebrewName ?hebrewName . \n" +
"  OPTIONAL {?rabbi rabbi:hasItalianAlternativeName ?alternativeItName} .\n" + 
"  OPTIONAL {?rabbi rabbi:belongsToGeneration ?_generation} . \n" +
" ?rabbi rabbi:appearsInPageRH ?pageRH . \n" +
" FILTER (?rabbiClass IN (rabbi:Amora, rabbi:Tanna, rabbi:MemberOfZug ) )} \n" +
"GROUP BY ?italianName ?hebrewName ?alternativeItName ?rabbiClass ?generation ?occurrences\n" +
"ORDER BY DESC (xsd:integer(?occurrences)) \n" +
"LIMIT 10";

//map["q7"] = "SELECT * WHERE { ?sub ?pred ?obj .} LIMIT 7";

//Highlight current element in vertical menu
// Get the container element
var itemContainer = document.getElementsByClassName("vertical-menu")[0];

// Get all buttons with class="btn" inside the container
var items = itemContainer.getElementsByClassName("item");

// Loop through the buttons and add the active class to the current/clicked button
for (var i = 0; i < items.length; i++) {
    items[i].addEventListener("click", function() {
	var current = document.getElementsByClassName("active");
	if (current[0] != null) {
	    current[0].className = current[0].className.replace(" active", "");
	}
	this.className += " active";
	//yasqe.setValue("SELECT * WHERE { ?sub ?pred ?obj .} LIMIT 10");
	yasqe.setValue(map[this.id]);
	//yasqe.options.value("SELECT * WHERE { ?sub ?pred ?obj .} LIMIT 1");
	yasqe.addPrefixes({"rdf":"http://www.w3.org/1999/02/22-rdf-syntax-ns#",
			   "rabbi":"http://146.48.93.235:3030/rabbiOntology#",
			   "dct":"http://purl.org/dc/terms/",
			   "owl":"http://www.w3.org/2002/07/owl#",
			   "skos":"http://www.w3.org/2004/02/skos/core#",
			   "rdfs":"http://www.w3.org/2000/01/rdf-schema#",
			   "foaf":"http://xmlns.com/foaf/0.1/",
			   "xsd": "http://www.w3.org/2001/XMLSchema#"
			  });
	yasqe.query(yasqe.options);
    });
}
