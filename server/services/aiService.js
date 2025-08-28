const OpenAI = require('openai');
const ElevenLabs = require('elevenlabs');

class AIService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    
    this.elevenLabs = new ElevenLabs({
      apiKey: process.env.ELEVENLABS_API_KEY
    });
  }

  // ChatGPT API for conversation and scoring
  async generateResponse(messages, systemPrompt, maxTokens = 150) {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
        max_tokens: maxTokens,
        temperature: 0.7,
        stream: false
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error('ChatGPT API error:', error);
      throw new Error('Failed to generate AI response');
    }
  }

  // ElevenLabs TTS
  async textToSpeech(text, voiceId = null) {
    try {
      const voice = voiceId || process.env.ELEVENLABS_VOICE_ID;
      const stability = parseFloat(process.env.ELEVENLABS_STABILITY) || 0.5;
      const similarityBoost = parseFloat(process.env.ELEVENLABS_SIMILARITY_BOOST) || 0.75;

      const audioBuffer = await this.elevenLabs.textToSpeech({
        text,
        voice,
        model: 'eleven_monolingual_v1',
        voice_settings: {
          stability,
          similarity_boost: similarityBoost
        }
      });

      return audioBuffer;
    } catch (error) {
      console.error('ElevenLabs TTS error:', error);
      throw new Error('Failed to generate speech');
    }
  }

  // OpenAI Whisper ASR
  async speechToText(audioBuffer, language = 'en') {
    try {
      const transcript = await this.openai.audio.transcriptions.create({
        file: audioBuffer,
        model: 'whisper-1',
        language,
        response_format: 'verbose_json',
        timestamp_granularities: ['word']
      });

      return {
        text: transcript.text,
        language: transcript.language,
        duration: transcript.duration,
        segments: transcript.segments || [],
        wordTimings: transcript.words || []
      };
    } catch (error) {
      console.error('Whisper ASR error:', error);
      throw new Error('Failed to transcribe audio');
    }
  }

  // Assessment scoring using ChatGPT
  async scoreAssessment(transcript, metadata, rubric) {
    try {
      const scoringPrompt = `
You are a certified English assessor. Evaluate the following response based on the rubric:

TRANSCRIPT: ${transcript}

METADATA: ${JSON.stringify(metadata)}

RUBRIC:
- Fluency (0-5): continuity, pace, pauses, fillers
- Pronunciation (0-5): intelligibility, phoneme accuracy, stress  
- Grammar (0-5): verb tenses, agreement, sentence variety
- Vocabulary (0-5): range, appropriacy, collocations
- Comprehension (0-5): relevance, accuracy, listening skills
- Task Completion (0-5): coverage of required elements

Provide scores as JSON:
{
  "scores": {
    "fluency": number,
    "pronunciation": number,
    "grammar": number,
    "vocabulary": number,
    "comprehension": number,
    "task_completion": number
  },
  "rationale": "brief explanation (max 200 chars)",
  "confidence": 0.0-1.0
}`;

      const response = await this.generateResponse(
        [{ role: 'user', content: scoringPrompt }],
        'You are a certified English assessor. Respond only with valid JSON.',
        500
      );

      try {
        return JSON.parse(response);
      } catch (parseError) {
        console.error('Failed to parse scoring response:', response);
        throw new Error('Invalid scoring response format');
      }
    } catch (error) {
      console.error('Assessment scoring error:', error);
      throw new Error('Failed to score assessment');
    }
  }

  // Generate conversation prompts
  async generatePrompt(phase, context = {}) {
    const prompts = {
      warmup: "Tell me your first name and where you're calling from.",
      interview_q1: "What do you usually do on a typical workday? Mention two tasks.",
      interview_q2: "Do you prefer working from home or office? Why?",
      task_picture: "Describe what you see in this office scene and what might be happening.",
      task_roleplay: "You're calling a customer to reschedule a meeting. Explain the reason, propose two new times, and confirm next steps.",
      listening: "What did the speaker promise to send and why?",
      wrap: "Thank you for completing the assessment. Your results will be available shortly."
    };

    const basePrompt = prompts[phase] || "Please continue with your response.";
    
    // Add context-specific modifications
    if (context.followup) {
      return `Follow-up: ${context.followup}`;
    }
    
    if (context.interruption) {
      return `Sorry—one sec… please continue with your previous answer.`;
    }

    return basePrompt;
  }
}

module.exports = new AIService();
