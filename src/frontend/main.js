// 3d graph uses: https://github.com/vasturiano/3d-force-graph

const searchBar = document.getElementById("searchBar");

let Graph = ForceGraph3D();

let allData;

let currentSearchInput = "";
let enteredSearchInput = "";

const visibleNodes = new Set();
const visibleLinks = new Set();
let visibleGraphData = {};

let setMode = "add";
// setMode: add, subtract, focus

const highlightNodes = new Set();
const highlightLinks = new Set();
let selectedNode = null;

let graphSpread = true;
let maxSpreadVal = -1000;
let minSpreadVal = -200;

// Get JSON data: https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Objects/JSON
let requestURL = './data.json';
let request = new XMLHttpRequest();

request.open('GET', requestURL);
request.responseType = 'json';
request.send();

request.onload = function() 
{
    allData = request.response;
    
    visibleGraphData = getData(allData);
    console.log(visibleGraphData);

    Graph = ForceGraph3D()
    (document.getElementById('3d-graph'))
    .graphData(visibleGraphData)
    // .jsonUrl('./data.json')
    .nodeOpacity(1)
    .nodeAutoColorBy('group')
    .linkOpacity(0.1)
    .linkDirectionalArrowLength(3.5)
    .linkDirectionalArrowRelPos(1)
    .enableNodeDrag(false) //disable node dragging
    .linkWidth(link => highlightLinks.has(link) ? 4 : 2)
    .linkDirectionalParticles(link => highlightLinks.has(link) ? 4 : 0)
    .linkDirectionalParticleWidth(4)
    .d3AlphaDecay(.05)
    .d3VelocityDecay(.4)
    .nodeThreeObject(node => {
        const sprite = new SpriteText(node.id);
        sprite.material.depthWrite = false; // make sprite background transparent
        sprite.color = node.color;
        sprite.textHeight = 8;
        return sprite;
    })
    // .onNodeClick(node => window.open(`https://catalog.ucsc.edu/Current/General-Catalog/Search-Results?q=`+node.id, '_blank'))
    .onNodeClick(node => {
        let toUpdateGraph = false;

        const elem = document.getElementById('3d-graph');
        elem.style.cursor = node ? 'pointer' : null;
        // no state change
        if ((!node && !highlightNodes.size) ) return;
        // || (node && selectedNode === node)
        highlightNodes.clear();
        highlightLinks.clear();
        if (node) {
            highlightNodes.add(node);
            tree = getExpandedFromRoot(node);
            tree['nodes'].forEach(node => {
                if (!visibleNodes.has(node))
                {
                    toUpdateGraph = true;
                    visibleNodes.add(node);
                }
                highlightNodes.add(node);
            });
            tree['links'].forEach(link => {
                if (!visibleLinks.has(link))
                {
                    toUpdateGraph = true;
                    visibleLinks.add(link);
                }
                highlightLinks.add(link);
            });
        }

        selectedNode = node || null;

        updateNav(node)
        openNav();

        if (toUpdateGraph) {updateVisualGraph()};
        
        updateHighlight();
      })

    Graph.d3Force('charge').strength(minSpreadVal);

}

function updateHighlight() {
    // trigger update of highlighted objects in scene
    Graph.linkDirectionalParticles(Graph.linkDirectionalParticles());

    // visibleNodes.forEach(node => {
    //     node.color = Graph.nodeColor();
    // });

    // .nodeColor(Graph.nodeColor())
    // .linkWidth(Graph.linkWidth())
}


this.addEventListener("keydown", (event) => {
    if(event.code == 'Enter')
    {
        let searchbarValue = document.getElementById('searchbar').value;
        enteredSearchInput = searchbarValue;
        
        let foundResult = false;
        let foundNode = null;

        // Search for node.id or department name
        allData['nodes'].forEach(node => {
            if(node.id.toLowerCase() == enteredSearchInput.toLowerCase())
            {
                foundNode = node;
                foundResult = true;
            }
        });

        if(foundResult == true)
        {
            let expansionResult = getExpandedFromRoot(foundNode);

            if (setMode == "add" && !visibleNodes.has(enteredSearchInput))
            {
                expansionResult['nodes'].forEach(node => {
                    visibleNodes.add(node);
                });
                expansionResult['links'].forEach(link => {
                    visibleLinks.add(link);
                });

                // Final visibleLink adding of any possible links between all visible nodes
                // allData['links'].forEach(link => {
                //     if (visibleNodes.has(link.target) && visibleNodes.has(link.source))
                //     {
                //         visibleLinks.add(link);
                //     }
                // });

                updateVisualGraph();
            }

            if (setMode == "subtract")
            {
                expansionResult['nodes'].forEach(node => {
                    visibleNodes.delete(node);
                    allData['links'].forEach(link => {
                        if (link.source == node)
                        {
                            visibleLinks.delete(link);
                        }
                    });
                });
                expansionResult['links'].forEach(link => {
                    visibleLinks.delete(link);
                });

                updateVisualGraph();
            }
        }
    }
});

function zoomOnNode(node) 
{
    // Copy pasted code from focus on node example
    const distance = 100;
    const distRatio = 1 + distance/Math.hypot(node.x, node.y, node.z);

    Graph.cameraPosition(
    { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio }, // new position
    node, // lookAt ({ x, y, z })
    1000  // ms transition duration
    );
}

function getExpandedFromRoot(node){
    let resultNodes = [];
    let resultLinks = [];
    let stack = [];

    resultNodes.push(node)

    allData['links'].forEach(link => {
        if (link.target == node) {
            stack.push(link.source);
            resultNodes.push(link.source);
            resultLinks.push(link);
        }
    });

    while (stack.length != 0)
    {
        let poppedNode = stack.pop();
        allData['links'].forEach(link => {
            if (link.target == poppedNode && !resultNodes.includes(link.source)) {
                stack.push(link.source);
                resultNodes.push(link.source);
                resultLinks.push(link);
            }
        });
    }

    return {nodes: resultNodes, links: resultLinks};
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

function resetGraph() 
{
    Graph.graphData(getData(allData))
    .nodeAutoColorBy('group')
    .zoomToFit();
}

function clearGraph() 
{
    visibleNodes.clear();
    visibleLinks.clear();
    updateVisualGraph();
}

function getData(data)
{
    data['nodes'].forEach(node => {
        visibleNodes.add(node);
    });

    data['links'].forEach(link => {
        visibleLinks.add(link);
    });

    return {nodes: Array.from(visibleNodes), links: Array.from(visibleLinks)};
}

function updateVisualGraph()
{
    Graph.graphData({nodes: Array.from(visibleNodes), links: Array.from(visibleLinks)});
    Graph.nodeAutoColorBy('group');
}


function openNav() {
    document.getElementById("mySidenav").style.width = "250px";
}
  
function closeNav() {
    document.getElementById("mySidenav").style.width = "0";
}

function updateNav(node) {
    document.getElementById("navTitle").innerHTML = node.id;
}

function openCourseCatalog() {
    window.open(`https://catalog.ucsc.edu/Current/General-Catalog/Search-Results?q=`+selectedNode.id, '_blank');
}

function focusHighlightedNodes() {
    let toUpdateGraph = false;
    visibleNodes.forEach(node => {
        if(!highlightNodes.has(node))
        {
            toUpdateGraph = true;
            visibleNodes.delete(node);
        }
    });
    visibleLinks.forEach(link => {
        if(!highlightLinks.has(link))
        {
            toUpdateGraph = true;
            visibleLinks.delete(link);
        }
    });
    if (toUpdateGraph) {updateVisualGraph()};
}

function zoomOnSelectedNode() {
    zoomOnNode(selectedNode);
}

function toggleNodeSpread() {
    if (graphSpread) {
        Graph.d3Force('charge').strength(maxSpreadVal);
        graphSpread = false;
    } 
    else 
    {
        Graph.d3Force('charge').strength(minSpreadVal);
        graphSpread = true;
    }
    updateVisualGraph();
}

