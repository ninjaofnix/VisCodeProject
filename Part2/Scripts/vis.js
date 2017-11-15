var vis = (function () {
	var margin = {top: 20, right: 20, bottom: 60, left: 80},
		marginAllowanceTopBottom = margin.top + margin.bottom,
		visualizationWidth,
		marginAllowanceSides = margin.left + margin.right;

	var vis1Name = "bubble-chart",
		vis1Title = "Residents by city sector";
	var vis2Name = "bar-chart",
		vis2Title = "Residents by community";
	var currentlyDisplayedVis = "";
	var transitionDuration = 1000;
		
	function init() {
		// init so vis1 is showing and vis2 is hidden
		currentlyDisplayedVis = vis1Name;
		d3.select("#span-currentVisualization").text(vis1Title);
		d3.select("." + vis2Name)
			.style("width", 0)
			.style("opacity", 0);
		
		d3.csv("/Data/city of calgary census 2016.csv", type, function(error, data) {
			if (error) throw error;
			
			
			var vis1Data = groupAndSumByFields(data, "SECTOR", "RES_CNT");
			var vis2Data = groupAndSumByFields(data, "COMM_STRUCTURE", "RES_CNT");
			
			// extra 30 is cause the transition doesn't work if it is exactly the size of the body
			visualizationWidth = d3.select('body').node().offsetWidth - marginAllowanceSides - 30;
		
			buildBubbleChart(vis1Data, vis1Name);
			buildPieChart(vis2Data, vis2Name);
			setupSwitch();
		});
	}
	
	// takes in a list and groups by the fieldToGroupBy, summing the fieldToSumOn property in each group
	function groupAndSumByFields(data, fieldToGroupBy, fieldToSumOn) {
		var groups = [];
		
		data.forEach(function(d){
			// see if we already have this group
			var group;
			for(var i = 0; i < groups.length; i++){
				if (groups[i].name == d[fieldToGroupBy]){
					group = groups[i];
					break;
				}
			}
			
			if(group){
				// had group, just sum up over the fieldToSumOn
				group.value += d[fieldToSumOn];
			} else {
				// didn't have group, create new and add to list
				group = {
					name: d[fieldToGroupBy],
					value: d[fieldToSumOn]
				};
				groups.push(group);
			}
		});
		
		return groups;
	}
	
	function buildBubbleChart(dataToShow, bubbleChartClass){
		// The first visualization should aggregate the resident count (RES_CNT)
		// based on the city sector column. (SECTOR)
		// In other words, total up the residents for each of the
		// nine sectors in the sector column, and show
		// the totals for each sector.
		var maxValue = getMaxValue(dataToShow);
		
		var diameter = visualizationWidth,
			format = d3.format(",d"),
			color = d3.scaleSequential(d3["interpolateViridis"])
				.domain([0, maxValue]);
		
		var bubble = d3.pack()
			.size([diameter, diameter])
			.padding(1.5);
		var vis1Svg = d3.select("." + bubbleChartClass)
			.attr("width", diameter)
			.attr("height", diameter)
			.attr("class", "bubble " + bubbleChartClass);
			
		var root = d3.hierarchy( {children: dataToShow} )
			.sum(function(d) { return d.value; }) // gets total of all RES_CNT values and puts it in roots value field
			.sort(function(a, b) { return b.data.value - a.data.value; });
		
		// this adds info to all the nodes that d3 bubble nodes need to display (r, x, y, etc)
		bubble(root);
		
		var node = vis1Svg.selectAll(".node")
			.data(root.children)
			.enter().append("g")
			.attr("class", "node")
			.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
			
		node.append("title")
			.text(function(d) { return d.data.name + ": " + format(d.value); });
			
		node.append("circle")
			.attr("r", function(d) { return d.r; })
			.style("fill", function(d) { 
				return color(d.data.value); 
			});
		node.append("text")
			.attr("dy", ".3em")
			.style("text-anchor", "middle")
			.text(function(d) { return d.data.name; });
	}
	
	function buildPieChart(dataToShow, pieChartClass){
		// The second visualization should aggregate the resident count based on the community
		// structure (COMM_STRUCTURE) column.
		var maxValue = getMaxValue(dataToShow);

		var width = visualizationWidth,
			height = d3.select('body').node().offsetHeight - marginAllowanceTopBottom - 60,
			radius = Math.min(width, height) / 2;

		var color = d3.scaleSequential(d3["interpolateCool"])
			.domain([0, maxValue]);

		var arc = d3.arc()
			.outerRadius(radius - 10)
			.innerRadius(0);

		var labelArc = d3.arc()
			.outerRadius(radius + 5)
			.innerRadius(radius + 5);

		var pie = d3.pie()
			.sort(function(a, b) { return b.name.localeCompare(a.name); })
			.value(function(d) { return d.value; });

		var svg = d3.select("." + pieChartClass)
			.attr("width", width)
			.attr("height", height)
			.append("g")
			.attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

		var g = svg.selectAll(".arc")
			.data(pie(dataToShow))
			.enter().append("g")
			.attr("class", "arc");

		g.append("path")
			.attr("d", arc)
			.style("fill", function(d) { return color(d.data.value); })
			.append("title")
			.text(function(d) { return d.data.name + ": " + d.data.value;  });;

		g.append("text")
			.attr("transform", function(d) { return "translate(" + labelArc.centroid(d) + ")"; })
			.attr("dy", ".35em")
			.text(function(d) { return d.data.name; });
	}
	
	// helper function to get the max value of a list of objects
	function getMaxValue(data){
		var maxValue = 0;
		data.forEach(function(d) { 
			if(d.value > maxValue)
				maxValue = d.value;
		});
		return maxValue;
	}
	
	// adds click event listener to our button for our transition between visualizations
	function setupSwitch() {
		d3.select("#changeVis-button").on("click", function(){
			if (currentlyDisplayedVis === vis1Name){
				transitionVisualization(vis2Name, vis1Name);
			} else {
				transitionVisualization(vis1Name, vis2Name);
			}
		});
	}
	
	// does the actual transition from one vis to the other
	function transitionVisualization(changeTo, changeFrom){
		currentlyDisplayedVis = changeTo;
		if(changeTo == vis1Name)
			d3.select("#span-currentVisualization").text(vis1Title);
		else
			d3.select("#span-currentVisualization").text(vis2Title);
		
		d3.select("." + changeTo)
			.transition()
			.duration(transitionDuration)
			.style("width", visualizationWidth + marginAllowanceSides)
			.style("opacity", 1);
			
		d3.select("." + changeFrom)
			.transition()
			.duration(transitionDuration*2/3)
			.style("width", 0)
			.style("opacity", 0);
	}
	
	// this is passed into our d3 csv data loading method, and converts our RES_CNT
	// string for each object into a number
	function type(d) {
	  d.RES_CNT = +d.RES_CNT; // coerce to number
	  return d;
	}
	
    return {
        init: init
    }
}(jQuery));