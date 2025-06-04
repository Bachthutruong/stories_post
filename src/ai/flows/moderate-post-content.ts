'use server';

/**
 * @fileOverview Flow to moderate post content based on admin-defined keywords.
 *
 * - moderatePostContent - A function that moderates the content of a post.
 * - ModeratePostContentInput - The input type for the moderatePostContent function.
 * - ModeratePostContentOutput - The return type for the moderatePostContent function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ModeratePostContentInputSchema = z.object({
  postDescription: z.string().describe('The description of the post to be moderated.'),
  keywords: z.array(z.string()).describe('A list of keywords defined by the administrator to check against.'),
});
export type ModeratePostContentInput = z.infer<typeof ModeratePostContentInputSchema>;

const ModeratePostContentOutputSchema = z.object({
  isSafe: z.boolean().describe('Whether the post content is safe or not based on the keywords.'),
  flaggedKeywords: z.array(z.string()).describe('The list of keywords found in the post content.'),
});
export type ModeratePostContentOutput = z.infer<typeof ModeratePostContentOutputSchema>;

export async function moderatePostContent(input: ModeratePostContentInput): Promise<ModeratePostContentOutput> {
  return moderatePostContentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'moderatePostContentPrompt',
  input: {schema: ModeratePostContentInputSchema},
  output: {schema: ModeratePostContentOutputSchema},
  prompt: `You are a content moderator responsible for checking if a post description contains any inappropriate content based on a list of keywords.

  Post Description: {{{postDescription}}}
  Keywords: {{#each keywords}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}

  Determine if the post description contains any of the keywords. If it does, mark the post as unsafe and list the keywords found. Otherwise, mark the post as safe.
  Return a JSON object with the \"isSafe\" boolean field and the \"flaggedKeywords\" array field.
  `,
});

const moderatePostContentFlow = ai.defineFlow(
  {
    name: 'moderatePostContentFlow',
    inputSchema: ModeratePostContentInputSchema,
    outputSchema: ModeratePostContentOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
