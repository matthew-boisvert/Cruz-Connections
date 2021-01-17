const searchBar = document.getElementById("searchBar");

var currentSearchInput = "";
var enteredSearchInput = "";

var visibleNodes = [];
var visibleLinks = [];

const Graph = ForceGraph3D()
    (document.getElementById('3d-graph'))
    .jsonUrl('./data.json')
    .nodeAutoColorBy('group')
    .nodeThreeObject(node => {
        const sprite = new SpriteText(node.id);
        sprite.material.depthWrite = false; // make sprite background transparent
        sprite.color = node.color;
        sprite.textHeight = 8;
        return sprite;
    });

// Spread nodes a little wider
Graph.d3Force('charge').strength(-120);

this.addEventListener("keydown", (event) => {
    if(event.code == 'Enter')
    {
        var searchbarValue = document.getElementById('searchbar').value;
        enteredSearchInput = searchbarValue

        // console.log("searchbarValue: " + searchbarValue);
        // console.log("enteredSearchInput: " + enteredSearchInput);
        
        var foundResult = false;
        var foundNode = null;
        var foundDepartment = null;

        // Example graphData() getting
        // console.log(Graph.graphData().nodes[10]);
        // console.log(Graph.graphData().links[10]);

        // Search for node.id or department name
        Graph.graphData().nodes.forEach(node => {
            if(node.id == enteredSearchInput)
            {
                foundNode = node;
                foundResult = true;
            }
            var splitString = node.id.split(" ");
            var thisDepartment = splitString[0];
            if(thisDepartment == enteredSearchInput)
            {
                foundDepartment = thisDepartment;
                foundResult = true;
            }
        });

        if(foundResult == true)
        {
            // Clear arrays
            visibleNodes.splice(0, visibleNodes.length)
            visibleLinks.splice(0, visibleLinks.length)

            // Reset visibility of all nodes
            Graph.graphData().nodes.forEach(node => {
                node.__threeObj.visible = true;
            });

            // Reset visibility of all links
            Graph.graphData().links.forEach(link => {
                link.__lineObj.visible = true;
            });
            
            if (foundNode) 
            {
                console.log(foundNode);
                zoomOnNode(foundNode)
            }

            if (foundDepartment)
            {
                // Add department nodes
                Graph.graphData().nodes.forEach(node => {
                    var splitString = node.id.split(" ");
                    var thisDepartment = splitString[0];
                    if(thisDepartment == enteredSearchInput)
                    {
                        visibleNodes.push(node)
                    }
                });
                
                // Add department links
                Graph.graphData().links.forEach(link => {
                    var splitString = link.source.id.split(" ");
                    var sourceDepartment = splitString[0];
                    if (visibleNodes.includes(link.source) && sourceDepartment == foundDepartment) 
                    {
                        visibleLinks.push(link);
                        if(!visibleNodes.includes(link.target))
                        {
                            visibleNodes.push(link.target);
                        }
                    }
                });

                // Make everything not in visible invisible
                Graph.graphData().nodes.forEach(node => {
                    if(!visibleNodes.includes(node))
                    {
                        node.__threeObj.visible = false;
                    }
                });

                Graph.graphData().links.forEach(link => {
                    if(!visibleLinks.includes(link))
                    {
                        link.__lineObj.visible = false;
                    }
                });
            }
        }
    }
});

function zoomOnNode(node) 
{
    // Copy pasted code from focus on node example
    const distance = 300;
    const distRatio = 1 + distance/Math.hypot(node.x, node.y, node.z);

    Graph.cameraPosition(
    { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio }, // new position
    node, // lookAt ({ x, y, z })
    1000  // ms transition duration
    );
}