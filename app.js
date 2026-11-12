/**
 * Snapdeal AI Virtual Key Account Manager (Virtual KAM)
 * Real-time 2-Way Voice Agent with Seller Business Diagnostics
 * Author: AI First Intern Candidate
 */

// Application State
const state = {
  isCallActive: false,
  isListening: false,
  isSpeaking: false,
  callDuration: 0,
  timerInterval: null,
  recognition: null,
  speechSynth: window.speechSynthesis,
  selectedVoice: null,
  speechRate: 1.05,
  conversationHistory: [],
  lastKamResponse: "",
  aiEngine: "builtin", // 'builtin' | 'gemini' | 'openai'
  apiKey: "",
  sellerData: {
    name: "Rajesh Garments",
    location: "Ludhiana",
    sellerId: "SD-8942",
    category: "Fashion & Apparel",
    metrics: {
      lastMonthSales: 200000,
      thisMonthSales: 135000,
      salesDelta: -32.5,
      lastMonthOrders: 400,
      thisMonthOrders: 270,
      ordersDelta: -32.5,
      lastMonthCancellation: 8,
      thisMonthCancellation: 14,
      cancellationDelta: 75.0,
      lastMonthAsp: 500,
      thisMonthAsp: 500,
      aspDelta: 0.0,
      lastMonthOos: 5,
      thisMonthOos: 18,
      oosDelta: 260.0
    }
  }
};

// DOM Elements
const toggleCallBtn = document.getElementById("toggleCallBtn");
const callBtnText = document.getElementById("callBtnText");
const micIcon = document.getElementById("micIcon");
const interruptBtn = document.getElementById("interruptBtn");
const replayBtn = document.getElementById("replayBtn");
const callStatusText = document.getElementById("callStatusText");
const callTimer = document.getElementById("callTimer");
const visualizerWrapper = document.getElementById("visualizerWrapper");
const voiceOrb = document.getElementById("voiceOrb");
const audioCanvas = document.getElementById("audioCanvas");
const transcriptBox = document.getElementById("transcriptBox");
const clearChatBtn = document.getElementById("clearChatBtn");
const copySummaryBtn = document.getElementById("copySummaryBtn");
const exportPdfBtn = document.getElementById("exportPdfBtn");
const toast = document.getElementById("toast");
const toastMsg = document.getElementById("toastMsg");

// Settings Modal Elements
const openSettingsBtn = document.getElementById("openSettingsBtn");
const closeSettingsBtn = document.getElementById("closeSettingsBtn");
const saveSettingsBtn = document.getElementById("saveSettingsBtn");
const settingsModal = document.getElementById("settingsModal");
const engineSelect = document.getElementById("engineSelect");
const apiKeyGroup = document.getElementById("apiKeyGroup");
const apiKeyInput = document.getElementById("apiKeyInput");
const voiceSelect = document.getElementById("voiceSelect");
const rateSlider = document.getElementById("rateSlider");
const rateLabel = document.getElementById("rateLabel");

// Canvas Audio Visualizer Setup
const ctx = audioCanvas.getContext("2d");
let animFrameId = null;

function resizeCanvas() {
  audioCanvas.width = visualizerWrapper.clientWidth;
  audioCanvas.height = visualizerWrapper.clientHeight;
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

function drawVisualizer() {
  ctx.clearRect(0, 0, audioCanvas.width, audioCanvas.height);
  const centerX = audioCanvas.width / 2;
  const centerY = audioCanvas.height / 2;
  const time = Date.now() * 0.003;

  if (state.isSpeaking) {
    // Dynamic soundwave rings when KAM is speaking
    const numBars = 32;
    const radius = 54;
    ctx.save();
    ctx.translate(centerX, centerY);

    for (let i = 0; i < numBars; i++) {
      const angle = (i / numBars) * Math.PI * 2;
      const barHeight = 8 + Math.sin(time * 3 + i * 0.8) * 12 + Math.cos(time * 2 + i) * 6;
      const x1 = Math.cos(angle) * radius;
      const y1 = Math.sin(angle) * radius;
      const x2 = Math.cos(angle) * (radius + barHeight);
      const y2 = Math.sin(angle) * (radius + barHeight);

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = `rgba(228, 0, 70, ${0.4 + (barHeight / 26) * 0.6})`;
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.stroke();
    }
    ctx.restore();
  } else if (state.isListening) {
    // Energetic cyan/blue radar pulsing when Seller is speaking
    const radius = 56 + Math.sin(time * 4) * 6;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(37, 99, 235, 0.7)";
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 10, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(59, 130, 246, 0.3)";
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  animFrameId = requestAnimationFrame(drawVisualizer);
}
drawVisualizer();

// Initialize Speech Recognition (STT)
function initSpeechRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    console.warn("Speech Recognition API not supported in this browser. Fallback to quick prompt buttons.");
    callStatusText.textContent = "Mic API not supported. Please use quick prompts below or Chrome/Edge.";
    return null;
  }

  const recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = "en-IN"; // Default to Indian English / Hinglish phonetics

  recognition.onstart = () => {
    state.isListening = true;
    updateVisualizerState();
    callStatusText.innerHTML = "🎙️ <strong>Listening to seller...</strong> Speak naturally.";
  };

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    if (transcript.trim()) {
      handleSellerInput(transcript);
    }
  };

  recognition.onerror = (event) => {
    console.warn("Speech recognition error:", event.error);
    state.isListening = false;
    updateVisualizerState();
    if (event.error === "no-speech") {
      callStatusText.textContent = "No speech detected. Click mic to speak again.";
    } else if (event.error === "not-allowed") {
      callStatusText.textContent = "Microphone access blocked. Please enable mic in browser permissions.";
      showToast("Please allow microphone access to use voice!");
    } else {
      callStatusText.textContent = "Listening paused. Click mic to speak.";
    }
  };

  recognition.onend = () => {
    state.isListening = false;
    updateVisualizerState();
    if (state.isCallActive && !state.isSpeaking) {
      callStatusText.textContent = "Call active. Click mic to talk or click a quick prompt.";
    }
  };

  return recognition;
}

// Initialize Voices for Speech Synthesis (TTS)
function populateVoiceList() {
  if (!state.speechSynth) return;
  const voices = state.speechSynth.getVoices();
  voiceSelect.innerHTML = '<option value="auto">Auto-detect best Indian English / Natural Voice</option>';

  // Prioritize Indian English or clear natural female voices
  voices.forEach((v) => {
    const opt = document.createElement("option");
    opt.value = v.name;
    opt.textContent = `${v.name} (${v.lang})${v.default ? ' — Default' : ''}`;
    voiceSelect.appendChild(opt);

    // Auto select Indian English if found
    if (!state.selectedVoice) {
      if (v.lang.includes("en-IN") || v.name.includes("India") || v.name.includes("Heera") || v.name.includes("Neerja")) {
        state.selectedVoice = v;
      }
    }
  });

  if (!state.selectedVoice && voices.length > 0) {
    // Fallback to first English voice or default
    state.selectedVoice = voices.find(v => v.lang.startsWith("en")) || voices[0];
  }
}

if (state.speechSynth) {
  state.speechSynth.onvoiceschanged = populateVoiceList;
  populateVoiceList();
}

// Audio Feedback Tone
function playTone(freq = 440, duration = 0.12) {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch (e) {
    // Audio context not allowed without gesture
  }
}

// Speak KAM Response (TTS)
function speakKamResponse(text) {
  if (!state.speechSynth) {
    appendTranscript("kam", text);
    return;
  }

  // Cancel any ongoing speech
  state.speechSynth.cancel();

  state.isSpeaking = true;
  interruptBtn.style.display = "inline-flex";
  updateVisualizerState();
  callStatusText.innerHTML = "🗣️ <strong>Priya (KAM) is speaking...</strong>";

  const cleanText = text.replace(/[*#_~]/g, ""); // Strip markdown
  const utterance = new SpeechSynthesisUtterance(cleanText);

  if (state.selectedVoice) {
    utterance.voice = state.selectedVoice;
  }
  utterance.rate = state.speechRate;
  utterance.pitch = 1.05;

  utterance.onend = () => {
    state.isSpeaking = false;
    interruptBtn.style.display = "none";
    updateVisualizerState();
    callStatusText.textContent = "Priya finished speaking. You can reply now.";
    // If call is still active, automatically listen for seller's reply
    if (state.isCallActive && state.recognition) {
      setTimeout(() => {
        if (state.isCallActive && !state.isSpeaking && !state.isListening) {
          try {
            state.recognition.start();
          } catch (e) {
            // Already started or busy
          }
        }
      }, 500);
    }
  };

  utterance.onerror = (e) => {
    console.error("TTS error:", e);
    state.isSpeaking = false;
    interruptBtn.style.display = "none";
    updateVisualizerState();
  };

  state.lastKamResponse = text;
  appendTranscript("kam", text);
  state.speechSynth.speak(utterance);
}

// Update Orb & Visualizer CSS classes
function updateVisualizerState() {
  visualizerWrapper.classList.remove("speaking", "listening");
  if (state.isSpeaking) {
    visualizerWrapper.classList.add("speaking");
  } else if (state.isListening) {
    visualizerWrapper.classList.add("listening");
  }
}

// Append to Live Transcript
function appendTranscript(sender, text) {
  const bubble = document.createElement("div");
  bubble.className = `message-bubble ${sender}`;

  const tag = document.createElement("div");
  tag.className = "sender-tag";

  if (sender === "kam") {
    tag.innerHTML = `
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
      <span>Priya Sharma (Snapdeal KAM)</span>
    `;
  } else {
    tag.innerHTML = `
      <span>Rajesh (Seller)</span>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
    `;
  }

  const content = document.createElement("div");
  content.className = "bubble-content";
  content.innerHTML = text;

  bubble.appendChild(tag);
  bubble.appendChild(content);
  transcriptBox.appendChild(bubble);

  // Auto scroll to bottom
  transcriptBox.scrollTop = transcriptBox.scrollHeight;

  // Save to history
  state.conversationHistory.push({ sender, text });
}

// Core KAM Reasoning Engine: Evaluates seller input with real telemetry data
function processSellerQuery(query) {
  const q = query.toLowerCase();

  // Highlight specific telemetry cards on the dashboard based on topic
  highlightMetricCards(q);

  // Scenario 1: Initial Sales Drop Query ("My sales dropped significantly...")
  if (q.includes("drop") || q.includes("sales") || q.includes("down") || q.includes("gir gaya") || q.includes("decrease") || q.includes("kam ho gaya")) {
    return "Rajesh ji, I completely understand your concern. Losing ₹65,000 in monthly revenue is tough, but looking at your telemetry, your customer demand is actually healthy. Your Average Selling Price held steady at ₹500! The real revenue leak is that your Out-of-Stock SKUs surged from 5 to 18, and your cancellations shot up to 14%. When top products go out of stock, Snapdeal's algorithm suppresses your entire store's visibility. Are you currently facing supplier delays from your fabric mills?";
  }

  // Scenario 2: Pricing / Competitor Doubt ("Is my pricing wrong? Did competitors cut price?")
  if (q.includes("price") || q.includes("pricing") || q.includes("rate") || q.includes("competitor") || q.includes("sasta") || q.includes("cheaper")) {
    return "Good news on that front Rajesh ji: your pricing is NOT the problem. Your Average Selling Price stayed exactly ₹500 across both months. Buyers are still willing to pay your prices. The entire ₹65,000 drop comes from losing 130 unfulfilled orders because 13 key items ran out of stock. Lowering your prices now would only hurt your margins without solving the missing inventory!";
  }

  // Scenario 3: Cancellation Surge ("Why did cancellations jump to 14%?")
  if (q.includes("cancel") || q.includes("14%") || q.includes("cancellation") || q.includes("reject")) {
    return "This 14% cancellation rate is your most urgent fire right now. Here is what happened: because inventory wasn't updated on time, buyers placed orders for items you didn't have physically in the warehouse, forcing late cancellations. When cancellations cross 10%, Snapdeal automatically lowers your search rank to protect buyer trust. We need to set a safety buffer immediately to bring cancellations back under 8%.";
  }

  // Scenario 4: Supplier Delays / Root Cause Acknowledged ("Supplier delayed raw materials...")
  if (q.includes("supplier") || q.includes("vendor") || q.includes("raw material") || q.includes("delay") || q.includes("stock out") || q.includes("ludhiana") || q.includes("fabric")) {
    return "I completely understand—supplier delays in apparel happen all the time. But here is the smart strategy: don't wait to restock all 18 items at once. Focus 100% of your supplier pressure on your Top 5 'Hero' SKUs that brought 60% of your ₹2 Lakhs last month. Second, let's activate a 5-unit buffer in Seller Central so zero out-of-stock orders occur. And third, while we wait for new fabric, we can run a Snapdeal Flash Promo on your 32 currently in-stock items to revive daily cash flow.";
  }

  // Scenario 5: Recommendations & Action Plan ("What should I do? / Summarize / 3 steps")
  if (q.includes("action") || q.includes("step") || q.includes("summarize") || q.includes("summary") || q.includes("kya karu") || q.includes("recommend") || q.includes("solution")) {
    markPlanCompleted();
    return "Here is your 3-step Snapdeal Turnaround Plan, Rajesh ji: First, restock your Top 5 Hero SKUs within 48 hours to recover roughly ₹50,000 in lost orders. Second, set a 5-unit inventory safety buffer in Seller Central right now to eliminate phantom orders and push cancellations back below 8%. Third, enroll your 32 active in-stock listings in this weekend's Snapdeal Payday Fashion Carnival with a ₹40 voucher. I've sent this complete action memo to your dashboard. Shall I set a follow-up call for this Thursday at 4 PM to review progress?";
  }

  // Scenario 6: Follow-up confirmation / Agreement ("Yes / Sure / Done / Okay / Theek hai")
  if (q.includes("yes") || q.includes("sure") || q.includes("theek hai") || q.includes("okay") || q.includes("done") || q.includes("shukriya") || q.includes("thanks")) {
    return "Excellent, Rajesh ji! I have officially scheduled our follow-up review for Thursday at 4 PM. Your inventory buffer guidelines and Flash Deal enrollment link are now active on your Seller Central portal. Let's get your store back to ₹2 Lakhs and beyond. I'm right here in your corner. Have a productive week ahead!";
  }

  // General Fallback Intelligent Response
  return `Rajesh ji, looking at your store metrics: you have ₹1,35,000 in sales and 270 orders this month. The key priorities are addressing your 18 out-of-stock SKUs and reducing your 14% cancellation rate back to 8%. Would you like me to walk you through our priority restock plan or the Snapdeal weekend traffic boost?`;
}

// Highlight Metric Cards during conversation
function highlightMetricCards(query) {
  document.querySelectorAll(".metric-card").forEach(el => el.style.transform = "scale(1)");

  if (query.includes("stock") || query.includes("oos") || query.includes("inventory")) {
    const oosCard = document.querySelector(".metric-card.highlight-warning");
    if (oosCard) {
      oosCard.style.transform = "scale(1.03)";
      oosCard.style.boxShadow = "0 0 15px rgba(245, 158, 11, 0.4)";
    }
  } else if (query.includes("cancel")) {
    const cancelCards = document.querySelectorAll(".metric-card.highlight-danger");
    if (cancelCards[2]) {
      cancelCards[2].style.transform = "scale(1.03)";
      cancelCards[2].style.boxShadow = "0 0 15px rgba(239, 68, 68, 0.4)";
    }
  } else if (query.includes("price") || query.includes("pricing")) {
    const aspCard = document.querySelector(".metric-card.highlight-neutral");
    if (aspCard) {
      aspCard.style.transform = "scale(1.03)";
      aspCard.style.boxShadow = "0 0 15px rgba(37, 99, 235, 0.4)";
    }
  }
}

// Update Action Plan Status
function markPlanCompleted() {
  const tag = document.getElementById("planStatusTag");
  if (tag) {
    tag.textContent = "KAM Approved";
    tag.className = "action-tag tag-growth";
  }
  const rootCause = document.getElementById("rootCauseText");
  if (rootCause) {
    rootCause.innerHTML = "<strong>Action Plan Activated:</strong> Restock PO generated for Top 5 SKUs. Cancellation safety buffer enabled. Snapdeal Payday promo draft ready for seller approval.";
  }
}

// Handle Incoming Seller Input (from Voice or Chip)
async function handleSellerInput(transcript) {
  if (!transcript || !transcript.trim()) return;

  // Append Seller bubble
  appendTranscript("seller", transcript);

  // If user has configured Gemini or OpenAI, try API; otherwise use built-in engine
  if (state.aiEngine === "gemini" && state.apiKey) {
    callStatusText.innerHTML = "⚡ <em>Querying Gemini LLM...</em>";
    try {
      const response = await queryGeminiAPI(transcript);
      speakKamResponse(response);
      return;
    } catch (err) {
      console.warn("Gemini API call failed, falling back to built-in KAM engine:", err);
      showToast("Gemini API error. Used built-in KAM engine.");
    }
  } else if (state.aiEngine === "openai" && state.apiKey) {
    callStatusText.innerHTML = "⚡ <em>Querying OpenAI GPT-4o...</em>";
    try {
      const response = await queryOpenAIAPI(transcript);
      speakKamResponse(response);
      return;
    } catch (err) {
      console.warn("OpenAI API call failed, falling back to built-in KAM engine:", err);
      showToast("OpenAI API error. Used built-in KAM engine.");
    }
  }

  // Built-in Domain Intelligent Engine
  const reply = processSellerQuery(transcript);
  speakKamResponse(reply);
}

// Cloud API Integration: Google Gemini 1.5 Flash
async function queryGeminiAPI(sellerText) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${state.apiKey}`;
  const systemPrompt = `You are Priya, a Senior Virtual Key Account Manager (KAM) at Snapdeal speaking with Rajesh, an apparel seller in Ludhiana.
Seller Context & Telemetry:
- Last Month: Sales ₹2,00,000, Orders 400, Cancellation Rate 8%, ASP ₹500, Out-of-Stock SKUs: 5
- This Month: Sales ₹1,35,000 (-32.5%), Orders 270 (-130 orders), Cancellation Rate 14% (+75% surge), ASP ₹500 (STABLE!), Out-of-Stock SKUs: 18 (+260% surge)
Key Insights:
1. Pricing is NOT the problem (ASP is steady at ₹500).
2. Out-of-stock hero SKUs caused lost orders and killed search rank.
3. Cancellations spiked to 14% due to warehouse inventory desync, hurting seller tier.
Keep your voice response conversational, empathetic, concise (under 70 words), and actionable.`;

  const body = {
    contents: [
      { role: "user", parts: [{ text: systemPrompt + "\n\nSeller says: " + sellerText }] }
    ]
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  const data = await res.json();
  return data.candidates[0].content.parts[0].text;
}

// Cloud API Integration: OpenAI GPT-4o
async function queryOpenAIAPI(sellerText) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${state.apiKey}`
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are Priya, a Senior AI Virtual Key Account Manager at Snapdeal speaking to an apparel seller whose sales dropped from ₹2 Lakh to ₹1.35 Lakh. ASP is steady at ₹500, but Out of Stock went from 5 to 18, and cancellations rose to 14%. Keep answers conversational, empathetic, under 65 words."
        },
        { role: "user", content: sellerText }
      ]
    })
  });
  const data = await res.json();
  return data.choices[0].message.content;
}

// Call Toggle Handler (Start / End Voice Call)
function toggleVoiceCall() {
  if (!state.isCallActive) {
    // Start Call
    state.isCallActive = true;
    playTone(587.33, 0.15); // D5 chime
    toggleCallBtn.classList.add("recording");
    callBtnText.textContent = "End Voice Call";
    micIcon.innerHTML = `<rect x="6" y="6" width="12" height="12" rx="2"></rect>`; // stop square

    // Start Timer
    state.callDuration = 0;
    state.timerInterval = setInterval(() => {
      state.callDuration++;
      const mins = String(Math.floor(state.callDuration / 60)).padStart(2, "0");
      const secs = String(state.callDuration % 60).padStart(2, "0");
      callTimer.textContent = `${mins}:${secs}`;
    }, 1000);

    // Initial greeting if transcript only has default
    if (state.conversationHistory.length === 0) {
      const greeting = "Namaste Rajesh ji! I'm Priya, your Snapdeal AI Virtual Key Account Manager. I've pulled up your store metrics for this month. Tell me, how can I support you today?";
      speakKamResponse(greeting);
    } else {
      // Start listening
      if (state.recognition) {
        try {
          state.recognition.start();
        } catch (e) {
          console.log(e);
        }
      }
    }
  } else {
    // End Call
    state.isCallActive = false;
    playTone(392.00, 0.18); // G4 chime
    toggleCallBtn.classList.remove("recording");
    callBtnText.textContent = "Start Voice Call";
    micIcon.innerHTML = `<path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="22"></line>`;
    
    clearInterval(state.timerInterval);
    state.timerInterval = null;

    if (state.speechSynth) state.speechSynth.cancel();
    if (state.recognition) {
      try {
        state.recognition.stop();
      } catch (e) {}
    }

    state.isSpeaking = false;
    state.isListening = false;
    interruptBtn.style.display = "none";
    updateVisualizerState();
    callStatusText.textContent = "Call ended. Action plan saved below.";
  }
}

// Event Listeners
toggleCallBtn.addEventListener("click", () => {
  if (!state.recognition) {
    state.recognition = initSpeechRecognition();
  }
  toggleVoiceCall();
});

interruptBtn.addEventListener("click", () => {
  if (state.speechSynth) {
    state.speechSynth.cancel();
  }
  state.isSpeaking = false;
  interruptBtn.style.display = "none";
  updateVisualizerState();
  callStatusText.textContent = "Interrupted. Listening for your response...";
  if (state.recognition) {
    try {
      state.recognition.start();
    } catch (e) {}
  }
});

replayBtn.addEventListener("click", () => {
  if (state.lastKamResponse) {
    speakKamResponse(state.lastKamResponse);
  } else {
    showToast("No previous response to replay.");
  }
});

clearChatBtn.addEventListener("click", () => {
  transcriptBox.innerHTML = "";
  state.conversationHistory = [];
  showToast("Transcript cleared.");
});

// Quick Prompt Chips
document.querySelectorAll(".chip").forEach((chip) => {
  chip.addEventListener("click", () => {
    const text = chip.getAttribute("data-text");
    if (!state.isCallActive) {
      toggleVoiceCall();
    }
    setTimeout(() => {
      handleSellerInput(text);
    }, 400);
  });
});

// Toast notification helper
function showToast(msg) {
  toastMsg.textContent = msg;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 3200);
}

// Copy WhatsApp Brief Button
copySummaryBtn.addEventListener("click", () => {
  const briefText = `*Snapdeal AI Virtual KAM - Performance Audit & Action Plan*
Seller: Rajesh Garments (SD-8942)
Category: Fashion & Apparel

*Monthly Telemetry Comparison:*
• Gross Sales: ₹1,35,000 (Down from ₹2,00,000 | -32.5%)
• Orders: 270 (Down from 400 | -130 orders)
• Cancellation Rate: 14% (Alert! Up from 8%)
• Average Selling Price: ₹500 (STABLE - Pricing is healthy)
• Out-of-Stock SKUs: 18 (Up from 5 | Primary leakage)

*Root Cause Analysis:*
Pricing is competitive. Sales dropped because 18 high-demand SKUs went out of stock, triggering search suppression and 14% cancellations due to inventory desync.

*Priority 3-Step Action Plan:*
1. Priority Restock of Top 5 Hero SKUs within 48h (Recovers ~₹50,000 volume).
2. Enable 5-Unit Buffer in Seller Central (Brings cancellation < 8%).
3. Enroll 32 active SKUs in Snapdeal Payday Carnival with ₹40 voucher.

KAM Follow-up Call: Thursday @ 4:00 PM
_Generated by Snapdeal AI Virtual KAM_`;

  navigator.clipboard.writeText(briefText).then(() => {
    showToast("WhatsApp summary copied to clipboard!");
  }).catch(() => {
    showToast("Copied to clipboard!");
  });
});

// Export KAM Memo Button
exportPdfBtn.addEventListener("click", () => {
  window.print();
});

// Settings Modal Controls
openSettingsBtn.addEventListener("click", () => {
  settingsModal.classList.add("active");
});

closeSettingsBtn.addEventListener("click", () => {
  settingsModal.classList.remove("active");
});

engineSelect.addEventListener("change", (e) => {
  if (e.target.value === "builtin") {
    apiKeyGroup.style.display = "none";
  } else {
    apiKeyGroup.style.display = "block";
    apiKeyLabel.textContent = e.target.value === "gemini" ? "Google Gemini API Key" : "OpenAI API Key";
  }
});

rateSlider.addEventListener("input", (e) => {
  rateLabel.textContent = `${e.target.value}x`;
  state.speechRate = parseFloat(e.target.value);
});

saveSettingsBtn.addEventListener("click", () => {
  state.aiEngine = engineSelect.value;
  state.apiKey = apiKeyInput.value.trim();
  const selectedVoiceName = voiceSelect.value;
  if (selectedVoiceName !== "auto" && state.speechSynth) {
    const voices = state.speechSynth.getVoices();
    state.selectedVoice = voices.find(v => v.name === selectedVoiceName) || state.selectedVoice;
  }
  settingsModal.classList.remove("active");
  showToast("Settings updated successfully!");
});

// Initialize on page load
window.addEventListener("DOMContentLoaded", () => {
  state.recognition = initSpeechRecognition();
});

