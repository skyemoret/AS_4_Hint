//Assignment 4
//Due Thursday April 9

var margin = {t:100,r:100,b:200,l:150},
    width = $('.canvas').width() - margin.l - margin.r,
    height = $('.canvas').height() - margin.t - margin.b,
    padding = 3;


//Set up SVG drawing elements -- already done
var svg = d3.select('.canvas')
    .append('svg')
    .attr('width', width + margin.l + margin.r)
    .attr('height', height + margin.t + margin.b)
    .append('g')
    .attr('transform','translate('+margin.l+','+margin.t+')');

//Create a mercator projection
var projection = d3.geo.mercator()
    .translate([width/2,height/2])
    .scale(300);

var scaleSize = d3.scale.sqrt().range([3,100]);

//force layout
var force = d3.layout.force()
    .size([width,height])
    .charge(0)
    .gravity(0);

d3.csv('data/world.csv',parse,function(err,world){
    //console.log(world);

    var extent = d3.extent(world, function(d){return d.pop;});
    scaleSize
        .domain(extent);


    //First, use array.map to transform the original dataset --> "world"
    var nodesArray = world.map(function(c){
        //argument c is an element in the world array, which is a country
        var xy = projection(c.lngLat);
        return{
            x:xy[0],
            y:xy[1],
            x0:xy[0],
            y0:xy[1],
            r: scaleSize(c.pop),
            pop: c.pop,
            id: c.id,
            name: c.name
        }
    });

//Draw
    var countries = svg.selectAll('.country')
        .data(nodesArray, function(d){
            return d.id;
        })
        .enter()
        .append('g')
        .attr('class','country');

    countries
        .attr('transform',function(d){
            return 'translate('+ d.x+','+ d.y+')';
        });

    force
        .nodes(nodesArray)
        .on('tick',onTick)
        .start();

    countries
        .append('circle')
        .attr('r',function(d){
            return scaleSize(d.pop);
        });



    function onTick(e){
        countries
            .attr('transform',function(d){
                return 'translate('+ d.x+','+ d.y+')';
            })

//Collision avoidance
        countries
            .each(gravity(e.alpha * .1))
            .each(collide(.5))
            .attr("cx", function(d) { return d.x; })
            .attr("cy", function(d) { return d.y; });

    };

    function gravity(k) {
        return function(d) {
            d.x += (d.x0 - d.x) * k;
            d.y += (d.y0 - d.y) * k;
        };
    }

    function collide(k) {
        var q = d3.geom.quadtree(nodesArray);
        return function(nodesArray) {
            var nr = nodesArray.r + padding,
                nx1 = nodesArray.x - nr,
                nx2 = nodesArray.x + nr,
                ny1 = nodesArray.y - nr,
                ny2 = nodesArray.y + nr;
            q.visit(function(quad, x1, y1, x2, y2) {
                if (quad.point && (quad.point !== nodesArray)) {
                    var x = nodesArray.x - quad.point.x,
                        y = nodesArray.y - quad.point.y,
                        l = x * x + y * y,
                        r = nr + quad.point.r;
                    if (l < r * r) {
                        l = ((l = Math.sqrt(l)) - r) / l * k;
                        nodesArray.x -= x *= l;
                        nodesArray.y -= y *= l;
                        quad.point.x += x;
                        quad.point.y += y;
                    }
                }
                return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
            });
        };
    }
});


//Import data
function parse(d){
    if(+d.UNc_longitude && +d.UNc_latitude){
        return {
            id: d.ISO3166A2,
            name: d.ISOen_name,
            pop: +d.population?+d.population:0,
            lngLat: [+d.UNc_longitude, +d.UNc_latitude]
        };
    }
}