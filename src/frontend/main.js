// 3d graph uses: https://github.com/vasturiano/3d-force-graph

const searchBar = document.getElementById("searchBar");

let Graph = ForceGraph3D();

let currentSearchInput = "";
let enteredSearchInput = "";

let visibleNodes = new Set();
let visibleLinks = new Set();
let visibleGraphData = {};

let setMode = "add";
// setMode: add, subtract, focus

const highlightNodes = new Set();
const highlightLinks = new Set();
let hoverNode = null;

// Get JSON data: https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Objects/JSON
let requestURL = './data.json';
let request = new XMLHttpRequest();

request.open('GET', requestURL);
request.responseType = 'json';
request.send();

request.onload = function() 
{
    const allData = request.response;
    // Console log data for reference
    // console.log(data);
    // console.log(data['nodes'][100]);
    // console.log(data['links'][100]);

    visibleGraphData = getAllData(allData);

    Graph = ForceGraph3D()
    (document.getElementById('3d-graph'))
    .graphData(visibleGraphData)
    // .jsonUrl('./data.json')
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
    // .onNodeHover(node => {
    //     const elem = document.getElementById('3d-graph');
    //     elem.style.cursor = node ? 'pointer' : null;
    //     // no state change
    //     if ((!node && !highlightNodes.size) || (node && hoverNode === node)) return;

    //     highlightNodes.clear();
    //     highlightLinks.clear();
    //     if (node) {
    //       highlightNodes.add(node);
    //       neighbors = getNeighbors(node);
    //       neighbors[0].forEach(neighbor => highlightNodes.add(neighbor));
    //       neighbors[1].forEach(link => highlightLinks.add(link));
    //     }

    //     hoverNode = node || null;

    //     updateHighlight();
    //   })
    //   .onLinkHover(link => {
    //     highlightNodes.clear();
    //     highlightLinks.clear();

    //     if (link) {
    //       highlightLinks.add(link);
    //       highlightNodes.add(link.source);
    //       highlightNodes.add(link.target);
    //     }

    //     updateHighlight();
    //   });

}

/*
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
*/

this.addEventListener("keydown", (event) => {
    if(event.code == 'Enter')
    {
        let searchbarValue = document.getElementById('searchbar').value;
        enteredSearchInput = searchbarValue

        // if (enteredSearchInput == "")
        // {
        //     makeAllVisible();
        // }
        
        let foundResult = false;
        let foundNode = null;
        // let foundDepartment = null;

        // Example graphData() getting
        // console.log(Graph.graphData().nodes[10]);
        // console.log(Graph.graphData().links[10]);

        // Search for node.id or department name
        visibleNodes.forEach(node => {
            if(node.id == enteredSearchInput)
            {
                foundNode = node;
                foundResult = true;
            }
            // let splitString = node.id.split(" ");
            // let thisDepartment = splitString[0];
            // if(thisDepartment == enteredSearchInput)
            // {
            //     foundDepartment = thisDepartment;
            //     foundResult = true;
            // }
        });

        if(foundResult == true)
        {
            let expansionResult = getExpandedFromRoot(foundNode);

            if (setMode == "add")
            {
                visibleNodes.clear();
                visibleLinks.clear();

                expansionResult['nodes'].forEach(node => {
                    visibleNodes.add(node);
                });
                expansionResult['links'].forEach(link => {
                    visibleLinks.add(link);
                });

                updateVisualGraph();

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

function getExpandedFromRoot(node){
    let resultNodes = [];
    let resultLinks = [];
    let stack = [];

    resultNodes.push(node)

    Graph.graphData.links.forEach(link => {
        if (link.target == node) {
            stack.push(link.source);
            resultNodes.push(link.source);
            resultLinks.push(link);
        }
    });
    while (stack.length != 0)
    {
        let poppedNode = stack.pop();
        Graph.graphData.links.forEach(link => {
            if (link.target == poppedNode && !resultNodes.includes(link.source)) {
                stack.push(link.source);
                resultNodes.push(link.source);
                resultLinks.push(link);
            }
        });
    }

    return {nodes: resultNodes, links: resultLinks};
}

// function addToSet() 
// {
//     setMode = "add";
//     console.log("addToSet");
// }

// function subtractToSet() 
// {
//     setMode = "subtract";
//     console.log("subtractToSet");
// }

// function reset() 
// {
//     clearVisibleArrays();
//     makeAllVisible();
//     console.log("reset");
//     Graph.zoomToFit();
// }

function getAllData(data)
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
    Graph.graphData = {nodes: Array.from(visibleNodes), links: Array.from(visibleLinks)};
}