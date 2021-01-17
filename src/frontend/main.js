const searchBar = document.getElementById("searchBar");

let currentSearchInput = "";
let enteredSearchInput = "";

let visibleNodes = [];
let visibleLinks = [];

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
        let searchbarValue = document.getElementById('searchbar').value;
        enteredSearchInput = searchbarValue

        if (enteredSearchInput == "ALL")
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
            // Clear arrays
            visibleNodes.splice(0, visibleNodes.length)
            visibleLinks.splice(0, visibleLinks.length)

            
            if (foundNode) 
            {
                let expansionResult = expandFromRoot(foundNode);
                // console.log(expansionResult);
                // console.log(expansionResult[0]);
                // console.log(expansionResult[1]);

                expansionResult[0].forEach(node => {
                    visibleNodes.push(node);
                });
                expansionResult[1].forEach(link => {
                    visibleLinks.push(link);
                });

                focusVisible()
                zoomOnNode(foundNode);
                
            }

            if (foundDepartment)
            {
                // // Add department nodes
                // Graph.graphData().nodes.forEach(node => {
                //     let splitString = node.id.split(" ");
                //     let thisDepartment = splitString[0];
                //     if(thisDepartment == enteredSearchInput)
                //     {
                //         visibleNodes.push(node)
                //     }
                // });
                
                // // Add department links
                // Graph.graphData().links.forEach(link => {
                //     let splitString = link.source.id.split(" ");
                //     let sourceDepartment = splitString[0];
                //     if (visibleNodes.includes(link.source) && sourceDepartment == foundDepartment) 
                //     {
                //         visibleLinks.push(link);
                //         if(!visibleNodes.includes(link.target))
                //         {
                //             visibleNodes.push(link.target);
                //         }
                //     }
                // });

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
    });
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
        }
    });
}