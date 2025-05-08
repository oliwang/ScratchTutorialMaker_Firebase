// import { parseSb3Blocks } from 'parse-sb3-blocks';
// const { toScratchblocks } = require('parse-sb3-blocks');
// const { toScratchblocks } = window.parseSB3Blocks;
import type { Tutorial, Step, Sprite } from '@/store/atoms';

const HAT_BLOCKS = [
  'event_whenflagclicked',
  'event_whenkeypressed',
  'event_whengreaterthan',
  'event_whenthisspriteclicked',
  'event_whenstageclicked',
  'event_whenbackdropswitchesto',
  'event_whenbroadcastreceived',
  'control_start_as_clone',
  'procedures_definition',
  'boost_whenColor',
  'boost_whenTilted',
  'ev3_whenButtonPressed',
  'ev3_whenDistanceLessThan',
  'ev3_whenBrightnessLessThan',
  'gdxfor_whenGesture',
  'gdxfor_whenForcePushedOrPulled',
  'gdxfor_whenTilted',
  'makeymakey_whenMakeyKeyPressed',
  'makeymakey_whenCodePressed',
  'microbit_whenButtonPressed',
  'microbit_whenGesture',
  'microbit_whenTilted',
  'microbit_whenPinConnected',
  'wedo2_whenDistance',
  'wedo2_whenTilted',
];

// interface ParsedScratchProject {
//   sprites: {
//     [key: string]: {
//       blocks: string[];
//       costumes: string[];
//     }
//   };
//   stage: {
//     blocks: string[];
//   };
// }
interface Costume {
  name: string;
  dataFormat: string;
  assetId: string;
  md5ext: string;
}

interface Sound {
  name: string;
  dataFormat: string;
  assetId: string;
  md5ext: string;
}

interface ParsedScratchTarget {
  name: string;
  isStage: boolean;
  blocks: string[];
  costumes: Costume[];
  sounds: Sound[];
}

export interface ParsedScratchProject {
  sprites: ParsedScratchTarget[];
  stage: ParsedScratchTarget;
}

/**
 * Parses a project.json file from a Scratch project and extracts code blocks
 * @param projectJson The JSON content of a project.json file
 * @returns An object containing code blocks organized by sprite
 */
export function parseProjectBlocks(projectJson: string): ParsedScratchProject {
  try {
    // Parse the JSON string to an object
    const projectData = JSON.parse(projectJson);

    const { toScratchblocks } = window.parseSB3Blocks;

    // let targets = projectData.targets
    // .filter((target: any) => !target.isStage)
    // .map((target: any) => {
    //   return {
    //     name: target.name,
    //     // blocks: toScratchblocks(target)
    //   }
    // })
    // console.log("Targets:", targets, toScratchblocks);

    let targets = projectData.targets;
    
    let parsedProject: ParsedScratchProject = {
      sprites: [],
      stage: {
        name: 'Stage',
        isStage: true,
        blocks: [],
        costumes: [],
        sounds: []
      }
    };

    targets.forEach((target: any) => {
      let parsedTarget: ParsedScratchTarget = {
        name: target.name,
        isStage: target.isStage,
        blocks: [],
        costumes: [],
        sounds: [],
      };

      parsedTarget.costumes = target.costumes.map((costume: any) => ({
        name: costume.name,
        dataFormat: costume.dataFormat,
        assetId: costume.assetId,
        md5ext: costume.md5ext,
      }));

      parsedTarget.sounds = target.sounds.map((sound: any) => ({
        name: sound.name,
        dataFormat: sound.dataFormat,
        assetId: sound.assetId,
        md5ext: sound.md5ext,
      }));

      const hatBlocks = Object.keys(target.blocks).filter(key => {
        const blockItem = target.blocks[key];
        return blockItem.next && blockItem.topLevel && HAT_BLOCKS.includes(blockItem.opcode);
      });

      hatBlocks.map(hatKey => {
        let blockcode = toScratchblocks(hatKey, target.blocks, "en", {tab:"", variableStyle: "as-needed"});
        parsedTarget.blocks.push(blockcode);
      })

      if (target.isStage) {
        parsedProject.stage = parsedTarget;
      } else {
        parsedProject.sprites.push(parsedTarget);
      }
    });

    console.log(parsedProject);
    
    return parsedProject;
  } catch (error) {
    console.error('Error parsing Scratch project:', error);
    throw new Error('Failed to parse Scratch project');
  }
}
