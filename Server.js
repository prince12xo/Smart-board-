import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();
const app = express();
app.use(express.json());
app.use(express.static('Public')); 

app.post('/ask', async (req, res) => {
  try {
    // Safely pull the key inside the route execution
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error("API key is missing from server environment settings.");
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
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

    const result = await model.generateContent(pipelinePrompt);
    let outputText = result.response.text().trim();

    if (outputText.startsWith("```json")) {
        outputText = outputText.substring(7, outputText.length - 3).trim();
    } else if (outputText.startsWith("```")) {
        outputText = outputText.substring(3, outputText.length - 3).trim();
    }

    const payload = JSON.parse(outputText);
    res.json(payload);

  } catch (error) {
    console.error("Gemini Route Error:", error.message);
    res.json({
        metaSubject: "System Log",
        htmlCard: `
            <div class="pro-card" style="border-left-color: #da3637;">
                <span class="tag tag-sys" style="background: #da3637; color: #fff;">Stream Process Error</span>
                <h2>Data Processing Failure</h2>
                <div class="def-box">
                    <strong>Error Details:</strong> ${error.message || "Unable to process voice packet structures or parse Gemini AI output."}
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Brain is running at http://localhost:${PORT}`));
