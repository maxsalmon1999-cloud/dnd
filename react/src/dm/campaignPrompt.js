// Prompt used to extract structured campaign data from an uploaded PDF.
// Ported from the original processCampaignPdf(). The document text is appended.
export const CAMPAIGN_EXTRACTION_PROMPT = `You are extracting structured campaign data from a D&D adventure document.
Given this campaign text, produce a JSON object with this exact structure:
{
  "meta": {
    "name": "The campaign/adventure name",
    "setting": "2-3 sentence world/setting description for AI context",
    "plotSummary": "~200 word summary of the campaign arc and key events"
  },
  "promptTemplates": {
    "description": "Instructions for vivid narrative-only mode (2-4 paragraphs, sensory details, no mechanics)",
    "action": "Instructions for mechanical resolution mode (1-3 paragraphs, hit/miss/damage)",
    "both": "Instructions for combined narrative + mechanics mode (3-5 paragraphs)",
    "sessionEnd": "Instructions for generating an official session summary record"
  },
  "npcs": {
    "npc_key": {
      "name": "Full NPC Name",
      "role": "innkeeper / villain / quest giver etc",
      "description": "Physical appearance in 1-2 sentences",
      "personality": "How they speak and behave in 1-2 sentences",
      "notes": "Secrets, motivations, relationships"
    }
  },
  "locations": {
    "location_key": {
      "name": "Location Name",
      "description": "Atmosphere and key features in 2-3 sentences",
      "connections": ["other_location_key"]
    }
  },
  "encounters": {
    "encounter_key": {
      "name": "Encounter Name",
      "trigger": "What causes this encounter",
      "enemies": ["Enemy Type 1", "Enemy Type 2"]
    }
  },
  "enemyStats": {
    "Enemy Type 1": {
      "ac": 15, "hp": 7, "proficiency": 2,
      "mods": {"STR": -1, "DEX": 2, "CON": 0, "INT": 0, "WIS": -1, "CHA": -1}
    }
  }
}

Respond with ONLY the JSON, no markdown fences or extra text.

Campaign document:
`
