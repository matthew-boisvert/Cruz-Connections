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