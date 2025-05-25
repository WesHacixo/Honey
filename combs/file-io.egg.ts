/**
 * File I/O performance comb
 * Tests file system read/write performance
 */

import { ensureDirectory } from "../layers/utils.ts";

export async function main(params: Record<string, unknown> = {}): Promise<Record<string, unknown>> {
  const fileCount = (params.fileCount as number) || 100;
  const fileSize = (params.fileSize as number) || 1024; // bytes
  const testDir = (params.testDir as string) || "./temp-io-test";
  
  console.log(`📁 File I/O test: ${fileCount} files, ${fileSize} bytes each`);
  
  const startTime = performance.now();
  let filesCreated = 0;
  let filesRead = 0;
  let totalBytesWritten = 0;
  let totalBytesRead = 0;
  
  try {
    // Ensure test directory exists
    await ensureDirectory(testDir);
    
    // Generate test data
    const testData = "x".repeat(fileSize);
    
    // Phase 1: Write files
    console.log("📝 Writing files...");
    const writeStartTime = performance.now();
    
    for (let i = 0; i < fileCount; i++) {
      const filename = `${testDir}/test-file-${i}.txt`;
      await Deno.writeTextFile(filename, testData);
      filesCreated++;
      totalBytesWritten += fileSize;
    }
    
    const writeEndTime = performance.now();
    const writeTime = writeEndTime - writeStartTime;
    
    // Phase 2: Read files
    console.log("📖 Reading files...");
    const readStartTime = performance.now();
    
    for (let i = 0; i < fileCount; i++) {
      const filename = `${testDir}/test-file-${i}.txt`;
      const content = await Deno.readTextFile(filename);
      
      if (content.length !== fileSize) {
        throw new Error(`File ${filename} has incorrect size: ${content.length} vs ${fileSize}`);
      }
      
      filesRead++;
      totalBytesRead += content.length;
    }
    
    const readEndTime = performance.now();
    const readTime = readEndTime - readStartTime;
    
    // Phase 3: Cleanup
    console.log("🗑️ Cleaning up...");
    await Deno.remove(testDir, { recursive: true });
    
    const endTime = performance.now();
    const totalTime = endTime - startTime;
    
    console.log(`✅ Completed I/O test in ${totalTime.toFixed(2)}ms`);
    console.log(`📊 Write: ${writeTime.toFixed(2)}ms, Read: ${readTime.toFixed(2)}ms`);
    console.log(`💾 Total data: ${(totalBytesWritten / 1024).toFixed(2)}KB written, ${(totalBytesRead / 1024).toFixed(2)}KB read`);
    
    return {
      success: true,
      fileCount,
      fileSize,
      filesCreated,
      filesRead,
      totalTime,
      writeTime,
      readTime,
      totalBytesWritten,
      totalBytesRead,
      performance: {
        writeThroughput: (totalBytesWritten / 1024 / writeTime) * 1000, // KB/s
        readThroughput: (totalBytesRead / 1024 / readTime) * 1000, // KB/s
        filesPerSecond: (fileCount / totalTime) * 1000,
        iops: ((fileCount * 2) / totalTime) * 1000 // Read + Write operations
      },
      metrics: {
        cpuIntensive: false,
        memoryUsage: "low",
        ioUsage: "high",
        diskSpace: totalBytesWritten
      }
    };
    
  } catch (error) {
    // Cleanup on error
    try {
      await Deno.remove(testDir, { recursive: true });
    } catch {
      // Ignore cleanup errors
    }
    
    return {
      success: false,
      error: error.message,
      filesCreated,
      filesRead,
      totalBytesWritten,
      totalBytesRead
    };
  }
}

// Run the comb if executed directly
if (import.meta.main) {
  const result = await main({ fileCount: 50, fileSize: 2048 });
  console.log(JSON.stringify(result, null, 2));
}

