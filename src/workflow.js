// D3 Workflow Visualization Module
import { config } from "./config.js";

// Workflow visualization state
let workflowViz = null;

// Status colors
const STATUS_COLORS = {
  pending: '#6c757d',
  processing: '#0d6efd',
  completed: '#198754',
  error: '#dc3545',
  na: '#adb5bd'
};

// Initialize workflow visualization
export function initWorkflowViz() {
  if (typeof d3 === 'undefined') {
    console.error('D3.js not loaded yet. Retrying...');
    setTimeout(initWorkflowViz, 100);
    return;
  }

  const container = d3.select("#workflow-viz-container");
  if (!container.node()) {
    console.error('Workflow container not found');
    return;
  }

  let width = container.node().getBoundingClientRect().width;
  if (width === 0) {
    width = Math.min(window.innerWidth - 40, 1200);
  }
  const height = 500;

  container.selectAll("*").remove();

  const svg = container.append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("preserveAspectRatio", "xMidYMid meet");

  // Add legend
  container.append("div")
    .attr("class", "workflow-legend")
    .html(`
      <div class="legend-item"><span class="legend-dot" style="background: ${STATUS_COLORS.pending};"></span> Pending</div>
      <div class="legend-item"><span class="legend-dot" style="background: ${STATUS_COLORS.processing};"></span> Processing</div>
      <div class="legend-item"><span class="legend-dot" style="background: ${STATUS_COLORS.completed};"></span> Completed</div>
      <div class="legend-item"><span class="legend-dot" style="background: ${STATUS_COLORS.error};"></span> Error</div>
      <div class="legend-item"><span class="legend-dot" style="background: ${STATUS_COLORS.na}; opacity: 0.5;"></span> N/A</div>
    `);

  // Create node data
  const agents = config.agents || [];
  const nodes = [
    { id: "orchestrator", label: "Orchestrator", icon: "bi bi-diagram-3", type: "orchestrator", x: width / 2, y: 80 },
    ...agents.map((agent, i) => ({
      id: agent.name,
      label: agent.name,
      icon: agent.icon,
      stage: agent.stage,
      type: "agent",
      x: (width / (agents.length + 1)) * (i + 1),
      y: 250
    })),
    { id: "finaleval", label: "Final Evaluation", icon: "bi bi-clipboard-check", type: "finaleval", x: width / 2, y: 420 }
  ];

  const links = [];

  workflowViz = { svg, nodes, links, width, height };
  window.workflowViz = workflowViz;

  const linkGroup = svg.append("g").attr("class", "links");
  const nodeGroup = svg.append("g").attr("class", "nodes");

  const nodeElements = nodeGroup.selectAll("g")
    .data(nodes)
    .join("g")
    .attr("class", d => `agent-node pending ${d.type}`)
    .attr("transform", d => `translate(${d.x}, ${d.y})`)
    .on("click", (event, d) => {
      if (d.type === "agent") {
        const agentOutput = window.agentOutputs?.find(out => out.agent.name === d.id);
        if (agentOutput) {
          const index = window.agentOutputs.indexOf(agentOutput);
          const collapseEl = document.getElementById(`collapse-agent-${index}`);
          if (collapseEl) {
            new bootstrap.Collapse(collapseEl, { toggle: true });
            collapseEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }
      }
    });

  // Create node elements
  nodeElements.each(function(d) {
    const node = d3.select(this);

    node.append("rect")
      .attr("x", -70).attr("y", -40)
      .attr("width", 140).attr("height", 80)
      .attr("rx", 12)
      .attr("fill", "var(--bs-card-bg, #fff)")
      .attr("stroke", "var(--bs-border-color, #dee2e6)")
      .attr("stroke-width", 2);

    node.append("text")
      .attr("class", d.icon)
      .attr("x", 0).attr("y", -10)
      .attr("text-anchor", "middle")
      .attr("font-size", "2.5rem")
      .attr("fill", "#0d6efd")
      .style("font-family", "bootstrap-icons");

    node.append("text")
      .attr("x", 0).attr("y", 20)
      .attr("text-anchor", "middle")
      .attr("font-size", "0.85rem")
      .attr("font-weight", "600")
      .attr("fill", "currentColor")
      .text(d.label)
      .call(wrapText, 130);

    if (d.stage) {
      node.append("text")
        .attr("x", 0).attr("y", 35)
        .attr("text-anchor", "middle")
        .attr("font-size", "0.7rem")
        .attr("fill", "#6c757d")
        .text(d.stage);
    }

    node.append("rect")
      .attr("class", "status-badge-bg")
      .attr("x", 25).attr("y", -35)
      .attr("width", 40).attr("height", 16)
      .attr("rx", 8)
      .attr("fill", STATUS_COLORS.pending);

    node.append("text")
      .attr("class", "status-badge-text")
      .attr("x", 45).attr("y", -24)
      .attr("text-anchor", "middle")
      .attr("font-size", "0.65rem")
      .attr("fill", "white")
      .text("Pending");
  });

  // Responsive handling
  let resizeTimeout;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      const newWidth = container.node()?.getBoundingClientRect().width;
      if (newWidth && workflowViz?.svg) {
        workflowViz.svg.attr("viewBox", `0 0 ${newWidth} ${height}`);
        workflowViz.width = newWidth;
      }
    }, 250);
  });
}

// Helper to wrap text
function wrapText(text, width) {
  text.each(function() {
    const text = d3.select(this);
    const words = text.text().split(/\s+/).reverse();
    let word, line = [], lineNumber = 0;
    const lineHeight = 1.1, y = text.attr("y"), dy = 0;
    let tspan = text.text(null).append("tspan").attr("x", 0).attr("y", y).attr("dy", dy + "em");

    while (word = words.pop()) {
      line.push(word);
      tspan.text(line.join(" "));
      if (tspan.node().getComputedTextLength() > width) {
        line.pop();
        tspan.text(line.join(" "));
        line = [word];
        tspan = text.append("tspan").attr("x", 0).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
      }
    }
  });
}

// Update node status
export function updateWorkflowNode(agentName, status) {
  if (!workflowViz) {
    console.warn('workflowViz not initialized - reinitializing...');
    initWorkflowViz();
    if (!workflowViz) return;
  }

  const { svg } = workflowViz;
  if (!svg || svg.empty()) {
    console.warn('SVG element missing - reinitializing...');
    initWorkflowViz();
    if (!workflowViz) return;
  }

  const nodes = svg.selectAll(".agent-node")
    .filter(d => d.id === agentName || d.id === agentName.toLowerCase());

  // Update node class
  nodes.attr("class", d => {
    let classes = `agent-node ${d.type}`;
    if (status === "processing") classes += " active";
    else if (status === "completed") classes += " completed";
    else if (status === "error") classes += " error";
    else classes += " pending";
    return classes;
  });

  // Update status badge
  const badgeColor = STATUS_COLORS[status] || STATUS_COLORS.pending;
  const badgeText = { processing: "Active", completed: "Done", error: "Error", pending: "Pending" }[status] || "Pending";

  nodes.select(".status-badge-bg").attr("fill", badgeColor);
  nodes.select(".status-badge-text").text(badgeText);

  if (status === "processing") {
    animateDataFlow(agentName);
  }
}

// Activate workflow path based on agent plan
export function activateWorkflowPath(agentPlan) {
  if (!workflowViz || !agentPlan || agentPlan.length === 0) return;

  const { svg, nodes } = workflowViz;

  // Mark N/A agents
  const naNodes = svg.selectAll(".agent-node")
    .filter(d => d.type === "agent" && !agentPlan.includes(d.id))
    .attr("class", d => `agent-node ${d.type} not-applicable`);

  naNodes.select(".status-badge-bg").attr("fill", STATUS_COLORS.na);
  naNodes.select(".status-badge-text").text("N/A");

  // Build links
  const newLinks = [
    { source: "orchestrator", target: agentPlan[0], status: "active" }
  ];

  for (let i = 0; i < agentPlan.length - 1; i++) {
    newLinks.push({ source: agentPlan[i], target: agentPlan[i + 1], status: "active" });
  }

  newLinks.push({ source: agentPlan[agentPlan.length - 1], target: "finaleval", status: "active" });

  workflowViz.links = newLinks;

  // Create path
  function createPath(d) {
    const sourceNode = nodes.find(n => n.id === d.source);
    const targetNode = nodes.find(n => n.id === d.target);
    if (!sourceNode || !targetNode) return "";

    const sx = sourceNode.x, sy = sourceNode.y + 40;
    const tx = targetNode.x, ty = targetNode.y - 40;
    const midY = (sy + ty) / 2;

    return `M ${sx} ${sy} L ${sx} ${midY} L ${tx} ${midY} L ${tx} ${ty}`;
  }

  const linkGroup = svg.select(".links");
  linkGroup.selectAll("path").remove();

  linkGroup.selectAll("path")
    .data(newLinks)
    .join("path")
    .attr("class", "flow-link active")
    .attr("d", createPath)
    .attr("stroke-dasharray", "5,5")
    .attr("opacity", 0)
    .transition()
    .duration(800)
    .attr("opacity", 0.6);
}

// Animate data flow
function animateDataFlow(agentName) {
  if (!workflowViz) return;

  const { svg, nodes, links } = workflowViz;
  const agentNode = nodes.find(n => n.id === agentName);
  if (!agentNode) return;

  const incomingLink = links.find(l => l.target === agentName);
  if (!incomingLink) return;

  const sourceNode = nodes.find(n => n.id === incomingLink.source);
  if (!sourceNode) return;

  const sx = sourceNode.x, sy = sourceNode.y + 40;
  const tx = agentNode.x, ty = agentNode.y - 40;
  const midY = (sy + ty) / 2;

  const particle = svg.append("circle")
    .attr("class", "data-particle")
    .attr("r", 6)
    .attr("cx", sx)
    .attr("cy", sy);

  particle
    .transition().duration(400).ease(d3.easeCubicInOut).attr("cy", midY)
    .transition().duration(600).ease(d3.easeCubicInOut).attr("cx", tx)
    .transition().duration(400).ease(d3.easeCubicInOut).attr("cy", ty)
    .on("end", function() { d3.select(this).remove(); });
}

export { workflowViz };
