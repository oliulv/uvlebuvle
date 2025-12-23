import { NextResponse } from 'next/server';

interface CardInfo {
  position: number;
  imageId: string;
  matched: boolean;
  faceUp: boolean;
}

interface RequestBody {
  cards: CardInfo[];
  aiMemory: Record<string, number[]>;
  difficulty: 'easy' | 'medium' | 'hard';
  humanMatches: number;
  aiMatches: number;
}

interface AIDecision {
  first: number;
  second: number;
  reasoning: string;
}

function buildPrompt(body: RequestBody): string {
  const { cards, aiMemory, humanMatches, aiMatches } = body;

  // Get unmatched card positions
  const unmatchedPositions = cards
    .filter(c => !c.matched)
    .map(c => c.position);

  // Build memory section
  let memorySection = '';
  const knownPairs: [number, number][] = [];

  for (const [imageId, positions] of Object.entries(aiMemory)) {
    if (positions.length >= 2) {
      // We know both cards of this pair!
      knownPairs.push([positions[0], positions[1]]);
      memorySection += `- Image "${imageId}": positions [${positions.join(', ')}] <- PAIR KNOWN!\n`;
    } else if (positions.length === 1) {
      memorySection += `- Image "${imageId}": position [${positions[0]}] (only one seen)\n`;
    }
  }

  if (!memorySection) {
    memorySection = '(No cards memorized yet)\n';
  }

  // Matched positions
  const matchedPositions = cards
    .filter(c => c.matched)
    .map(c => c.position);

  return `You are Gemini, an AI playing a Memory card matching game against a human player.

GAME STATE:
- Total cards: 24 (12 pairs)
- Your matches: ${aiMatches}
- Opponent matches: ${humanMatches}
- Cards remaining: ${unmatchedPositions.length}

MATCHED POSITIONS (ignore these): [${matchedPositions.join(', ')}]

YOUR MEMORY (cards you've seen):
${memorySection}
AVAILABLE POSITIONS (unmatched, face-down): [${unmatchedPositions.join(', ')}]

STRATEGY:
1. If you know a complete pair (both cards), flip those two positions!
2. If you only know one card of a pair, flip that card and guess for its match
3. If you know nothing, pick two random positions to explore

${knownPairs.length > 0 ? `\n>>> YOU KNOW ${knownPairs.length} COMPLETE PAIR(S)! USE THEM! <<<\n` : ''}

Pick two card positions to flip. Positions must be from the AVAILABLE POSITIONS list.

Respond with ONLY a JSON object in this exact format (no markdown, no explanation outside JSON):
{"first": <position1>, "second": <position2>, "reasoning": "brief explanation"}

Your decision:`;
}

function parseAIResponse(content: string, availablePositions: number[]): AIDecision {
  try {
    // Remove markdown code blocks if present
    let cleanContent = content
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/g, '')
      .trim();

    // Try to extract JSON from the response
    const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);

      let first = parsed.first;
      let second = parsed.second;

      // Validate positions
      if (!availablePositions.includes(first) || !availablePositions.includes(second) || first === second) {
        console.warn(`[Memory AI] Invalid positions returned: ${first}, ${second}. Using fallback.`);
        // Fallback to random valid positions
        const shuffled = [...availablePositions].sort(() => Math.random() - 0.5);
        first = shuffled[0];
        second = shuffled[1];
      }

      return {
        first,
        second,
        reasoning: parsed.reasoning || 'No reasoning provided',
      };
    }
  } catch (e) {
    console.error('[Memory AI] Failed to parse response:', e, 'Content:', content.substring(0, 200));
  }

  // Fallback to random positions
  const shuffled = [...availablePositions].sort(() => Math.random() - 0.5);
  return {
    first: shuffled[0],
    second: shuffled[1],
    reasoning: 'Fallback decision - could not parse AI response',
  };
}

export async function POST(request: Request) {
  try {
    const body: RequestBody = await request.json();
    const { cards, aiMemory, difficulty } = body;

    // Get unmatched positions
    const unmatchedPositions = cards
      .filter(c => !c.matched)
      .map(c => c.position);

    if (unmatchedPositions.length < 2) {
      return NextResponse.json({
        first: 0,
        second: 1,
        reasoning: 'No valid moves available',
      });
    }

    // Check if we know any complete pairs - if so, use them directly without API call
    const knownPairs: [number, number][] = [];
    for (const [imageId, positions] of Object.entries(aiMemory)) {
      // Filter to only include unmatched positions
      const validPositions = positions.filter(p => unmatchedPositions.includes(p));
      if (validPositions.length >= 2) {
        knownPairs.push([validPositions[0], validPositions[1]]);
      }
    }

    // If we know pairs, just use them (no need for AI)
    if (knownPairs.length > 0) {
      const [first, second] = knownPairs[0];
      return NextResponse.json({
        first,
        second,
        reasoning: `I remember seeing both of these cards! They match.`,
      });
    }

    // Check for partial knowledge - we know one card, guess for its match
    const partialKnowledge: { position: number; imageId: string }[] = [];
    for (const [imageId, positions] of Object.entries(aiMemory)) {
      const validPositions = positions.filter(p => unmatchedPositions.includes(p));
      if (validPositions.length === 1) {
        partialKnowledge.push({ position: validPositions[0], imageId });
      }
    }

    // If we have partial knowledge, use it
    if (partialKnowledge.length > 0) {
      const known = partialKnowledge[0];
      const otherPositions = unmatchedPositions.filter(p => p !== known.position);
      const randomOther = otherPositions[Math.floor(Math.random() * otherPositions.length)];

      return NextResponse.json({
        first: known.position,
        second: randomOther,
        reasoning: `I remember one card, trying to find its match.`,
      });
    }

    // No memory - try AI for strategic selection, or just pick randomly
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      // No API key - just pick randomly
      const shuffled = [...unmatchedPositions].sort(() => Math.random() - 0.5);
      return NextResponse.json({
        first: shuffled[0],
        second: shuffled[1],
        reasoning: 'Exploring new cards',
      });
    }

    // Use Gemini to make a decision
    const prompt = buildPrompt(body);

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://family-games.local',
        'X-Title': 'Family Games - Memory AI',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash-001',
        messages: [
          {
            role: 'system',
            content: `You are Gemini, playing a Memory card matching game. You need to find pairs of matching cards.
Use your memory of previously seen cards strategically.
If you know where both cards of a pair are, pick them!
Respond ONLY with a valid JSON object, no other text.`,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 200,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[Memory AI] API error:', error);
      // Fallback to random
      const shuffled = [...unmatchedPositions].sort(() => Math.random() - 0.5);
      return NextResponse.json({
        first: shuffled[0],
        second: shuffled[1],
        reasoning: 'Exploring new cards (API error fallback)',
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    console.log('[Memory AI] Raw response:', content.substring(0, 200));

    const decision = parseAIResponse(content, unmatchedPositions);

    console.log('[Memory AI] Decision:', decision);

    return NextResponse.json(decision);
  } catch (error) {
    console.error('[Memory AI] Error:', error);
    return NextResponse.json({
      first: 0,
      second: 1,
      reasoning: 'Error occurred',
    });
  }
}
