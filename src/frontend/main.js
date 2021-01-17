const searchBar = document.getElementById("searchBar");

let currentSearchInput = "";
let enteredSearchInput = "";

let visibleNodes = [];
let visibleLinks = [];
let setMode = "add";
// setMode: add, subtract, focus

const highlightNodes = new Set();
const highlightLinks = new Set();
let hoverNode = null;



const Graph = ForceGraph3D()
    (document.getElementById('3d-graph'))
    .jsonUrl('./data.json')
    .nodeAutoColorBy('group')
    // .linkVisibility(link => link['value'] == 1)
    .linkDirectionalArrowLength(3.5)
    .linkDirectionalArrowRelPos(1)
    .enableNodeDrag(false) //disable node dragging
    .linkWidth(link => highlightLinks.has(link) ? 4 : 2)
    .linkDirectionalParticles(link => highlightLinks.has(link) ? 4 : 0)
    .linkDirectionalParticleWidth(4)
    .d3AlphaDecay(.05)
    .d3VelocityDecay(.4)
    .onNodeClick(node => window.open(`https://catalog.ucsc.edu/Current/General-Catalog/Search-Results?q=`+node.id, '_blank'))
    .nodeThreeObject(node => {
        const sprite = new SpriteText(node.id);
        sprite.material.depthWrite = false; // make sprite background transparent
        sprite.color = node.color;
        sprite.textHeight = 8;
        return sprite;
    })
    .onNodeHover(node => {
        const elem = document.getElementById('3d-graph');
        elem.style.cursor = node ? 'pointer' : null;
        // no state change
        if ((!node && !highlightNodes.size) || (node && hoverNode === node)) return;

        highlightNodes.clear();
        highlightLinks.clear();
        if (node) {
          highlightNodes.add(node);
          neighbors = getNeighbors(node);
          neighbors[0].forEach(neighbor => highlightNodes.add(neighbor));
          neighbors[1].forEach(link => highlightLinks.add(link));
        }

        hoverNode = node || null;

        updateHighlight();
      })
      .onLinkHover(link => {
        highlightNodes.clear();
        highlightLinks.clear();

        if (link) {
          highlightLinks.add(link);
          highlightNodes.add(link.source);
          highlightNodes.add(link.target);
        }

        updateHighlight();
      });


function updateHighlight() {
// trigger update of highlighted objects in scene
Graph
    .linkDirectionalParticles(Graph.linkDirectionalParticles());
    visibleNodes.forEach(node => {
        node.color = Graph.nodeColor();
    });

    // .nodeColor(Graph.nodeColor())
    // .linkWidth(Graph.linkWidth())
    
}



// Spread nodes a little wider
Graph.d3Force('charge').strength(-120);

this.addEventListener("keydown", (event) => {
    if(event.code == 'Enter')
    {
        let searchbarValue = document.getElementById('searchbar').value;
        enteredSearchInput = searchbarValue

        if (enteredSearchInput == "")
        {
            makeAllVisible();
        }

        // console.log("searchbarValue: " + searchbarValue);
        // console.log("enteredSearchInput: " + enteredSearchInput);
        
        let foundResult = false;
        let foundNode = null;
        let foundDepartment = null;

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
            let splitString = node.id.split(" ");
            let thisDepartment = splitString[0];
            if(thisDepartment == enteredSearchInput)
            {
                foundDepartment = thisDepartment;
                foundResult = true;
            }
        });

        if(foundResult == true)
        {
            if (foundNode) 
            {
                let expansionResult = expandFromRoot(foundNode);

                if (setMode == "add")
                {
                    expansionResult[0].forEach(node => {
                        visibleNodes.push(node);
                    });
                    expansionResult[1].forEach(link => {
                        visibleLinks.push(link);
                    });
                }

                if (setMode == "subtract")
                {
                    Graph.graphData().links.forEach(link => {
                        if(expansionResult[0].includes(link.target) || expansionResult[0].includes(link.source))
                        {
                            visibleLinks = arrayRemove(visibleLinks, link);
                        }
                    });

                    visibleNodes.forEach(node => {
                        if(expansionResult[0].includes(node))
                        {
                            visibleNodes = arrayRemove(visibleNodes, node);
                        }
                    });
                    visibleLinks.forEach(link => {
                        if(expansionResult[1].includes(link))
                        {
                            visibleLinks = arrayRemove(visibleLinks, link);
                        }
                    });
                }
                
                focusVisible()
                zoomOnNode(foundNode);
                
            }

            if (foundDepartment)
            {
                focusVisible()
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

function getNeighbors(node){
    let resultNodes = [];
    let resultLinks = [];

    if (visibleNodes.includes(node))
    {
        resultNodes.push(node)

        Graph.graphData().links.forEach(link => {
            if (link.target == node && visibleLinks.includes(link) && visibleNodes.includes(link.target)) {
                resultNodes.push(link.source);
                resultLinks.push(link);
            }
        });
    }
    
    return [resultNodes, resultLinks];
}

function expandFromRoot(node){
    let resultNodes = [];
    let resultLinks = [];
    let stack = [];

    resultNodes.push(node)

    Graph.graphData().links.forEach(link => {
        if (link.target == node) {
            stack.push(link.source);
            resultNodes.push(link.source);
            resultLinks.push(link);
        }
    });
    while (stack.length != 0)
    {
        let poppedNode = stack.pop();
        Graph.graphData().links.forEach(link => {
            if (link.target == poppedNode && !resultNodes.includes(link.source)) {
                stack.push(link.source);
                resultNodes.push(link.source);
                resultLinks.push(link);
            }
        });
    }

    return [resultNodes, resultLinks];
}

function makeAllVisible()
{
    // Reset visibility of all nodes
    Graph.graphData().nodes.forEach(node => {
        node.__threeObj.visible = true;
    });

    // Reset visibility of all links
    Graph.graphData().links.forEach(link => {
        link.__lineObj.visible = true;
        link.__arrowObj.visible = true;
    });

    Graph.graphData().nodes.forEach(node => {
        visibleNodes.push(node);
    });
    Graph.graphData().links.forEach(link => {
        visibleLinks.push(link);
    });
}

function clearVisibleArrays()
{
    // Clear arrays
    visibleNodes.splice(0, visibleNodes.length)
    visibleLinks.splice(0, visibleLinks.length)
}

function focusVisible()
{
    makeAllVisible();
    
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
            link.__arrowObj.visible = false;
        }
    });
}

function addToSet() 
{
    setMode = "add";
    console.log("addToSet");
}

function subtractToSet() 
{
    setMode = "subtract";
    console.log("subtractToSet");
}

function reset() 
{
    clearVisibleArrays();
    makeAllVisible();
    console.log("reset");
    Graph.zoomToFit();
}


function arrayRemove(arr, value) { 
    
    return arr.filter(function(ele){ 
        return ele != value; 
    });
}