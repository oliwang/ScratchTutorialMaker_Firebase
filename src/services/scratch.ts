/**
 * Represents a Scratch project.
 */
export interface ScratchProject {
    /**
     * The name of the project.
     */
    name: string;
    /**
     * The description of the project. Can be instructions or notes.
     */
    description: string;
    /**
     * The resources of the project (e.g., image filenames, sound filenames).
     * Note: Extracting these accurately requires parsing the .sb3 file,
     * which is not implemented here. This field might be empty or contain mock data.
     */
    resources: string[];
     /**
     * The unique identifier of the Scratch project.
     */
     id: string;
}

/**
 * Extracts the Scratch project ID from various URL formats.
 * @param url The URL of the Scratch project.
 * @returns The project ID string or null if not found.
 */
function extractProjectId(url: string): string | null {
    try {
        const urlObject = new URL(url);
        const pathSegments = urlObject.pathname.split('/').filter(Boolean); // Filter out empty strings

        // Check for formats like /projects/<id>/ or /projects/<id>
        const projectsIndex = pathSegments.indexOf('projects');
        if (projectsIndex !== -1 && pathSegments.length > projectsIndex + 1) {
            const potentialId = pathSegments[projectsIndex + 1];
            // Check if it looks like a number (basic validation)
            if (/^\d+$/.test(potentialId)) {
                return potentialId;
            }
        }

        // Check for editor format like /projects/<id>/editor
        if (pathSegments.length >= 2 && /^\d+$/.test(pathSegments[1]) && pathSegments[0] === 'projects' ) {
             return pathSegments[1];
        }

         // Check for turbo warp format like /<id> or /<id>/fullscreen etc
         if (urlObject.hostname === 'turbowarp.org' && pathSegments.length >= 1 && /^\d+$/.test(pathSegments[0])) {
             return pathSegments[0];
         }


    } catch (e) {
        console.error("Error parsing URL:", e);
        return null;
    }
    return null; // No ID found
}


/**
 * Asynchronously retrieves a Scratch project's metadata and .sb3 file blob from the Scratch API using its URL.
 *
 * @param url The URL of the Scratch project (e.g., https://scratch.mit.edu/projects/123456789/).
 * @returns A promise that resolves to an object containing the ScratchProject metadata and the Blob of the .sb3 file.
 * @throws Throws an error if the URL is invalid, the project ID cannot be extracted,
 *         the project is not found, or there's a network issue.
 */
export async function getScratchProjectFromUrl(url: string): Promise<{ projectData: ScratchProject; sb3Blob: Blob | null }> {
    const projectId = extractProjectId(url);

    if (!projectId) {
        throw new Error('Invalid Scratch project URL or could not extract project ID.');
    }

    const apiUrl = `https://api.scratch.mit.edu/projects/${projectId}`;
    const sb3Url = `https://projects.scratch.mit.edu/${projectId}`;
    let sb3Blob: Blob | null = null;

    try {
        // Fetch metadata and .sb3 file concurrently
        const [metaResponse, sb3Response] = await Promise.all([
            fetch(apiUrl),
            fetch(sb3Url)
        ]);

        // Handle metadata response
        if (!metaResponse.ok) {
            if (metaResponse.status === 404) {
                throw new Error(`Scratch project with ID ${projectId} not found.`);
            }
            throw new Error(`Failed to fetch project metadata. Status: ${metaResponse.status}`);
        }
        const data = await metaResponse.json();

        // Handle .sb3 file response
        if (sb3Response.ok) {
            sb3Blob = await sb3Response.blob();
            console.log(`Fetched .sb3 file blob, size: ${sb3Blob.size} bytes`);
        } else {
             console.warn(`Failed to fetch .sb3 file for project ${projectId}. Status: ${sb3Response.status}`);
             // Optionally throw an error here if the .sb3 file is critical
             // throw new Error(`Failed to fetch .sb3 file. Status: ${sb3Response.status}`);
        }


        // Determine the description, preferring instructions, then notes, then providing a default.
        const description = data.description?.instructions || data.description?.notes_and_credits || 'No description provided.';

        // Note: Extracting actual resources would require parsing the .sb3 file blob.
        // We'll return an empty array for now.
        const resources: string[] = [];

        const projectData: ScratchProject = {
            id: projectId,
            name: data.title || `Project ${projectId}`, // Use title or fallback
            description: description,
            resources: resources, // Placeholder
        };

         return { projectData, sb3Blob };

    } catch (error) {
        console.error("Error fetching Scratch project:", error);
        if (error instanceof Error) {
            throw error; // Re-throw known errors
        }
        throw new Error('An unexpected error occurred while fetching project data.');
    }
}
