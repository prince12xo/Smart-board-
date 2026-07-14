import express from 'express';
import Groq from 'groq-sdk';
import dotenv from 'dotenv';

dotenv.config();
const app = express();
app.use(express.json());
app.use(express.static('Public')); 

app.post('/ask', async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error("API key is missing from server environment settings.");
    }

    // Switched engine to use Groq securely using your target variable hook
    const groq = new Groq({ apiKey: apiKey });
    const rawSpeechInput = req.body.prompt;

    const pipelinePrompt = `
      You are an elite Educational Smartboard OS kernel. You process live classroom lecture transcripts (provided in mixed Hinglish, Hindi phrases, or English) and convert them into beautiful, highly advanced academic cards.

      Analyze this raw verbal stream input: "${rawSpeechInput}"

      Determine the core subject domain. Choose exactly ONE category tag configuration below that fits best:
      1. Physics -> tagClass: "tag-phys", tagText: "Physics Dynamics"
      2. Chemistry -> tagClass: "tag-chem", tagText: "Chemistry Core"
      3. Mathematics -> tagClass: "tag-math", tagText: "Advanced Mathematics"
      4. Other -> tagClass: "tag-sys", tagText: "Academic Analysis"

      Generate a raw JSON block containing exactly two fields: "metaSubject" and "htmlCard".
      Do not include any markdown backticks (\`\`\`json) or extra text formatting outside the raw JSON object structure.

      The "metaSubject" field must be a short string naming the topic (e.g. "Kinematics", "GOC", "Thermodynamics").

      The "htmlCard" field must contain a single string of fully formatted HTML code matching this structural design verbatim. You are strictly FORBIDDEN from omitting the Examples or Questions sections:

      <div class="pro-card">
          <span class="tag [INSERT_TAG_CLASS_HERE]">[INSERT_TAG_TEXT_HERE]</span>
          <h2 contenteditable="true" onblur="saveCurrentState()">🎯 [Insert Bold Academic Topic Title]</h2>

          <div class="def-box" contenteditable="true" onblur="saveCurrentState()">
              <strong>[Core Definition Target Term]:</strong> [Provide an incredibly precise, rigorous academic definition or foundational premise that cuts through verbal filler. Include standard mathematical units or chemical notations if discussed.]
          </div>

          <div style="margin: 15px 0 5px 0; color: #38bdf8; font-weight: bold; font-size: 0.95rem; text-transform: uppercase; letter-spacing: 0.5px;">💡 Real-World Classroom Examples:</div>
          <ul class="bullet-list" style="margin-bottom: 15px;">
              <li contenteditable="true" onblur="saveCurrentState()"><strong>Practical Case 1:</strong> [Provide a highly relatable, practical real-world or industry application explaining the concept deeply so a student never forgets it.]</li>
              <li contenteditable="true" onblur="saveCurrentState()"><strong>Visual Analogy 2:</strong> [Provide a second practical example or physics/chemistry analogy showing how this concept works in everyday life.]</li>
          </ul>

          <div style="margin: 15px 0 5px 0; color: #fbbf24; font-weight: bold; font-size: 0.95rem; text-transform: uppercase; letter-spacing: 0.5px;">❓ Competitive Exam Practice Questions:</div>
          <ul class="bullet-list">
              <li contenteditable="true" onblur="saveCurrentState()"><strong>Q1 (Conceptual):</strong> [Create a high-quality conceptual question matching Boards/JEE/NEET difficulty levels to test deep understanding.]</li>
              <li contenteditable="true" onblur="saveCurrentState()"><strong>Q2 (Numerical/Application):</strong> [Create a practical numerical or scenario-based problem requiring logic calculation based entirely on the lecture.]</li>
          </ul>
      </div>
    `;

    // Calling the lightning-fast alternative production model
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: "user", content: pipelinePrompt }],
      model: "llama-3.3-70b-versatile",
      response_format: { type: "json_object" } // Enforces beautiful perfect structural parsing arrays
    });

    let outputText = chatCompletion.choices[0].message.content.trim();

    if (outputText.startsWith("```json")) {
        outputText = outputText.substring(7, outputText.length - 3).trim();
    } else if (outputText.startsWith("```")) {
        outputText = outputText.substring(3, outputText.length - 3).trim();
    }

    const payload = JSON.parse(outputText);
    res.json(payload);

  } catch (error) {
    console.error("Groq Prompt Processing Failure:", error.message);
    res.json({
        metaSubject: "System Log",
        htmlCard: `
            <div class="pro-card" style="border-left-color: #da3637;">
                <span class="tag tag-sys" style="background: #da3637; color: #fff;">Stream Process Error</span>
                <h2>Data Processing Failure</h2>
                <div class="def-box">
                    <strong>Error Details:</strong> ${error.message || "Unable to process voice packet structures or parse Engine output."}
                </div>
                <ul class="bullet-list">
                    <li>Ensure your local API variables are fully refreshed.</li>
                    <li>Toggle your network configurations or check your prompt structure.</li>
                </ul>
            </div>
        `
    });
  }
});

// DYNAMIC WEIGHTAGE GENERATOR ROUTE
app.post('/weightage', async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error("API key is missing from server environment settings.");
    }

    const groq = new Groq({ apiKey: apiKey });
    const activeSubject = req.body.subject || "General Academic Study";

    const weightagePrompt = `
      You are an expert Indian academic advisor. Provide the typical exam weightage details for the topic: "${activeSubject}".
      Provide highly accurate weightage analysis specifically for:
      1. Class 12 CBSE/State Boards (e.g. typical marks)
      2. JEE Main (e.g. typical number of questions or importance)
      3. NEET UG (e.g. typical number of questions, or "N/A" if it is a pure math topic)

      Generate a raw JSON block containing exactly three fields: "boards", "jee", and "neet".
      Keep each field extremely concise (max 3-4 words, like "6-8 Marks", "2 Questions", "3-4 Qs (High)").
      Do not include any markdown backticks (\`\`\`json) or extra text formatting outside the raw JSON object structure.
    `;

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: "user", content: weightagePrompt }],
      model: "llama-3.3-70b-versatile",
      response_format: { type: "json_object" }
    });

    let outputText = chatCompletion.choices[0].message.content.trim();

    if (outputText.startsWith("```json")) {
        outputText = outputText.substring(7, outputText.length - 3).trim();
    } else if (outputText.startsWith("```")) {
        outputText = outputText.substring(3, outputText.length - 3).trim();
    }

    const payload = JSON.parse(outputText);
    res.json(payload);

  } catch (error) {
    console.error("Weightage Generation Failure:", error.message);
    res.json({
        boards: "N/A",
        jee: "Error",
        neet: "Error"
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Brain is running at http://localhost:${PORT}`));
      
