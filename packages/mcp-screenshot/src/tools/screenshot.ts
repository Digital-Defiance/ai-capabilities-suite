import { z } from "zod";
import { MCPTool } from "@ai-capabilities-suite/mcp-core";
import screenshot from "screenshot-desktop";
import sharp from "sharp";
import { writeFileSync } from "fs";
import { join } from "path";

const screenshotInputSchema = z.object({
  filename: z
    .string()
    .optional()
    .describe("Output filename for the screenshot"),
  format: z
    .enum(["png", "jpg", "webp"])
    .optional()
    .default("png")
    .describe("Image format"),
});

export const screenshotTool: MCPTool = {
  schema: {
    name: "screenshot_full_screen",
    description: "Take a screenshot of the full screen and save it to a file",
    inputSchema: screenshotInputSchema,
  },
  handler: async (input: unknown) => {
    const params = screenshotInputSchema.parse(input);

    try {
      // Take screenshot
      const img = await screenshot();

      // Generate filename if not provided
      const filename =
        params.filename || `screenshot-${Date.now()}.${params.format}`;
      const filepath = join(process.cwd(), filename);

      // Convert and save
      await sharp(img)
        .toFormat(params.format as any)
        .toFile(filepath);

      return {
        success: true,
        filepath,
        message: `Screenshot saved to ${filepath}`,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
};
