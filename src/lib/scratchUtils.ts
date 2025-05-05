import type { AssetInfo } from "@/store/atoms";

/**
 * Parses project.json content and extracts asset information.
 * @param projectJsonContent The string content of project.json.
 * @returns An array of AssetInfo objects.
 */
export function extractAssetsFromProjectJson(projectJsonContent: string | null): AssetInfo[] {
    if (!projectJsonContent) {
        return [];
    }

    try {
        const projectJson = JSON.parse(projectJsonContent);
        const assets: AssetInfo[] = [];
        const seenMd5Ext = new Set<string>(); // To avoid duplicates

        // Check targets (sprites and stage)
        if (projectJson.targets && Array.isArray(projectJson.targets)) {
            projectJson.targets.forEach((target: any) => {
                // Extract costumes (images)
                if (target.costumes && Array.isArray(target.costumes)) {
                    target.costumes.forEach((costume: any) => {
                        if (costume.md5ext && !seenMd5Ext.has(costume.md5ext)) {
                            assets.push({
                                name: costume.name || costume.md5ext,
                                md5ext: costume.md5ext,
                                dataFormat: costume.dataFormat || costume.md5ext.split('.').pop() || '',
                                type: 'image',
                            });
                            seenMd5Ext.add(costume.md5ext);
                        }
                    });
                }
                // Extract sounds
                if (target.sounds && Array.isArray(target.sounds)) {
                    target.sounds.forEach((sound: any) => {
                        if (sound.md5ext && !seenMd5Ext.has(sound.md5ext)) {
                             assets.push({
                                name: sound.name || sound.md5ext,
                                md5ext: sound.md5ext,
                                dataFormat: sound.dataFormat || sound.md5ext.split('.').pop() || '',
                                type: 'sound',
                            });
                             seenMd5Ext.add(sound.md5ext);
                        }
                    });
                }
            });
        }

        console.log(`Extracted ${assets.length} unique assets from project.json`);
        return assets;
    } catch (error) {
        console.error("Error parsing project.json for assets:", error);
        return []; // Return empty array on error
    }
}
