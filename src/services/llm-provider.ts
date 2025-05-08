/**
 * Service for interacting with OpenAI's LLM API
 */

import OpenAI from 'openai';  
const Ajv = require("ajv")
import type { JSONSchemaType } from "ajv"
import type { ChatCompletionMessageParam } from 'openai/resources';
import type { Tutorial } from '@/store/atoms';


// Initialize the OpenAI client
const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY || 'your_api_key_here',
  dangerouslyAllowBrowser: true // In production, API calls should go through your backend
});



/* ────────────────────────────────────────────────────────────
   2.  JSON Schema  ➜  reused for tools + AJV validation
──────────────────────────────────────────────────────────── */
const tutorialSchema: JSONSchemaType<Tutorial> = {
  type: "object",
  properties: {
    description: { type: "string" },
    sprites: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          image_path: { type: "string" },
          code_snippets: { type: "array", items: { type: "string" } }
        },
        required: ["name", "image_path", "code_snippets"],
        additionalProperties: false
      }
    },
    steps: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title:       { type: "string" },
          target:      { 
            type: "object", 
            properties: {
              targetType: { type: "string" },
              targetName: { type: "string" }
            },
            required: ["targetType", "targetName"]
          },
          code:        { type: "string" },
          explanation: { type: "string" }
        },
        required: ["title", "code", "explanation"],
        additionalProperties: false
      }
    },
    extensions: {
      type: "array",
      items: { type: "string" },
      nullable: true
    }
  },
  required: ["description", "steps"],
  additionalProperties: false
};

const ajv = new Ajv({ allErrors: true });
const validateTutorial = ajv.compile(tutorialSchema);

/* ────────────────────────────────────────────────────────────
   3.  Shared prompt builder
──────────────────────────────────────────────────────────── */
const scratchblocksSyntaxString = `
Here is the scratchblocks syntax based on the provided sources:

Syntax: block name
Use: a block
Example: erase all
Result: erase all

Syntax: end
Use: stops a C block (only necessary if more blocks come after the C block)
Example: repeat (5) move (10) steps end say [Done!]
Result: repeat (5) move (10) steps end say [Done!]

Syntax: [text]
Use: a text input
Example: say [Hello World!]
Result: say [Hello World!]

Syntax: (var)
Use: a variable or reporter block
Example: (x position)
Result: (x position)

Syntax: (12.34)
Use: a number input
Example: wait (0.5) seconds
Result: wait (0.5) seconds

Syntax: (item v)
Use: an insertable dropdown input
Example: broadcast (You Win v)
Result: broadcast (You Win v)

Syntax: [item v]
Use: an uninsertable dropdown input
Example: set [my variable v] to (0)
Result: set [my variable v] to (0)

Syntax: <bool>
Use: a boolean block
Example: <mouse down?>
Result: <mouse down?>

Syntax: [#ABCDEF]
Use: a color input
Example: <touching color [#0000FF]?>
Result: <touching color [#0000FF]?>

Syntax: define
Use: a custom block hat
Example: define jump (height)
Result: define jump (height)

Syntax: // comment
Use: a comment
Example: show // now you see me
Result: show // now you see me

Syntax: ...
Use: a placeholder block denoting an arbitrary script
Example: if <(var) = [this]> then ... end
Result: if <(var) = [this]> then ... end

Syntax: <scratchblocks>...</scratchblocks>
Use: used on the Scratch Wiki to insert block code

Syntax: [scratchblocks]...[/scratchblocks]
Use: used on the Scratch Forums to insert block code

Syntax: <sb>...</sb>
Use: used on the Scratch Wiki for a single block inserted inline to avoid breaking lines

Syntax: (10)
Use: represents a round numerical insert
Example: move (10) steps
Result: move (10) steps

Syntax: [lorem ipsum]
Use: creates string inputs
Example: say [Hi]
Result: say [Hi]
Example: think [bye]
Result: think [bye]

Syntax: <boolean>
Use: creates boolean blocks
Example: if <<mouse down?> and <(costume [number v]) =>> then stamp end
Result: if <<mouse down?> and <(costume [number v]) =>> then stamp end

Syntax: (reporter)
Use: creates reporter blocks
Example: if <<mouse down?> and <(costume [number v]) =>> then stamp end (shows alongside boolean example)
Result: if <<mouse down?> and <(costume [number v]) =>> then stamp end

Syntax: [#1540bf] or [#0f0] (hexadecimal code inside string input)
Use: creates color inputs
Example: set pen color to [#1540bf]
Result: set pen color to [#1540bf]
Example: set pen color to [#0f0]
Result: set pen color to [#0f0]

Syntax: [selection v]
Use: creates dropdown lists (uninsertable)
Example: stop [all v]
Result: stop [all v]

Syntax: (selection v)
Use: creates round dropdowns (insertable)
Example: broadcast (start v)
Result: broadcast (start v)

Syntax: when green flag clicked, when gf clicked, when flag clicked
Use: syntax options for the When Green Flag Clicked hat block
Example: when gf clicked
Result: when gf clicked

Syntax: when this sprite clicked
Use: syntax for the When () Clicked block (sprite name inside brackets is no longer necessary)
Example: when this sprite clicked
Result: when this sprite clicked

Syntax: turn cw (), turn right ()
Use: syntax options for the Turn () Degrees (clockwise) block
Example: turn cw () degrees
Result: turn cw () degrees

Syntax: turn ccw (), turn left ()
Use: syntax options for the Turn () Degrees (counter-clockwise) block
Example: turn ccw () degrees
Result: turn ccw () degrees

Syntax: end (after last stack block in a C block)
Use: closes C blocks (not necessary if the C block is the last part of a script)

Syntax: // comment
Use: creates comments after a block
Example: move (10) steps // is that too far?
Result: move (10) steps // is that too far?

Syntax: define jump repeat (10) change y by (4) end
Use: creates a definition for a custom block
Example: define jump repeat (10) change y by (4) end
Result: define jump repeat (10) change y by (4) end

Syntax: define jump (height) <gravity on?> [message]
Use: adds number, boolean, and string arguments to a custom block definition
Example: define jump (height) <gravity on?> [message]
Result: define jump (height) <gravity on?> [message]

Syntax: say (height) (below a block definition using 'height')
Use: renders an input reporter for a custom block argument
Example: define jump (height) say (input) (source uses 'input', but result shows 'height')
Result: say (height)

Syntax: add [mres] to [list of Scratch team members v] ... say (list of Scratch team members) (using a list in a list block in the same tag)
Use: renders a list reporter correctly
Example: add [mres] to [list of Scratch team members v] add [paddle2see] to [list of Scratch team members v] add [harakou] to [list of Scratch team members v] say (list of Scratch team members)
Result: add [mres] to [list of Scratch team members v] add [paddle2see] to [list of Scratch team members v] add [harakou] to [list of Scratch team members v] say (list of Scratch team members)

Syntax: say (list of Scratch team members:: list)
Use: forces a reporter to render as a list reporter
Example: say (list of Scratch team members:: list)
Result: say (list of Scratch team members:: list)

Syntax: abc:: looks
Use: changing category (works for any kind of block)
Example: abc:: looks say [I'm not a Motion block!]:: motion eat (pen color:: pen):: control if <touching (mouse pointer v)?:: list> then game over:: grey end
Result: abc:: looks say [I'm not a Motion block!]:: motion eat (pen color:: pen):: control if <touching (mouse pointer v)?:: list> then game over:: grey end
Possible categories: motion, looks, sound, pen, variables, list, events, control, sensing, operators, custom, custom-arg, extension, grey

Syntax: think [Arbitrary colors?]:: #228b22
Use: changing color
Example: think [Arbitrary colors?]:: #228b22
Result: think [Arbitrary colors?]:: #228b22
Hexadecimal RGB colors like #ff0000 can be used
Extension colors can be used: music, pen, video, tts, text2speech, translate, wedo, wedo2, ev3, microbit, makeymakey, gdxfor, boost

Syntax: abc:: events hat
Use: changing shape
Example: abc:: events hat def:: motion stack ghi:: pen reporter jkl:: operators boolean (::ring)ooh square block(::ring)::ring control
Result: abc:: events hat def:: motion stack ghi:: pen reporter jkl:: operators boolean (::ring)ooh square block(::ring)::ring control
Possible shapes: hat, stack, ring, boolean, reporter, cap, cat

Syntax: mno { ... }:: sensing
Use: creating C blocks and changing category
Example: mno { ... }:: sensing
Result: mno { ... }:: sensing

Syntax: pqr { ... } stu { ... } vwx:: sound
Use: C blocks with multiple branches
Example: pqr { ... } stu { ... } vwx:: sound
Result: pqr { ... } stu { ... } vwx:: sound

Syntax: yz { ... }:: motion cap
Use: C block with cap
Example: yz { ... }:: motion cap
Result: yz { ... }:: motion cap

Syntax: @greenFlag, @stopSign, @turnRight, @turnLeft, @delInput, @addInput, @list, @loopArrow
Use: adding icons
Example: @greenFlag @stopSign @turnRight @turnLeft:: grey @delInput @addInput @list @loopArrow:: grey
Result: @greenFlag @stopSign @turnRight @turnLeft:: grey @delInput @addInput @list @loopArrow:: grey
Example: <@greenFlag pressed?::events>
Result: <@greenFlag pressed?::events>
Example: <@stopSign pressed?::events>
Result: <@stopSign pressed?::events>
Example: create variable [foo] [bar] @delInput @addInput::variables
Result: create variable [foo] [bar] @delInput @addInput::variables
Example: if <=> then repeat{ . . . } @loopArrow::control
Result: if <=> then repeat{ . . . } @loopArrow::control
Example: turn @turnLeft () degrees then @turnRight () degrees::motion
Result: turn @turnLeft () degrees then @turnRight () degrees::motion
Example: add [] to @list[ v]::list
Result: add [] to @list[ v]::list

Syntax: Look,({It's in a ring!}@addInput::ring
Use: Replicate Snap *!'* s "ringify" feature; looks like a reporter but has a difference
Example: Look,({It's in a ring!}@addInput::ring
Result: Look,({It's in a ring!}@addInput::ring
Can be used with colon syntax
Example: (::ring)ooh square block(::ring)::ring control (part of changing shape example)
Result: (::ring)ooh square block(::ring)::ring control

Syntax: -block
Use: Put a hyphen (-) before a block to show a horizontal line through the block (striked-through)
Example: -say [This is striked-through!] for (2) seconds
Result: -say [This is striked-through!] for (2) seconds

Syntax: +block
Use: Put a plus (+) before a block outline or select the block
Example: +say [This is selected!] for (2) seconds
Result: +say [This is selected!] for (2) seconds

Syntax: [[example\]
Use: putting a backslash before a special character will cancel it, allowing special characters like ] inside a text input
Example: say [[example\]]
Result: say [[example\]]

Syntax: \
Use: a backslash is an escape character that cancels special functionality of the next character
Example: say []] (shows a single closing bracket inside brackets)
Result: say []]
Example: say [\]] (shows a backslash inside brackets)
Result: say [\]]
Example: play drum (\(1\) Snare Drum v) for (0.25) beats (allows displaying the escaped parenthesis)
Result: play drum (\(1\) Snare Drum v) for (0.25) beats

Syntax: block { more blocks } optional text (Custom C blocks)
Example: do { ... } in the stage::control
Result: do { ... } in the stage::control

Syntax: {stack block as reporter}
Use: Cause a block to have a stack block as an input
Example: decorate {show}:: custom blocks
Result: decorate {show}:: custom blocks

examples:

---
jump

define jump
repeat (10)
    change y by (4)
end
---
define jump (height) <gravity on?> [message]
---
add [mres] to [list of Scratch team members v]
add [paddle2see] to [list of Scratch team members v]
add [harakou] to [list of Scratch team members v]
say (list of Scratch team members)
---
say (list of Scratch team members)
---
say (list of Scratch team members:: list)
---
when gf clicked
ask [n=] and wait
set [n v] to (answer)
set [i v] to [0]
repeat until <(n) = [1]>
if <((n) mod (2)) = [0]> then
set [n v] to ((n) / (2))
else
set [n v] to (((3) * (n)) + (1))
end
change [i v] by (1)
end
say (i)
---
repeat (10)
    move (5) steps
    stamp
end
repeat (10)
    move (10) steps
    stamp
---
turn cw () degrees
turn right () degrees
---
turn ccw () degrees
turn left () degrees
---
if <<mouse down?> and <(costume [number v]) = [1]>> then
    stamp
end
---
when green flag clicked
forever
    turn cw (15) degrees
    say [Hello!] for (2) seconds
    if <mouse down?> then
        change [mouse clicks v] by (1)
    end
end
---


`;
const SYSTEM_PROMPT = `
You are an experienced Scratch educator.
You should ALWAYS reference scratchblocks syntax when you provide code snippets.

${scratchblocksSyntaxString}

Produce ONLY valid JSON (no markdown) that conforms exactly to the schema.
For steps, you should first think about the functionality of the project, and then break it down into steps.
You should think about the order of the steps to make the tutorial most effective and easy to follow.

• description = one paragraph of what the finished project does.
• sprites     = [{ 
    name, 
    image_path (path to the image file), 
    code_snippets (array of scratchblocks syntax) that belong to this sprite
  }]
• steps      = [{ 
    title (≤20 words), 
    target: { 
      targetType: "sprite" or "backdrop", 
      targetName: name of the target sprite or backdrop + "-" + costume name
    }, 
    code (scratchblocks syntax, use proper indentation and newlines, leave blank if no code is added), 
    explanation
  }]
• extensions = 2–4 bullet ideas to extend the project.
Language level: K12 students.`; 

function buildMessages(userRequest: string): ChatCompletionMessageParam[] {
  return [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user",   content: userRequest }
  ];
}

/* ────────────────────────────────────────────────────────────
   4-A.  JSON-mode (single request, lower latency)
──────────────────────────────────────────────────────────── */



export async function generateWithJsonMode(
  userRequest: string,
  model = "gpt-4o-mini"
): Promise<Tutorial> {
  const response = await openai.chat.completions.create({
    model,
    messages: buildMessages(userRequest),
    response_format: { type: "json_object" }, // JSON-mode ✨
  });

  const data = JSON.parse(response.choices[0].message.content!) as any;
  console.log("Raw data from OpenAI:", data);
  // alert(data);
  
  // Transform the data to match our schema
  if (data.steps && Array.isArray(data.steps)) {
    data.steps = data.steps.map((step: any) => {
      // If target is a string, convert it to the expected object format
      if (typeof step.target === 'string') {
        step.target = {
          targetType: "sprite", // Default assumption
          targetName: step.target
        };
      }
      return step;
    });
  }
  
  if (!validateTutorial(data)) {
    console.error("Validation errors:", validateTutorial.errors);
    throw new Error(ajv.errorsText(validateTutorial.errors));
  }
  return data;
}

/**
 * Generate an analysis of a Scratch project using OpenAI
 * @param projectJson The project.json content from a Scratch project
 * @returns A promise that resolves to the analysis text
 */
export async function generateAnalysis(projectJson: string): Promise<Tutorial> {
  try {
    const parsedProject = JSON.parse(projectJson);
    
    
    const prompt = `
This is a project.json file from a scratch project (.sb3). Create a step by step tutorial for young learners. You should first provide a general description of the project (what it does), and then provide a section of the features and variables, sprites, etc. Then break down the project into bit-size sections, and provide step by step guide on how to build it. At last, provide ideas for extensions of the current questions.

Here's the Scratch project.json file:

${JSON.stringify(parsedProject, null, 2)}

Generate a step by step tutorial for young learners.
`;
    const response = await generateWithJsonMode(prompt);
    console.log(response);

    // Return the generated content
    return response;
  } catch (error) {
    console.error("Error in OpenAI analysis:", error);
    throw new Error("Failed to generate analysis with OpenAI");
  }
}
