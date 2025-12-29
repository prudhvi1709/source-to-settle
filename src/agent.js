// Agent Execution Module
import { asyncLLM } from "asyncllm";
import { openaiConfig } from "bootstrap-llm-provider";
import { parse } from "partial-json";
import { html, render } from "lit-html";
import { config } from "./config.js";
import { updateWorkflowNode, activateWorkflowPath } from "./workflow.js";
import { updateTimeline, renderAgentOutputs, toggleAllAgents } from "./ui.js";
import { getPrompt } from "./promptLoader.js";

// Global state
export let agentOutputs = [];
export let orchestrationPlan = null;

// Workflow Status Manager - consolidates all status update logic
export class WorkflowStatus {
  updateBanner(text, step = null) {
    const statusText = document.querySelector("#workflow-status-text");
    const stepBadge = document.querySelector("#workflow-step-badge");
    if (statusText) statusText.textContent = text;
    if (stepBadge && step) {
      stepBadge.textContent = step;
      stepBadge.className = "badge bg-primary";
    }
  }

  update(agentName, status, options = {}) {
    const { description = '', step = null, icon = null, index = null } = options;

    // Update timeline
    if (description || icon) {
      updateTimeline(agentName, description, index, status === 'completed', status === 'error', icon);
    }

    // Update workflow visualization
    updateWorkflowNode(agentName, status);

    // Update banner
    if (step) {
      this.updateBanner(description || `Processing: ${agentName}`, step);
    } else if (description) {
      this.updateBanner(description);
    }

    // Render agent outputs if needed
    if (agentOutputs.length > 0) {
      renderAgentOutputs(agentOutputs);
    }
  }

  finalVerdict(evaluation) {
    const stepBadge = document.querySelector("#workflow-step-badge");
    if (stepBadge) {
      stepBadge.className = evaluation.verdict === "APPROVE" ? "badge bg-success" : "badge bg-danger";
    }
    this.updateBanner(`Workflow Complete: ${evaluation.verdict}`, `${evaluation.confidenceScore}% confidence`);
  }
}

const workflowStatus = new WorkflowStatus();

// Unified LLM streaming function
async function streamLLM(config, prompt, agentIndex) {
  const { baseUrl, apiKey } = await openaiConfig();

  if (!baseUrl || !apiKey) {
    throw new Error("LLM not configured. Please click the 'Configure LLM' button (🪄) in the navigation bar to set your API endpoint and key.");
  }

  const modelInput = document.querySelector("#model");
  const temperatureInput = document.querySelector("#temperature");

  const body = {
    model: modelInput?.value || config.defaults?.model || "gpt-5-mini",
    messages: [{ role: "user", content: prompt }],
    stream: true,
  };

  const temperatureValue = parseFloat(temperatureInput?.value || 1);
  if (temperatureValue && temperatureValue !== 1) {
    body.temperature = temperatureValue;
  }

  let fullResponse = "";

  try {
    for await (
      const { content, error } of asyncLLM(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify(body),
      })
    ) {
      if (error) {
        throw new Error(`API returned error: ${JSON.stringify(error)}`);
      }
      if (!content) continue;

      fullResponse = content;

      // Try to parse and update agent output
      try {
        const parsed = parse(fullResponse);
        agentOutputs[agentIndex].data = parsed;
        agentOutputs[agentIndex].status = 'streaming';
      } catch (parseError) {
        agentOutputs[agentIndex].data = { raw: fullResponse };
        agentOutputs[agentIndex].status = 'streaming';
      }

      renderAgentOutputs(agentOutputs);
    }
  } catch (e) {
    agentOutputs[agentIndex].status = 'failed';
    agentOutputs[agentIndex].error = e.message;
    renderAgentOutputs(agentOutputs);
    throw new Error(`LLM call failed: ${e.message}`);
  }

  agentOutputs[agentIndex].status = 'completed';
  renderAgentOutputs(agentOutputs);

  return fullResponse;
}

// Run orchestrator
export async function runOrchestrator(extractedData) {
  const orchestratorConfig = config.orchestrator;
  if (!orchestratorConfig) {
    throw new Error("No orchestrator configuration found");
  }

  workflowStatus.update("orchestrator", "processing", {
    description: "Analyzing documents and planning agent execution...",
    icon: orchestratorConfig.icon,
    index: 0
  });

  const agentCatalog = config.agents.map(agent => ({
    name: agent.name,
    description: agent.description,
    role: agent.role,
    capabilities: agent.task
  }));

  const prompt = await getPrompt('orchestrator', {
    name: orchestratorConfig.name,
    description: orchestratorConfig.description,
    role: orchestratorConfig.role,
    agentCatalog: JSON.stringify(agentCatalog, null, 2),
    fileList: extractedData.map(d => `- ${d.filename} (${d.type || 'unknown type'})`).join('\n'),
    filePreview: extractedData.map(d => `File: ${d.filename}\nPreview: ${d.text.substring(0, 300)}...\n`).join('\n---\n'),
    task: orchestratorConfig.task
  });

  // Don't add orchestrator to agentOutputs - it's displayed separately in the plan box
  try {
    const { baseUrl, apiKey } = await openaiConfig();

    if (!baseUrl || !apiKey) {
      throw new Error("LLM not configured. Please click the 'Configure LLM' button (🪄) in the navigation bar to set your API endpoint and key.");
    }

    const modelInput = document.querySelector("#model");
    const temperatureInput = document.querySelector("#temperature");

    const body = {
      model: modelInput?.value || config.defaults?.model || "gpt-5-mini",
      messages: [{ role: "user", content: prompt }],
      stream: true,
    };

    const temperatureValue = parseFloat(temperatureInput?.value || 1);
    if (temperatureValue && temperatureValue !== 1) {
      body.temperature = temperatureValue;
    }

    let fullResponse = "";

    for await (
      const { content, error } of asyncLLM(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify(body),
      })
    ) {
      if (error) {
        throw new Error(`API returned error: ${JSON.stringify(error)}`);
      }
      if (!content) continue;
      fullResponse = content;
    }

    const result = JSON.parse(fullResponse);

    workflowStatus.update("orchestrator", "completed", {
      description: `Plan created: ${result.agentPlan?.length || 0} agents selected`,
      icon: orchestratorConfig.icon,
      index: 0
    });

    if (result.agentPlan) {
      activateWorkflowPath(result.agentPlan);
    }

    return result;
  } catch (e) {
    console.error("Orchestrator error:", e);
    workflowStatus.update("orchestrator", "error", {
      description: `Error: ${e.message}`,
      icon: orchestratorConfig.icon,
      index: 0
    });
    throw e;
  }
}

// Run agent
export async function runAgent(agent, extractedData, previousResults) {
  const context = {
    files: extractedData.map(d => ({ filename: d.filename, preview: d.text.substring(0, 500) })),
    previousResults: previousResults.map(r => ({ agent: r.agent, summary: r.summary })),
  };

  const prompt = await getPrompt('agent', {
    agentName: agent.name,
    description: agent.description,
    role: agent.role,
    context: JSON.stringify(context, null, 2),
    extractedData: extractedData.map(d => `File: ${d.filename}\n${d.text}`).join("\n\n---\n\n"),
    task: agent.task
  });

  const agentIndex = agentOutputs.length;
  agentOutputs.push({
    agent: agent,
    status: 'processing',
    data: null
  });

  const fullResponse = await streamLLM(config, prompt, agentIndex);

  try {
    return JSON.parse(fullResponse);
  } catch (e) {
    return {
      summary: fullResponse,
      findings: "",
      recommendations: "",
      concerns: "",
    };
  }
}

// Run final evaluation
export async function runFinalEvaluation(extractedData, agentResults) {
  workflowStatus.update("finaleval", "processing", {
    description: "Synthesizing all agent outputs for final decision...",
    icon: "bi bi-clipboard-check",
    index: agentResults.length + 1
  });

  const agentSummaries = agentResults.map(r => ({
    agent: r.agent,
    stage: r.stage,
    summary: r.summary,
    concerns: r.concerns,
    recommendations: r.recommendations
  }));

  const prompt = await getPrompt('evaluation', {
    scenario: orchestrationPlan?.scenario || 'Document processing',
    agentSummaries: JSON.stringify(agentSummaries, null, 2),
    documentList: extractedData.map(d => `- ${d.filename}`).join('\n')
  });

  const evalIndex = agentOutputs.length;
  agentOutputs.push({
    agent: {
      name: "Final Evaluation",
      icon: "bi bi-clipboard-check",
      description: "Final approval decision"
    },
    status: 'processing',
    data: null
  });

  try {
    const fullResponse = await streamLLM(config, prompt, evalIndex);
    const evaluation = JSON.parse(fullResponse);

    workflowStatus.update("finaleval", "completed", {
      description: `${evaluation.verdict} (${evaluation.confidenceScore}% confidence)`,
      icon: "bi bi-clipboard-check",
      index: agentResults.length + 1
    });

    workflowStatus.finalVerdict(evaluation);

    return evaluation;
  } catch (e) {
    console.error("Final evaluation error:", e);
    workflowStatus.update("finaleval", "error", {
      description: `Error: ${e.message}`,
      icon: "bi bi-clipboard-check",
      index: agentResults.length + 1
    });
    throw e;
  }
}

// Process agent workflow
export async function processAgentWorkflow(extractedData) {
  const results = [];
  agentOutputs = [];

  const outputDiv = document.querySelector("#agent-output");

  try {
    // Step 1: Run orchestrator
    orchestrationPlan = await runOrchestrator(extractedData);

    if (!orchestrationPlan || !orchestrationPlan.agentPlan || orchestrationPlan.agentPlan.length === 0) {
      return { results, orchestrationPlan, finalEvaluation: null };
    }

    // Display orchestration plan at the top, then buttons, then accordion for agents
    if (outputDiv) {
      render(html`
      <div class="mb-4">
        <div class="alert alert-info">
          <div class="d-flex align-items-start">
            <i class="bi bi-diagram-3 display-6 me-3"></i>
            <div class="flex-grow-1">
              <h5 class="mb-2"><i class="bi bi-lightbulb me-2"></i>Orchestration Plan</h5>
              <p class="mb-2"><strong>Scenario:</strong> ${orchestrationPlan.scenario}</p>
              <p class="mb-2"><strong>Reasoning:</strong> ${orchestrationPlan.reasoning}</p>
              <p class="mb-2"><strong>Agent Sequence:</strong> ${orchestrationPlan.agentPlan.join(' → ')}</p>
              <p class="mb-0"><strong>Expected Outcome:</strong> ${orchestrationPlan.expectedOutcome}</p>
            </div>
          </div>
        </div>
      </div>
      <div class="mb-3 d-flex justify-content-end">
        <div class="btn-group btn-group-sm" role="group">
          <button type="button" class="btn btn-outline-primary btn-sm" @click=${() => toggleAllAgents(true)}>
            <i class="bi bi-arrows-expand me-1"></i>Expand All Agents
          </button>
          <button type="button" class="btn btn-outline-secondary btn-sm" @click=${() => toggleAllAgents(false)}>
            <i class="bi bi-arrows-collapse me-1"></i>Collapse All Agents
          </button>
        </div>
      </div>
      <div class="accordion" id="agent-accordion"></div>
    `, outputDiv);
    }

    // Step 2: Execute agents
    for (let i = 0; i < orchestrationPlan.agentPlan.length; i++) {
      const agentName = orchestrationPlan.agentPlan[i];
      const agent = config.agents.find(a => a.name === agentName);

      if (!agent) {
        console.warn(`Agent ${agentName} not found in config`);
        continue;
      }

      workflowStatus.update(agent.name, "processing", {
        description: agent.description,
        icon: agent.icon,
        index: i + 1,
        step: `Step ${i + 1} of ${orchestrationPlan.agentPlan.length}`
      });

      try {
        const agentResult = await runAgent(agent, extractedData, results);
        results.push({
          agent: agent.name,
          stage: agent.stage,
          ...agentResult,
        });

        workflowStatus.update(agent.name, "completed", {
          description: agent.description,
          icon: agent.icon,
          index: i + 1
        });
      } catch (e) {
        console.error(`Error in ${agent.name}:`, e);
        workflowStatus.update(agent.name, "error", {
          description: `Error: ${e.message}`,
          icon: agent.icon,
          index: i + 1
        });
      }
    }

    // Step 3: Run final evaluation
    const finalEvaluation = await runFinalEvaluation(extractedData, results);

    return { results, orchestrationPlan, finalEvaluation };
  } catch (e) {
    console.error("Workflow processing error:", e);
    throw e;
  }
}

// Export workflow status for external use
export { workflowStatus };
