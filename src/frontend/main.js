// 3d graph uses: https://github.com/vasturiano/3d-force-graph

const searchBar = document.getElementById("searchBar");

let Graph = ForceGraph3D();

let allData;

let graphDimensions = "3D";
let graphNodeText = true;

let currentSearchInput = "";
let enteredSearchInput = "";

const visibleNodes = new Set();
const visibleLinks = new Set();
let visibleGraphData = {};

const highlightNodes = new Set();
const highlightLinks = new Set();
let selectedNode = null;
let selectedExpansion = {nodes: [], links: []};

let graphSpread = true;
let maxSpreadVal = -1000;
let minSpreadVal = -200;

var firstAutocompleteHitStr = "";

function hasNumber(myString) {
    return /\d/.test(myString);
}

const autoCompleteJS = new autoComplete({
    name: "Search",
    selector: "#searchbar",
    data: {
        src: async function () {
            // Fetch External Data Source
            const source = await fetch("./data.json");
            const data = await source.json();
            // Post Loading placeholder text
            document.querySelector("#searchbar").setAttribute("placeholder", autoCompleteJS.placeHolder);
            // Returns Fetched data
            return data.nodes;
        },
        key: ["id"],
    },
    trigger: {
        event: ["input", "focus", "click"],
    },
    placeHolder: "Find a class or department...",
    threshold: 1,                        // Min. Chars length to start Engine | (Optional)
    debounce: 300,                       // Post duration for engine to start | (Optional)
    searchEngine: "loose",
    highlight: true,
    maxResults: 10,
    resultItem: {
        content: (data, element) => {
            // Modify Results Item Style
            element.style = "display: flex; justify-content: space-between;";
            // Modify Results Item Content
            element.innerHTML = `
            <span style="text-overflow: ellipsis; white-space: nowrap; overflow: hidden;">
                ${data.match}
            </span>
            <span style="display: flex; align-items: center; font-size: 13px; font-weight: 100; text-transform: uppercase; color: rgba(0,0,0,.8);">
                ${hasNumber(data.value.id) ? "class" : "department"}
            </span>`;
        },
    },
    noResults: (dataFeedback, generateList) => {
        // Generate autoComplete List
        generateList(autoCompleteJS, dataFeedback, dataFeedback.results);
        // No Results List Item
        const result = document.createElement("li");
        result.setAttribute("class", "no_result");
        result.setAttribute("tabindex", "1");
        result.innerHTML = `<span style="display: flex; align-items: center; font-weight: 100;">Found No Results for "${dataFeedback.query}"</span>`;
        document.querySelector(`#${autoCompleteJS.resultsList.idName}`).appendChild(result);
    },
    onSelection: (feedback) => {
        document.querySelector("#searchbar").blur();
        // Prepare User's Selected Value
        const selection = feedback.selection.value[feedback.selection.key];
        // Replace Input value with the selected value
        document.querySelector("#searchbar").value = selection;
        // Console log autoComplete data feedback
        runSearch();
        console.log(feedback);
    },
});
console.log(autoCompleteJS)

document.querySelector("#searchbar").addEventListener("results", function (event) {
    console.log(event.detail);
    if (event.detail.results && event.detail.results.length > 0)
        firstAutocompleteHitStr = event.detail.results[0].value.id;
    else firstAutocompleteHitStr = "";
});

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

    Graph = ForceGraph3D()
    (document.getElementById('3d-graph'))
        .graphData(visibleGraphData)
    // .jsonUrl('./data.json')
    .nodeOpacity(1)
    .nodeAutoColorBy('group')
    .linkOpacity(0.15)
    .linkDirectionalArrowLength(4)
    .linkDirectionalArrowRelPos(1)
    .enableNodeDrag(false) //disable node dragging
    .linkWidth(link => highlightLinks.has(link) ? 4 : 2)
    .linkDirectionalParticles(link => highlightLinks.has(link) ? 2 : 0)
    .linkDirectionalParticleWidth(5)
    .linkDirectionalParticleSpeed(0.005)
    .linkDirectionalParticleColor(() => 'yellow')
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
        const elem = document.getElementById('3d-graph');
        elem.style.cursor = node ? 'pointer' : null;
        if ((!node && !highlightNodes.size) || (node && selectedNode === node)) return;

        selectedNode = node;
        updateNav(selectedNode)
        openNav();
        // selectedExpansion = getExpandedFromRoot(selectedNode);
        updateSelected(selectedNode);
    })


    Graph.d3Force('charge').strength(minSpreadVal);
    document.getElementById("3d-graph").style.visibility = "visible"
    window.onresize = function () {
        Graph.height(window.innerHeight);
        Graph.width(window.innerWidth);
    }

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
        document.querySelector("#searchbar").value = firstAutocompleteHitStr
        runSearch();
    }
});

function runSearch()
{
    let searchbarValue = document.getElementById('searchbar').value;
    enteredSearchInput = searchbarValue;

    if(enteredSearchInput == "") {
        selectedNode = null;
        highlightNodes.clear();
        highlightLinks.clear();
        closeNav();
        updateHighlight();
    }

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
        selectedNode = foundNode;
        updateNav(selectedNode)
        openNav();
        selectedExpansion = getExpandedFromRoot(foundNode);
        updateSelected(selectedNode);
    }
}

function zoomOnNode(node)
{
    const distance = 100;
    const transitionTime = 2000;
    const distRatio = 1 + distance/Math.hypot(node.x, node.y, node.z);
    if (graphDimensions == "3D") {
        // Copy pasted code from focus on node example

        Graph.cameraPosition(
            { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio }, // new position
            node, // lookAt ({ x, y, z })
            transitionTime  // ms transition duration
        );
    } else {
        // Breaks when used in 2D
        // Graph.cameraPosition(
        //     { x: node.x, y: node.y, z: node.z}, // new position
        //     { x: node.x, y: node.y, z: node.z}, // lookAt ({ x, y, z })
        //     transitionTime  // ms transition duration
        // );
    }
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
    selectedExpansion['nodes'].forEach(node => {
        visibleNodes.add(node);
    });
    selectedExpansion['links'].forEach(link => {
        visibleLinks.add(link);
    });

    selectedExpansion['nodes'].forEach(node => {
        if (!visibleNodes.has(node))
        {
            visibleNodes.add(node);
        }
    });
    selectedExpansion['links'].forEach(link => {
        if (!visibleLinks.has(link))
        {
            visibleLinks.add(link);
        }
    });

    updateVisualGraph();
}

function subtractToSet()
{
    selectedExpansion['nodes'].forEach(node => {
        visibleNodes.delete(node);
        allData['links'].forEach(link => {
            if (link.source == node)
            {
                visibleLinks.delete(link);
            }
        });
    });
    selectedExpansion['links'].forEach(link => {
        visibleLinks.delete(link);
    });

    updateVisualGraph();
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

function updateSelected(node)
{
    let toUpdateGraph = false;

    // no state change
    if ((!node && !highlightNodes.size) ) return;
    // || (node && selectedNode === node)
    highlightNodes.clear();
    highlightLinks.clear();
    if (node) {
        highlightNodes.add(node);
        tree = getExpandedFromRoot(node);
        tree['nodes'].forEach(node => {
            highlightNodes.add(node);
        });
        tree['links'].forEach(link => {
            highlightLinks.add(link);
        });
    }

    selectedNode = node || null;

    document.getElementById('searchbar').value = selectedNode.id;

    updateNav(node)
    openNav();

    if (toUpdateGraph) {updateVisualGraph()};

    if(!graphNodeText) {
        Graph.nodeThreeObject(node => {
            if(highlightNodes.has(node)) {
                const sprite = new SpriteText(node.id);
                sprite.material.depthWrite = false; // make sprite background transparent
                sprite.color = node.color;
                sprite.textHeight = 8;
                return sprite;
            } else {
                return new THREE.Mesh(
                    new THREE.SphereGeometry(5, 6, 6),
                    new THREE.MeshBasicMaterial({ color: node.color })
                )
            }
        })
    }

    if (!graphNodeText) {
        Graph.nodeThreeObject(node => {
            if (highlightNodes.has(node)) {
                const sprite = new SpriteText(node.id);
                sprite.material.depthWrite = false; // make sprite background transparent
                sprite.color = node.color;
                sprite.textHeight = 8;
                return sprite;
            } else {
                return new THREE.Mesh(
                    new THREE.SphereGeometry(5, 6, 6),
                    new THREE.MeshBasicMaterial({ color: node.color })
                )
            }
        })
    }

    updateHighlight();
}

function toggleGraphDimension()
{
    if(graphDimensions == "3D")
    {
        graphDimensions = "2D";
        Graph.numDimensions(2);
    }
    else {
        graphDimensions = "3D";
        Graph.numDimensions(3);
    }

}

function toggleNodeText() {
    if (graphNodeText){
        graphNodeText = false;
        Graph.nodeThreeObject(node => {
            if(highlightNodes.has(node)) {
                const sprite = new SpriteText(node.id);
                sprite.material.depthWrite = false; // make sprite background transparent
                sprite.color = node.color;
                sprite.textHeight = 8;
                return sprite;
            } else {
                return new THREE.Mesh(
                    new THREE.SphereGeometry(5, 6, 6),
                    new THREE.MeshBasicMaterial({ color: node.color })
                )
            }
        })
    } else {
        graphNodeText = true;
        Graph.nodeThreeObject(node => {
            const sprite = new SpriteText(node.id);
            sprite.material.depthWrite = false; // make sprite background transparent
            sprite.color = node.color;
            sprite.textHeight = 8;
            return sprite;
        })
    }
}
