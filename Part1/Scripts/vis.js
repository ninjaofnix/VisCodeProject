var vis = (function () {
	var margin = {top: 20, right: 20, bottom: 60, left: 80},
		height = 500 - margin.top - margin.bottom;

	var x = d3.scaleBand()
			  .padding(0.1);
	var y = d3.scaleLinear()
			  .range([height, 0]);
	
	// vis 1: bar graph
	// population Y axis RES_CNT (resident count)
	// communities on X axis: NAME collumn
	// EDGEMONT, ACADIA, BANFF TRAIL, CRESCENT HEIGHTS, PANORAMA HILLS
	var communities = ["EDGEMONT", "ACADIA", "BANFF TRAIL", "CRESCENT HEIGHTS", "PANORAMA HILLS"];
	
	function init() {
		d3.csv("/Data/city of calgary census 2016.csv", type, function(error, data) {
			if (error) throw error;
			
			filteredData = data.filter(filterByCommunity);
			
			filteredData.forEach(function(thing) {
				console.log(thing.NAME);
				console.log(thing.RES_CNT);
			});

			var barWidth = d3.max(filteredData, function(d) { return visualLength(d.NAME); });
			var width = barWidth * filteredData.length - margin.left - margin.right;
			
			var svg = d3.select(".bar-chart")
				.attr("width", width + margin.left + margin.right)
				.attr("height", height + margin.top + margin.bottom)
					.append("g")
					.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
					  
			// Scale ranges based on filtered list to display
			x.range([0, width]);
			x.domain(filteredData.map(function(d) { return d.NAME; }));
			y.domain([0, d3.max(filteredData, function(d) { return d.RES_CNT; })]);

			// add in bars
			svg.selectAll(".bar-chart")
				.data(filteredData)
				.enter().append("rect")
				.attr("x", function(d) { return x(d.NAME); })
				.attr("width", x.bandwidth())
				.attr("y", function(d) { return y(d.RES_CNT); }) // y == 0 is at top
				.attr("height", function(d) { return height - y(d.RES_CNT); });
				
			// add the x Axis
			svg.append("g")
				.attr("transform", "translate(0," + height + ")")
				.call(d3.axisBottom(x))
				.selectAll("text")
					.style("text-anchor", "middle")
					.attr("class", "communityText");
			// add text for x Axis
			svg.append("text")
				.attr("class", "xAxisLabel")
				.attr("transform",
				"translate(" + (width/2) + " ," + 
					(height + margin.top + margin.bottom/2) + ")")
				.style("text-anchor", "middle")
				.text("Community");
				
			// add the y Axis
			svg.append("g")
				.call(d3.axisLeft(y))
				.selectAll("text")
					.attr("class", "resCountText");
			// text label for y axis
			svg.append("text")
				.attr("class", "yAxisLabel")
				.attr("transform", "rotate(-90)")
				.attr("y", 0 - margin.left)
				.attr("x",0 - (height / 2))
				.attr("dy", "1em")
				.style("text-anchor", "middle")
				.text("Population");
		});
	}
	
	function filterByCommunity(d) {
		return communities.indexOf(d.NAME) !== -1;
	}
	
	// this is passed into our d3 csv data loading method, and converts our RES_CNT
	// string for each object into a number
	function type(d) {
	  d.RES_CNT = +d.RES_CNT; // coerce to number
	  return d;
	}
	
	// finds the length in pixels of a text string to be displayed on our screen
	function visualLength(text)
	{
		var ruler = document.getElementById("ruler");
		ruler.innerHTML = text;
		return ruler.offsetWidth;
	}
	
    return {
        init: init
    }
}(jQuery));